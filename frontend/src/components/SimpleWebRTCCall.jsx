import React, { useState } from 'react';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';

const SimpleWebRTCCall = ({ user, lead, onCallEnd, onCallStart }) => {
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected, error
  const [error, setError] = useState(null);
  const [callResult, setCallResult] = useState(null);
  
  const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const makeCall = async () => {
    if (!lead?.phone) {
      setError('No phone number available');
      return;
    }

    try {
      setCallStatus('calling');
      setError(null);
      console.log('🚀 Initiating WebRTC call via REST API to:', lead.phone);
      
      // Use REST API to initiate WebRTC call directly
      const response = await fetch(`${baseUrl}/api/twilio/webrtc-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          lead_id: lead.id,
          message: `Hello ${lead.first_name || 'there'}, connecting you to your real estate agent.`
        }),
      });

      const result = await response.json();
      console.log('📡 WebRTC call API response:', result);
      
      if (result.status === 'success') {
        setCallResult({
          status: 'success',
          message: 'Call initiated successfully! The lead will receive a call and be connected to your browser.',
          call_sid: result.call_sid,
          call_flow: result.call_flow
        });
        setCallStatus('connected');
        onCallStart?.();
        
        // Show success message for 5 seconds then allow new calls
        setTimeout(() => {
          setCallStatus('idle');
          setCallResult(null);
          onCallEnd?.();
        }, 5000);
      } else {
        throw new Error(result.message || 'Failed to initiate call');
      }

    } catch (err) {
      console.error('❌ Call initiation error:', err);
      setError(err.message);
      setCallStatus('error');
      
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setCallStatus('idle');
        setError(null);
      }, 3000);
    }
  };

  const getStatusDisplay = () => {
    switch (callStatus) {
      case 'calling':
        return 'Initiating call...';
      case 'connected':
        return 'Call initiated successfully';
      case 'error':
        return 'Call failed';
      case 'idle':
      default:
        return 'Ready to call';
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'calling':
        return 'text-blue-600';
      case 'connected':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
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

      {/* Call Success Info */}
      {callResult && callResult.status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm font-medium text-green-800 mb-1">
            ✅ WebRTC Call Initiated
          </div>
          <div className="text-xs text-green-700">
            <div className="mb-1">{callResult.message}</div>
            <div className="font-mono text-xs bg-green-100 p-1 rounded">
              Call SID: {callResult.call_sid}
            </div>
            <div className="mt-1 text-xs">
              📞 {callResult.call_flow}
            </div>
          </div>
        </div>
      )}

      {/* Call Controls */}
      <div className="flex justify-center">
        <button
          onClick={makeCall}
          disabled={callStatus === 'calling' || callStatus === 'connected'}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-colors ${
            callStatus === 'calling' 
              ? 'bg-blue-500' 
              : callStatus === 'connected'
              ? 'bg-green-500'
              : callStatus === 'error'
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          } ${(callStatus === 'calling' || callStatus === 'connected') ? 'cursor-not-allowed' : ''}`}
        >
          {callStatus === 'calling' ? (
            <Loader2 size={24} className="animate-spin" />
          ) : callStatus === 'connected' ? (
            <Phone size={24} />
          ) : (
            <Phone size={24} />
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="text-center">
        <div className="text-xs text-gray-500">
          {callStatus === 'idle' ? (
            <>
              <div className="font-medium text-gray-700 mb-1">WebRTC Call via REST API</div>
              <div>Click to initiate call. Lead will be connected to your browser.</div>
            </>
          ) : callStatus === 'connected' ? (
            <div className="text-green-600">
              🎉 Call successfully initiated! Lead should receive call shortly.
            </div>
          ) : callStatus === 'calling' ? (
            <div className="text-blue-600">
              📞 Setting up call connection...
            </div>
          ) : (
            <div className="text-red-600">
              ❌ Call failed. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleWebRTCCall;