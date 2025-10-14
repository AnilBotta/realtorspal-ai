import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Mail, X, Send, Trash2, Plus, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getEmailDrafts, sendEmailDraft, deleteEmailDraft, getPreferredFromEmail } from '../api';

export default function EmailDraftModal({ open, lead, onClose, user, onOpenComposer }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState({});
  const [preferredFromEmail, setPreferredFromEmail] = useState('');

  useEffect(() => {
    if (open && lead) {
      loadDrafts();
      loadPreferredFromEmail();
    }
  }, [open, lead]);

  const loadDrafts = async () => {
    if (!lead) return;
    
    try {
      setLoading(true);
      const response = await getEmailDrafts(lead.id);
      setDrafts(response.data || []);
    } catch (error) {
      console.error('Failed to load email drafts:', error);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferredFromEmail = async () => {
    if (!user) return;
    
    try {
      const response = await getPreferredFromEmail(user.id);
      setPreferredFromEmail(response.data?.email || user.email || '');
    } catch (error) {
      console.error('Failed to load preferred from email:', error);
      setPreferredFromEmail(user.email || '');
    }
  };

  const handleSendDraft = async (draft) => {
    if (!preferredFromEmail) {
      alert('Please set up your preferred from email in settings first.');
      return;
    }

    try {
      setSending(prev => ({ ...prev, [draft.id]: true }));
      
      const response = await sendEmailDraft(draft.id, preferredFromEmail);
      
      if (response.data?.success) {
        alert('Email sent successfully!');
        loadDrafts(); // Refresh the drafts list
      } else {
        alert('Failed to send email: ' + (response.data?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to send draft:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSending(prev => ({ ...prev, [draft.id]: false }));
    }
  };

  const handleDeleteDraft = async (draft) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    try {
      await deleteEmailDraft(draft.id);
      alert('Draft deleted successfully!');
      loadDrafts(); // Refresh the drafts list
    } catch (error) {
      console.error('Failed to delete draft:', error);
      alert('Failed to delete draft. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <Clock size={16} className="text-yellow-600" />;
      case 'sent':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'sent':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
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
                        Email Drafts
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">
                        For: {lead.first_name} {lead.last_name} ({lead.email || 'No email address'})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenComposer && onOpenComposer();
                      }}
                      className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Compose New
                    </button>
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">Loading drafts...</div>
                    </div>
                  ) : drafts.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail size={48} className="mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Drafts</h3>
                      <p className="text-gray-500 mb-4">
                        There are no AI-generated email drafts for this lead yet.
                      </p>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenComposer && onOpenComposer();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Compose New Email
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">
                          {drafts.length} Draft{drafts.length !== 1 ? 's' : ''} Available
                        </h3>
                        <button
                          onClick={loadDrafts}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Refresh
                        </button>
                      </div>

                      {drafts.map((draft) => (
                        <div
                          key={draft.id}
                          className={`border rounded-lg p-4 ${getStatusColor(draft.status)}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(draft.status)}
                              <span className="text-sm font-medium uppercase">
                                {draft.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(draft.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {draft.status === 'draft' && (
                                <button
                                  onClick={() => handleSendDraft(draft)}
                                  disabled={sending[draft.id]}
                                  className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors disabled:bg-green-300 flex items-center gap-1"
                                >
                                  {sending[draft.id] ? (
                                    <>Sending...</>
                                  ) : (
                                    <>
                                      <Send size={12} />
                                      Send
                                    </>
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteDraft(draft)}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-xs font-medium text-gray-600">Subject:</span>
                              <div className="text-sm font-medium text-gray-900 mt-1">
                                {draft.subject}
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-xs font-medium text-gray-600">Message:</span>
                              <div className="text-sm text-gray-700 mt-1 bg-white bg-opacity-50 p-3 rounded border max-h-32 overflow-y-auto">
                                {draft.body}
                              </div>
                            </div>

                            {draft.email_type && (
                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                <span><strong>Type:</strong> {draft.email_type}</span>
                                {draft.urgency && <span><strong>Urgency:</strong> {draft.urgency}</span>}
                                {draft.channel && <span><strong>Channel:</strong> {draft.channel}</span>}
                              </div>
                            )}

                            {draft.error_message && (
                              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                <strong>Error:</strong> {draft.error_message}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}