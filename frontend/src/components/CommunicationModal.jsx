import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Phone, MessageSquare, Send, X, Loader2 } from 'lucide-react';

export default function CommunicationModal({ open, lead, type, onClose }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [callResult, setCallResult] = useState(null);

  const baseUrl = process.env.REACT_APP_BACKEND_URL || 'https://realtor-lead-hub.preview.emergentagent.com';

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
        return 'Make Call';
      case 'sms':
        return 'Send SMS';
      case 'whatsapp':
        return 'Send WhatsApp';
      default:
        return 'Communication';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'call':
        return <Phone size={20} className="text-blue-600" />;
      case 'sms':
        return <MessageSquare size={20} className="text-green-600" />;
      case 'whatsapp':
        return <MessageSquare size={20} className="text-green-600" />;
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
          type: type
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
                  </div>
                )}

                {/* Message Input */}
                {!callResult && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {type === 'call' ? 'Call Message' : 'Message'}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={type === 'call' ? 2 : 4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder={type === 'call' ? 'Message to play during call...' : 'Type your message...'}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {message.length}/160 characters
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
                  
                  {!callResult && (
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
                        : (type === 'call' ? 'Start Call' : 'Send Message')
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