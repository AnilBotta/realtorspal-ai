import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Phone, MessageSquare, Send, X, Loader2, Headphones, Zap, Mail } from 'lucide-react';
import WebRTCCalling from './WebRTCCalling';
import SimpleWebRTCCall from './SimpleWebRTCCall';
import WebRTCBrowserCall from './WebRTCBrowserCall';
import EmailModal from './EmailModal';

export default function CommunicationModal({ open, lead, type, onClose, user }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [callResult, setCallResult] = useState(null);
  const [callMode, setCallMode] = useState('simple'); // 'bridge', 'webrtc', 'simple'

  const baseUrl = process.env.REACT_APP_BACKEND_URL || 'https://crm-partial-leads.preview.emergentagent.com';

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setMessage(getDefaultMessage());
      setCallResult(null);
    }
  }, [open, type, lead]);

  const getDefaultMessage = () => {
    if (!lead) return '';
    
    switch (type) {
      case 'call':
        return `Connecting you to your real estate agent now. Please hold for a moment.`;
      case 'sms':
        return `Hi ${lead.first_name || 'there'}, this is your real estate agent. I wanted to follow up on your property interest. Are you available to discuss your requirements?`;
      case 'whatsapp':
        return `Hello ${lead.first_name || 'there'}! 👋 This is your real estate agent. I'd love to help you find your perfect property. When would be a good time to chat?`;
      default:
        return '';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'call':
        return callMode === 'webrtc' ? 'WebRTC Call (Full)' : 
               callMode === 'simple' ? 'Outbound Call (Simple)' : 'Voice Bridge Call';
      case 'sms':
        return 'Send SMS';
      case 'whatsapp':
        return 'Send WhatsApp';
      case 'email':
        return 'Send Email';
      default:
        return 'Communication';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'call':
        return callMode === 'webrtc' ? 
          <Headphones size={20} className="text-purple-600" /> : 
          callMode === 'simple' ?
          <Zap size={20} className="text-blue-600" /> :
          <Phone size={20} className="text-blue-600" />;
      case 'sms':
        return <MessageSquare size={20} className="text-green-600" />;
      case 'whatsapp':
        return <MessageSquare size={20} className="text-green-600" />;
      case 'email':
        return <Mail size={20} className="text-blue-600" />;
      default:
        return <Phone size={20} />;
    }
  };

  const handleCommunication = async () => {
    if (!lead || !message.trim()) return;

    setSending(true);
    try {
      let endpoint = '';
      let payload = {};

      switch (type) {
        case 'call':
          endpoint = '/api/twilio/call';
          payload = { lead_id: lead.id, message: message.trim() };
          break;
        case 'sms':
          endpoint = '/api/twilio/sms';
          payload = { lead_id: lead.id, message: message.trim() };
          break;
        case 'whatsapp':
          endpoint = '/api/twilio/whatsapp';
          payload = { lead_id: lead.id, message: message.trim() };
          break;
        default:
          throw new Error('Invalid communication type');
      }

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setCallResult({
          status: 'success',
          message: result.message,
          type: type
        });
        
        // Auto-close after 3 seconds for non-call actions
        if (type !== 'call') {
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      } else {
        setCallResult({
          status: 'error',
          message: result.message || 'Communication failed',
          type: type,
          setup_instructions: result.setup_instructions // Include setup instructions if available
        });
      }
    } catch (error) {
      setCallResult({
        status: 'error',
        message: error.message || 'Communication failed',
        type: type
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setCallResult(null);
    onClose();
  };

  if (!lead) return null;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getIcon()}
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        {getTitle()}
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">
                        {lead.first_name} {lead.last_name} • {lead.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Lead Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {lead.property_type && `${lead.property_type} • `}
                    {lead.neighborhood && `${lead.neighborhood} • `}
                    {lead.price_max && `Budget: $${lead.price_max.toLocaleString()}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Stage: {lead.stage} • Priority: {lead.priority || 'Medium'}
                  </div>
                </div>

                {/* Success/Error Display */}
                {callResult && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    callResult.status === 'success' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className={`text-sm font-medium ${
                      callResult.status === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {callResult.status === 'success' ? '✓ Success!' : '✗ Error'}
                    </div>
                    <div className={`text-xs mt-1 ${
                      callResult.status === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {callResult.message}
                    </div>
                    {/* Show setup instructions if available */}
                    {callResult.setup_instructions && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                        <div className="font-medium mb-1">Setup Instructions:</div>
                        <div className="space-y-1">
                          <div>1. {callResult.setup_instructions.step1}</div>
                          <div>2. {callResult.setup_instructions.step2}</div>
                          <div>3. {callResult.setup_instructions.step3}</div>
                          <div>4. {callResult.setup_instructions.step4}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Call Mode Selection for Call Type */}
                {type === 'call' && !callResult && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Call Method</div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCallMode('bridge')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          callMode === 'bridge' 
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                            : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                        }`}
                      >
                        <Phone size={16} className="inline mr-1" />
                        Voice Bridge
                      </button>
                      <button
                        onClick={() => setCallMode('simple')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          callMode === 'simple' 
                            ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                            : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                        }`}
                      >
                        <Zap size={16} className="inline mr-1" />
                        Outbound (Simple)
                      </button>
                      <button
                        onClick={() => setCallMode('webrtc')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          callMode === 'webrtc' 
                            ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                            : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                        }`}
                      >
                        <Headphones size={16} className="inline mr-1" />
                        WebRTC (Full)
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {callMode === 'bridge' 
                        ? 'Lead receives call, hears message, then connected to your phone'
                        : callMode === 'simple'
                        ? 'Direct outbound call - Lead receives call from your Twilio number'
                        : 'Full WebRTC - Call directly from browser with microphone and speakers (requires API keys)'
                      }
                    </div>
                  </div>
                )}

                {/* Simple WebRTC Interface */}
                {type === 'call' && callMode === 'simple' && !callResult && (
                  <div className="mb-4">
                    <SimpleWebRTCCall 
                      user={user} 
                      lead={lead}
                      onCallStart={() => {
                        setCallResult({
                          status: 'success',
                          message: 'Simple WebRTC call initiated successfully',
                          type: 'simple_webrtc'
                        });
                      }}
                      onCallEnd={() => {
                        // Keep modal open for call summary if needed
                      }}
                    />
                  </div>
                )}

                {/* Full WebRTC Calling Interface */}
                {type === 'call' && callMode === 'webrtc' && !callResult && (
                  <div className="mb-4">
                    <WebRTCBrowserCall 
                      user={user} 
                      lead={communicationLead || lead}
                      onCallStart={() => {
                        setCallResult({
                          status: 'success',
                          message: 'WebRTC call started successfully',
                          type: 'webrtc'
                        });
                      }}
                      onCallEnd={() => {
                        // Keep modal open for call summary if needed
                      }}
                    />
                  </div>
                )}

                {/* Message Input - only for bridge calls, SMS, WhatsApp */}
                {!callResult && ((type === 'call' && callMode === 'bridge') || type !== 'call') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {type === 'call' ? 'Bridge Message' : 'Message'}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={type === 'call' ? 2 : 4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder={type === 'call' ? 'Message to play before connecting to agent...' : 'Type your message...'}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {type === 'call' ? 'This message will play to the lead before connecting them to you' : `${message.length}/160 characters`}
                    </div>
                  </div>
                )}

                {/* Call Flow Info - only for bridge calls */}
                {type === 'call' && callMode === 'bridge' && !callResult && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-700">
                      📞 <strong>Voice Bridge:</strong> The lead will receive a call, hear your message, then be connected directly to you for a live conversation.
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {callResult ? 'Close' : 'Cancel'}
                  </button>
                  
                  {!callResult && ((type === 'call' && callMode === 'bridge') || type !== 'call') && (
                    <button
                      onClick={handleCommunication}
                      disabled={sending || !message.trim()}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
                        type === 'call' 
                          ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300' 
                          : 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                      }`}
                    >
                      {sending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        type === 'call' ? <Phone size={16} /> : <Send size={16} />
                      )}
                      {sending 
                        ? (type === 'call' ? 'Calling...' : 'Sending...') 
                        : (type === 'call' ? 'Start Bridge Call' : 'Send Message')
                      }
                    </button>
                  )}
                </div>

                {/* Additional WhatsApp Info */}
                {type === 'whatsapp' && !callResult && (
                  <div className="mt-3 p-2 bg-green-50 rounded-lg">
                    <div className="text-xs text-green-700">
                      💡 <strong>Note:</strong> WhatsApp requires the recipient to have your business number saved and opt-in to receive messages.
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}