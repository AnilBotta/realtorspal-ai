import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Device } from '@twilio/voice-sdk';

const WebRTCBrowserCall = ({ user, lead, onCallEnd, onCallStart }) => {
  const [device, setDevice] = useState(null);
  const [call, setCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, ringing, connected, disconnected
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  
  const deviceRef = useRef(null);
  const baseUrl = process.env.REACT_APP_BACKEND_URL;

  // Initialize Twilio Device when component mounts
  useEffect(() => {
    initializeTwilioDevice();
    
    return () => {
      // Cleanup on unmount
      if (deviceRef.current) {
        deviceRef.current.destroy();
      }
    };
  }, [user]);

  const initializeTwilioDevice = async () => {
    try {
      console.log('🔵 Initializing Twilio Device...');
      
      // Get access token from backend
      const response = await fetch(`${baseUrl}/api/twilio/access-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      const result = await response.json();
      console.log('Token response:', result);

      if (result.status === 'success' && result.token) {
        setToken(result.token);
        
        // Create Twilio Device with the token
        const twilioDevice = new Device(result.token, {
          logLevel: 1,
          codecPreferences: ['opus', 'pcmu'],
          // Set TwiML app URL for outgoing calls
          edge: 'ashburn',
        });

        // Store TwiML URL for making calls
        twilioDevice._twimlAppUrl = result.twiml_app_url || `${baseUrl}/api/twiml/webrtc-outbound`;

        // Setup event listeners
        twilioDevice.on('registered', () => {
          console.log('✅ Twilio Device registered');
        });

        twilioDevice.on('error', (error) => {
          console.error('❌ Twilio Device error:', error);
          setError(error.message);
          setCallStatus('error');
        });

        twilioDevice.on('incoming', (incomingCall) => {
          console.log('📞 Incoming call received');
          // Handle incoming calls if needed
        });

        // Register the device
        await twilioDevice.register();
        
        setDevice(twilioDevice);
        deviceRef.current = twilioDevice;
        
        console.log('✅ Twilio Device initialized successfully');
        console.log('   TwiML App URL:', twilioDevice._twimlAppUrl);
      } else {
        throw new Error(result.message || 'Failed to get access token');
      }
    } catch (err) {
      console.error('Failed to initialize Twilio Device:', err);
      setError(err.message);
      setCallStatus('error');
    }
  };

  const makeCall = async () => {
    if (!device || !lead?.phone) {
      setError('Device not ready or no phone number');
      return;
    }

    try {
      setCallStatus('connecting');
      setError(null);
      console.log('🚀 Making call to:', lead.phone);

      // Make the call with lead_id parameter
      const outgoingCall = await device.connect({
        params: {
          lead_id: lead.id,
          To: lead.phone,
        }
      });

      setCall(outgoingCall);

      // Setup call event listeners
      outgoingCall.on('accept', () => {
        console.log('📞 Call accepted');
        setCallStatus('ringing');
      });

      outgoingCall.on('disconnect', () => {
        console.log('📵 Call disconnected');
        setCallStatus('disconnected');
        setCall(null);
        onCallEnd?.();
        
        // Reset to idle after 3 seconds
        setTimeout(() => {
          setCallStatus('idle');
        }, 3000);
      });

      outgoingCall.on('cancel', () => {
        console.log('❌ Call cancelled');
        setCallStatus('idle');
        setCall(null);
      });

      outgoingCall.on('reject', () => {
        console.log('❌ Call rejected');
        setCallStatus('idle');
        setCall(null);
      });

      outgoingCall.on('error', (error) => {
        console.error('❌ Call error:', error);
        setError(error.message);
        setCallStatus('error');
        setCall(null);
      });

      // Once connected
      outgoingCall.on('reconnecting', () => {
        console.log('🔄 Call reconnecting...');
      });

      outgoingCall.on('reconnected', () => {
        console.log('✅ Call reconnected');
      });

      // Call is fully connected
      setTimeout(() => {
        if (outgoingCall.status() === 'open') {
          setCallStatus('connected');
          onCallStart?.();
        }
      }, 2000);

    } catch (err) {
      console.error('❌ Failed to make call:', err);
      setError(err.message);
      setCallStatus('error');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setCallStatus('idle');
        setError(null);
      }, 3000);
    }
  };

  const hangUp = () => {
    if (call) {
      call.disconnect();
      setCall(null);
      setCallStatus('disconnected');
      
      setTimeout(() => {
        setCallStatus('idle');
      }, 2000);
    }
  };

  const toggleMute = () => {
    if (call) {
      call.mute(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (call) {
      // Set remote audio volume
      const remoteAudio = call.getRemoteStream();
      if (remoteAudio) {
        // Volume control through Audio element
        document.querySelectorAll('audio').forEach(audio => {
          audio.volume = newVolume;
        });
      }
    }
  };

  const getStatusDisplay = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'ringing':
        return 'Ringing...';
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Call ended';
      case 'error':
        return 'Call failed';
      case 'idle':
      default:
        return 'Ready to call';
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connecting':
      case 'ringing':
        return 'text-blue-600';
      case 'connected':
        return 'text-green-600';
      case 'disconnected':
      case 'error':
        return 'text-red-600';
      case 'idle':
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      {/* Status */}
      <div className="text-center">
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusDisplay()}
        </div>
        {error && (
          <div className="text-xs text-red-500 mt-1">
            {error}
          </div>
        )}
        {!device && !error && (
          <div className="text-xs text-gray-500 mt-1">
            Initializing...
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
      <div className="flex justify-center items-center gap-4">
        {/* Mute Button */}
        {callStatus === 'connected' && (
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-colors ${
              isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}

        {/* Call/Hang Up Button */}
        <button
          onClick={callStatus === 'connected' || callStatus === 'ringing' ? hangUp : makeCall}
          disabled={!device || callStatus === 'connecting' || callStatus === 'error'}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-colors ${
            callStatus === 'connected' || callStatus === 'ringing'
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          } ${(!device || callStatus === 'connecting' || callStatus === 'error') ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {callStatus === 'connected' || callStatus === 'ringing' ? (
            <PhoneOff size={24} />
          ) : (
            <Phone size={24} />
          )}
        </button>
      </div>

      {/* Volume Control */}
      {callStatus === 'connected' && (
        <div className="flex items-center gap-2 px-4">
          {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1"
          />
          <span className="text-xs text-gray-600">{Math.round(volume * 100)}%</span>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center">
        <div className="text-xs text-gray-500">
          {callStatus === 'idle' && device ? (
            <>
              <div className="font-medium text-gray-700 mb-1">WebRTC Browser Calling</div>
              <div>Click to call the lead through your browser</div>
            </>
          ) : callStatus === 'connected' ? (
            <div className="text-green-600">
              🎉 Call in progress - Use your microphone to speak
            </div>
          ) : callStatus === 'connecting' || callStatus === 'ringing' ? (
            <div className="text-blue-600">
              📞 Calling {lead?.phone}...
            </div>
          ) : callStatus === 'disconnected' ? (
            <div className="text-gray-600">
              Call ended
            </div>
          ) : callStatus === 'error' ? (
            <div className="text-red-600">
              ❌ Call failed. Please try again.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default WebRTCBrowserCall;
