import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Mail, X, Send, Loader2, Sparkles, History, FileText, Paperclip } from 'lucide-react';

export default function EmailModal({ open, lead, onClose, user }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [emailTemplate, setEmailTemplate] = useState('follow_up');
  const [tone, setTone] = useState('professional');
  const [showHistory, setShowHistory] = useState(false);
  const [emailHistory, setEmailHistory] = useState([]);
  const [llmProvider, setLlmProvider] = useState('emergent');
  
  const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    if (open && lead) {
      // Reset form when modal opens
      setSubject('');
      setBody('');
      setEmailResult(null);
      setShowHistory(false);
      
      // Load email history
      loadEmailHistory();
    }
  }, [open, lead]);

  const loadEmailHistory = async () => {
    if (!lead) return;
    
    try {
      const response = await fetch(`${baseUrl}/api/email/history/${lead.id}`);
      const history = await response.json();
      setEmailHistory(history || []);
    } catch (error) {
      console.error('Failed to load email history:', error);
      setEmailHistory([]);
    }
  };

  const handleDraftEmail = async () => {
    if (!lead) return;
    
    try {
      setDrafting(true);
      setEmailResult(null);
      
      const response = await fetch(
        `${baseUrl}/api/email/draft?lead_id=${lead.id}&email_template=${emailTemplate}&tone=${tone}`
      );
      const result = await response.json();
      
      if (result.status === 'success') {
        setSubject(result.subject);
        setBody(result.body);
        setEmailResult({
          status: 'success',
          message: `Email drafted using ${result.template_used} template with ${result.tone} tone`,
          type: 'draft'
        });
      } else {
        setEmailResult({
          status: 'error',
          message: result.message || 'Failed to draft email',
          type: 'draft'
        });
      }
    } catch (error) {
      console.error('Draft email error:', error);
      setEmailResult({
        status: 'error',
        message: 'Failed to draft email with LLM',
        type: 'draft'
      });
    } finally {
      setDrafting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      setEmailResult({
        status: 'error',
        message: 'Please fill in both subject and body',
        type: 'send'
      });
      return;
    }
    
    try {
      setSending(true);
      setEmailResult(null);
      
      const response = await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: lead.id,
          subject: subject,
          body: body,
          email_template: emailTemplate,
          llm_provider: llmProvider
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setEmailResult({
          status: 'success',
          message: result.message,
          type: 'send',
          email_id: result.email_id
        });
        
        // Clear form after successful send
        setTimeout(() => {
          setSubject('');
          setBody('');
          setEmailResult(null);
          loadEmailHistory(); // Refresh history
        }, 3000);
      } else {
        setEmailResult({
          status: 'error',
          message: result.message || 'Failed to send email',
          type: 'send',
          setup_required: result.setup_required
        });
      }
    } catch (error) {
      console.error('Send email error:', error);
      setEmailResult({
        status: 'error',
        message: 'Failed to send email',
        type: 'send'
      });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'draft': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!lead) return null;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Mail size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-medium text-gray-900">
                        Send Email
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">
                        To: {lead.first_name} {lead.last_name} ({lead.email || 'No email address'})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Email History"
                    >
                      <History size={20} />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-6">
                  {/* Main Email Form */}
                  <div className={`${showHistory ? 'w-2/3' : 'w-full'} space-y-4`}>
                    
                    {/* Email Templates & LLM Options */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={16} className="text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">AI-Powered Email Drafting</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-gray-600 font-medium">Template</label>
                          <select 
                            className="w-full px-2 py-1 text-sm rounded border mt-1"
                            value={emailTemplate}
                            onChange={(e) => setEmailTemplate(e.target.value)}
                          >
                            <option value="follow_up">Follow Up</option>
                            <option value="new_listing">New Listing</option>
                            <option value="appointment_reminder">Appointment Reminder</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-600 font-medium">Tone</label>
                          <select 
                            className="w-full px-2 py-1 text-sm rounded border mt-1"
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                          >
                            <option value="professional">Professional</option>
                            <option value="friendly">Friendly</option>
                            <option value="formal">Formal</option>
                            <option value="casual">Casual</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-600 font-medium">LLM Provider</label>
                          <select 
                            className="w-full px-2 py-1 text-sm rounded border mt-1"
                            value={llmProvider}
                            onChange={(e) => setLlmProvider(e.target.value)}
                          >
                            <option value="emergent">Emergent LLM</option>
                            <option value="openai">OpenAI GPT</option>
                            <option value="claude">Claude</option>
                            <option value="gemini">Gemini</option>
                          </select>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleDraftEmail}
                        disabled={drafting || !lead.email}
                        className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {drafting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Sparkles size={16} />
                        )}
                        {drafting ? 'Drafting...' : 'Generate Email with AI'}
                      </button>
                    </div>

                    {/* Email Form */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Subject</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Email subject..."
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Message</label>
                        <textarea
                          className="w-full px-3 py-2 border rounded-lg mt-1 h-48 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Type your email message here..."
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Character count: {body.length} | Word count: {body.split(/\s+/).filter(w => w).length}
                        </div>
                      </div>
                    </div>

                    {/* Results Display */}
                    {emailResult && (
                      <div className={`p-3 rounded-lg border ${
                        emailResult.status === 'success' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className={`text-sm font-medium ${
                          emailResult.status === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {emailResult.status === 'success' ? '✓ Success!' : '✗ Error'}
                        </div>
                        <div className={`text-xs mt-1 ${
                          emailResult.status === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {emailResult.message}
                        </div>
                        {emailResult.setup_required && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                            <strong>Setup Required:</strong> Please configure SMTP settings in Settings → SMTP Email Configuration
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSendEmail}
                        disabled={sending || !subject.trim() || !body.trim() || !lead.email}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {sending ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                        {sending ? 'Sending...' : 'Send Email'}
                      </button>
                      
                      <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Email History Sidebar */}
                  {showHistory && (
                    <div className="w-1/3 border-l pl-6">
                      <div className="flex items-center gap-2 mb-4">
                        <History size={16} className="text-gray-600" />
                        <h3 className="font-medium text-gray-900">Email History</h3>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{emailHistory.length}</span>
                      </div>
                      
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {emailHistory.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Mail size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No email history</p>
                          </div>
                        ) : (
                          emailHistory.map((email) => (
                            <div key={email.id} className={`p-3 rounded-lg border ${getStatusColor(email.status)}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium uppercase">{email.status}</span>
                                <span className="text-xs">{formatDate(email.created_at)}</span>
                              </div>
                              <div className="text-sm font-medium mb-1 truncate" title={email.subject}>
                                {email.subject}
                              </div>
                              <div className="text-xs text-gray-600 line-clamp-2">
                                {email.body.substring(0, 100)}...
                              </div>
                              {email.error_message && (
                                <div className="text-xs text-red-600 mt-1">
                                  {email.error_message}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}