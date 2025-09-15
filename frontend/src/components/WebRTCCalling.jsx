import React, { useState, useEffect, useRef } from 'react';
import { Device } from '@twilio/voice-sdk';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';

const WebRTCCalling = ({ user, lead, onCallEnd, onCallStart }) => {
  const [device, setDevice] = useState(null);
  const [call, setCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, ringing, connected, error, setup_required
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [error, setError] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  
  const deviceRef = useRef(null);
  const callTimerRef = useRef(null);
  const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Initialize Twilio Device
  useEffect(() => {
    initializeDevice();
    return () => {
      cleanup();
    };
  }, [user.id]);

  // Call timer
  useEffect(() => {
    if (callStatus === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      if (callStatus === 'idle') {
        setCallDuration(0);
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callStatus]);

  const initializeDevice = async () => {
    try {
      setCallStatus('connecting');
      setError(null);
      console.log('Starting WebRTC device initialization...');

      // Check if browser supports WebRTC
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('WebRTC is not supported in this browser. Please use Chrome, Firefox, or Safari.');
      }

      // Request microphone permission
      try {
        console.log('Requesting microphone permission...');
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permission granted');
      } catch (permissionError) {
        console.error('Microphone permission error:', permissionError);
        throw new Error('Microphone permission is required for WebRTC calls. Please allow microphone access and try again.');
      }

      // Get access token from backend
      console.log('Requesting access token for user:', user.id);
      const response = await fetch(`${baseUrl}/api/twilio/access-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      const result = await response.json();
      console.log('Access token response:', result);
      
      if (result.status === 'setup_required') {
        console.log('Setup required - missing API keys');
        setError('Missing Twilio API Keys. Please add them in Settings.');
        setCallStatus('setup_required');
        return;
      }
      
      if (result.status === 'error') {
        console.error('Access token error:', result);
        throw new Error(result.message || 'Failed to get access token');
      }
      
      if (result.status !== 'success') {
        console.error('Unexpected access token response:', result);
        throw new Error(result.message || 'Failed to get access token');
      }

      console.log('Creating Twilio Device with token...');
      console.log('Token preview:', result.token.substring(0, 50) + '...');
      
      // Create and setup Twilio Device with minimal configuration to avoid WebSocket issues
      const twilioDevice = new Device(result.token, {
        logLevel: 'debug',  // Maximum logging to see what's happening
        // Minimize features to avoid connection issues
        allowIncomingWhileBusy: false,
        closeProtection: false,
        // Use secure connections
        edge: 'sydney'  // Use a single edge server
      });

      console.log('Setting up device event listeners...');
      // Device event listeners
      twilioDevice.on('ready', () => {
        console.log('✅ Twilio Device ready!');
        setCallStatus('idle');
        setDevice(twilioDevice);
        deviceRef.current = twilioDevice;
      });

      twilioDevice.on('error', (error) => {
        console.error('❌ Twilio Device error:', error);
        let errorMessage = 'Device error occurred';
        
        // Handle error object properly
        if (error && typeof error === 'object') {
          if (error.message) {
            errorMessage = error.message;
          } else if (error.description) {
            errorMessage = error.description;
          } else if (error.toString) {
            errorMessage = error.toString();
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        // Provide specific error messages for common issues
        if (errorMessage.includes('31208')) {
          errorMessage = 'Unable to connect to Twilio. Please check your internet connection.';
        } else if (errorMessage.includes('31400') || errorMessage.includes('20101')) {
          errorMessage = 'Invalid Twilio credentials. Please check your API Keys in Settings.';
        } else if (errorMessage.includes('AccessTokenInvalid')) {
          errorMessage = 'Twilio access token is invalid. Please verify your API Keys in Settings.';
        }
        
        setError(errorMessage);
        setCallStatus('error');
      });

      twilioDevice.on('incoming', (incomingCall) => {
        console.log('📞 Incoming WebRTC call received:', incomingCall);
        
        // This is the call from the lead (routed through our TwiML)
        setCall(incomingCall);
        setCallStatus('ringing');
        
        // Auto-accept the incoming call since we initiated it
        console.log('Auto-accepting incoming call...');
        incomingCall.accept();
        
        // Set up call event listeners
        incomingCall.on('accept', () => {
          console.log('✅ WebRTC call connected!');
          setCallStatus('connected');
          onCallStart?.();
        });

        incomingCall.on('disconnect', () => {
          console.log('📞 WebRTC call disconnected');
          setCallStatus('idle');
          setCall(null);
          onCallEnd?.();
        });

        incomingCall.on('cancel', () => {
          console.log('📞 WebRTC call cancelled');
          setCallStatus('idle');
          setCall(null);
          onCallEnd?.();
        });

        incomingCall.on('error', (error) => {
          console.error('❌ WebRTC call error:', error);
          let errorMessage = 'Call failed';
          
          if (error && typeof error === 'object') {
            if (error.message) {
              errorMessage = error.message;
            } else if (error.description) {
              errorMessage = error.description;
            }
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          setError(errorMessage);
          setCallStatus('error');
          setCall(null);
          onCallEnd?.();
        });
      });

      console.log('Registering Twilio Device...');
      // Register the device
      await twilioDevice.register();
      console.log('✅ Device registered successfully');

    } catch (err) {
      console.error('❌ Device initialization error:', err);
      setError(err.message);
      setCallStatus('error');
    }
  };

  const makeCall = async () => {
    if (!device || !lead?.phone) {
      const errorMsg = `Device not ready (${!!device}) or no phone number (${!!lead?.phone})`;
      console.error('❌ Cannot make call:', errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setCallStatus('connecting');
      setError(null);
      console.log('🚀 Initiating WebRTC call to:', lead.phone);
      
      // Use REST API to initiate WebRTC call
      const response = await fetch(`${baseUrl}/api/twilio/webrtc-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          lead_id: lead.id,
          message: `Hello ${lead.first_name || 'there'}, this is your real estate agent calling about your property inquiry.`
        }),
      });

      const result = await response.json();
      console.log('📡 WebRTC call API response:', result);
      
      if (result.status !== 'success') {
        console.error('❌ Call initiation failed:', result);
        throw new Error(result.message || 'Failed to initiate call');
      }

      console.log('✅ WebRTC call initiated via REST API:', result);
      console.log('📞 Call flow: Twilio calls', lead.phone, '→ Lead answers → Connected to your browser');
      
      // The call is now initiated via Twilio REST API
      // The lead will receive a call and be connected to our WebRTC client
      setCallStatus('ringing');
      
      // Set up a timeout to change status if call doesn't connect within 30 seconds
      const callTimeout = setTimeout(() => {
        if (callStatus === 'ringing') {
          console.warn('⚠️ Call timeout - no connection after 30 seconds');
          setCallStatus('waiting');
          setError('Call initiated but no connection yet. The lead may not have answered.');
        }
      }, 30000);

      // Store timeout reference to clear it if call connects
      if (callTimerRef.current) {
        clearTimeout(callTimerRef.current);
      }
      callTimerRef.current = callTimeout;

      // Log the call activity in the lead notes
      try {
        await fetch(`${baseUrl}/api/leads/${lead.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notes: `${lead.notes || ''}\n\n[WebRTC Call] Initiated REST API call to ${lead.phone} - Call SID: ${result.call_sid} - ${new Date().toISOString()}`
          }),
        });
        console.log('📝 Call activity logged in lead notes');
      } catch (logError) {
        console.warn('⚠️ Failed to log call activity:', logError);
      }

    } catch (err) {
      console.error('❌ Call initiation error:', err);
      setError(err.message);
      setCallStatus('error');
    }
  };

  const hangUp = () => {
    if (call) {
      call.disconnect();
      setCall(null);
    }
    setCallStatus('idle');
    onCallEnd?.();
  };

  const toggleMute = () => {
    if (call) {
      call.mute(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => {
    // Note: Speaker control via Web Audio API would need additional implementation
    setIsSpeakerOn(!isSpeakerOn);
    // In a real implementation, you'd control audio output device here
  };

  const cleanup = () => {
    if (call) {
      call.disconnect();
    }
    if (deviceRef.current) {
      deviceRef.current.disconnectAll();
      deviceRef.current.destroy();
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusDisplay = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Initializing...';
      case 'ringing':
        return 'Calling...';
      case 'connected':
        return `Connected - ${formatDuration(callDuration)}`;
      case 'error':
        return 'Error';
      case 'setup_required':
        return 'Setup Required';
      case 'waiting':
        return 'Waiting for connection...';
      case 'idle':
      default:
        return 'Ready to call';
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connecting':
        return 'text-yellow-600';
      case 'ringing':
        return 'text-blue-600';
      case 'connected':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'setup_required':
        return 'text-orange-600';
      case 'waiting':
        return 'text-blue-600';
      case 'idle':
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      {/* Call Status */}
      <div className="text-center">
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusDisplay()}
        </div>
        {error && (
          <div className="text-xs text-red-500 mt-1">
            {error}
          </div>
        )}
      </div>

      {/* Lead Info */}
      <div className="text-center bg-gray-50 rounded-lg p-3">
        <div className="font-medium text-gray-900">
          {lead?.first_name} {lead?.last_name}
        </div>
        <div className="text-sm text-gray-600">
          {lead?.phone}
        </div>
      </div>

      {/* Call Controls */}
      <div className="flex justify-center space-x-4">
        {/* Main Call Button */}
        {(callStatus === 'idle' && device) ? (
          <button
            onClick={makeCall}
            className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <Phone size={24} />
          </button>
        ) : callStatus === 'connecting' ? (
          <button
            disabled
            className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-white"
          >
            <Loader2 size={24} className="animate-spin" />
          </button>
        ) : callStatus === 'setup_required' ? (
          <button
            disabled
            className="w-16 h-16 bg-orange-300 rounded-full flex items-center justify-center text-white"
          >
            <Phone size={24} />
          </button>
        ) : ['ringing', 'connected', 'waiting'].includes(callStatus) ? (
          <button
            onClick={hangUp}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <PhoneOff size={24} />
          </button>
        ) : callStatus === 'error' ? (
          <button
            onClick={initializeDevice}
            className="w-16 h-16 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <Phone size={24} />
          </button>
        ) : (
          <button
            disabled
            className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-white"
          >
            <Loader2 size={24} className="animate-spin" />
          </button>
        )}

        {/* Mute Button */}
        {callStatus === 'connected' && (
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}

        {/* Speaker Button */}
        {callStatus === 'connected' && (
          <button
            onClick={toggleSpeaker}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isSpeakerOn 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        )}
      </div>

      {/* Device Status */}
      <div className="text-center">
        <div className="text-xs text-gray-500">
          {device ? (
            <span className="text-green-600">🟢 WebRTC Ready</span>
          ) : (
            <span className="text-orange-600">🟡 Initializing WebRTC...</span>
          )}
        </div>
        {callStatus === 'idle' && device && (
          <div className="text-xs text-gray-400 mt-1">
            Make sure your microphone is working and speakers are on
          </div>
        )}
      </div>

      {/* Twilio Setup Instructions */}
      {callStatus === 'setup_required' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm font-medium text-orange-800 mb-2">
            🔧 Twilio API Keys Required for WebRTC
          </div>
          <div className="text-xs text-orange-700 space-y-1">
            <div><strong>1.</strong> Go to <a href="https://console.twilio.com/us1/develop/api-keys" target="_blank" rel="noopener noreferrer" className="underline">Twilio Console → API Keys</a></div>
            <div><strong>2.</strong> Create new API Key with Voice grants enabled</div>
            <div><strong>3.</strong> Copy API Key SID and Secret to Settings</div>
            <div><strong>4.</strong> Make sure Account SID is also configured</div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => window.open('/settings', '_blank')}
              className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
            >
              Open Settings
            </button>
            <button
              onClick={() => window.open('https://console.twilio.com/us1/develop/api-keys', '_blank')}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              Create API Keys
            </button>
          </div>
        </div>
      )}

      {/* WebRTC Requirements Info */}
      {callStatus === 'error' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-xs text-yellow-800">
            <strong>WebRTC Issue:</strong>
            <div className="mt-1 whitespace-pre-line text-xs">
              {error}
            </div>
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
              <strong>Alternative:</strong> Try using "Voice Bridge" calling method instead, which works with basic Twilio credentials.
            </div>
            <div className="mt-2">
              <strong>WebRTC Requirements:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Chrome, Firefox, or Safari browser</li>
                <li>• Allow microphone access when prompted</li>
                <li>• Stable internet connection</li>
                <li>• Twilio API Keys (advanced setup required)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebRTCCalling;