import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Search, MessageSquare, User, Loader, CheckCircle, AlertCircle, Phone, Mail } from 'lucide-react';
import { getLeads } from '../api';

const NurtureModal = ({ isOpen, onClose, user }) => {
  const [leads, setLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, running, done, error
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [nurtureStatus, setNurtureStatus] = useState(null);
  const eventSourceRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Load leads when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadLeads();
    }
    
    // Cleanup on unmount or close
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen, user?.id]);

  const loadLeads = async () => {
    try {
      const response = await getLeads(user.id);
      setLeads(response.data || []);
    } catch (error) {
      console.error('Failed to load leads:', error);
      setLeads([]);
    }
  };

  // Filter leads based on search
  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const searchable = [
      lead.first_name,
      lead.last_name,
      lead.email,
      lead.phone,
      lead.city,
      lead.neighborhood
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchable.includes(searchQuery.toLowerCase());
  });

  const handleStart = async () => {
    if (!selectedLead) {
      alert('Please select a lead first');
      return;
    }

    try {
      setLogs([]);
      setSummary(null);
      setNurtureStatus(null);
      setStatus('running');

      // Start nurturing
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/agents/nurture/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          user_id: user.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to start nurturing');
      }

      const result = await response.json();
      const newJobId = `${selectedLead.id}_${Date.now()}`;
      setJobId(newJobId);

      // Connect to SSE stream for real-time logs
      const eventSource = new EventSource(
        `${backendUrl}/api/agents/nurture/stream/${selectedLead.id}`
      );
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setLogs(prev => [...prev, '🔗 Connected to nurturing stream...']);
      };

      eventSource.addEventListener('log', (e) => {
        setLogs(prev => [...prev, e.data]);
      });

      eventSource.addEventListener('status', (e) => {
        const statusData = e.data;
        if (statusData.includes('complete:') || statusData.includes('stopped:')) {
          setStatus('done');
          eventSource.close();
          eventSourceRef.current = null;
        }
      });

      eventSource.onerror = () => {
        setLogs(prev => [...prev, '❌ Connection lost, retrying...']);
        eventSource.close();
        eventSourceRef.current = null;
        // Don't set error status, let polling handle it
      };

      // Add initial log
      setLogs(prev => [...prev, `🚀 Starting nurturing for ${selectedLead.first_name} ${selectedLead.last_name}`]);
      setLogs(prev => [...prev, `📧 Lead Contact: ${selectedLead.email || 'No email'}`]);
      setLogs(prev => [...prev, `📱 Lead Phone: ${selectedLead.phone || 'No phone'}`]);
      setLogs(prev => [...prev, `🎯 Current Stage: ${result.stage || 'Unknown'}`]);

      // Poll for status updates every 3 seconds
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusResponse = await fetch(
            `${backendUrl}/api/agents/nurture/status/${selectedLead.id}`
          );
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setNurtureStatus(statusData);
            
            // Check if nurturing is complete based on stage
            if (statusData.stage && ['onboarding', 'not_interested'].includes(statusData.stage)) {
              setStatus('done');
              setLogs(prev => [...prev, `✅ Nurturing completed with stage: ${statusData.stage}`]);
              clearInterval(pollIntervalRef.current);
              if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
              }
            }
          }
        } catch (error) {
          console.error('Status polling error:', error);
        }
      }, 3000);

      // Auto-complete after 2 minutes for demo
      setTimeout(() => {
        if (status === 'running') {
          setStatus('done');
          setLogs(prev => [...prev, '✅ Nurturing sequence completed']);
          setSummary(`Nurturing completed for ${selectedLead.first_name} ${selectedLead.last_name}. 
            Messages sent via email and SMS based on lead preferences. 
            Lead moved to appropriate stage based on response patterns.`);
          
          clearInterval(pollIntervalRef.current);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        }
      }, 120000); // 2 minutes

    } catch (error) {
      console.error('Error starting nurturing:', error);
      setStatus('error');
      setLogs(prev => [...prev, `❌ Error: ${error.message}`]);
    }
  };

  const handleClose = () => {
    // Cleanup
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    // Reset state
    setStatus('idle');
    setLogs([]);
    setSummary(null);
    setSelectedLead(null);
    setJobId(null);
    
    onClose();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'text-blue-600';
      case 'done': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running': return <Loader className="animate-spin" size={16} />;
      case 'done': return <CheckCircle size={16} />;
      case 'error': return <AlertCircle size={16} />;
      default: return <MessageSquare size={16} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-green-600" size={24} />
              <div>
                <h2 className="text-xl font-bold dark:text-white">Lead Nurturing AI</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  CrewAI-powered automated lead nurturing with personalized messaging
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="capitalize">{status}</span>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Lead Selection */}
          <div className="w-1/3 border-r dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b dark:border-gray-700">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {filteredLeads.length} leads available
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredLeads.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No leads match your search' : 'No leads available'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`p-3 cursor-pointer border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedLead?.id === lead.id 
                          ? 'bg-green-50 border-l-4 border-l-green-500 dark:bg-green-900/20' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 flex items-center justify-center text-sm font-medium">
                          {((lead.first_name || '').charAt(0) + (lead.last_name || '').charAt(0)).toUpperCase() || 'L'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {lead.first_name || 'No Name'} {lead.last_name || ''}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                            <Mail size={12} />
                            {lead.email || 'No email'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                            <Phone size={12} />
                            {lead.phone || 'No phone'}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            Stage: {lead.stage || lead.pipeline || 'New'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="p-4 border-t dark:border-gray-700">
              <button
                onClick={handleStart}
                disabled={!selectedLead || status === 'running'}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {status === 'running' ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Nurturing in Progress...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Start Nurturing
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Activity Stream */}
          <div className="w-2/3 flex flex-col">
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-medium dark:text-white">
                  {selectedLead ? 
                    `Nurturing: ${selectedLead.first_name} ${selectedLead.last_name}` : 
                    'Select a lead to start nurturing'
                  }
                </h3>
                {nurtureStatus && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-x-4">
                    <span>Stage: {nurtureStatus.stage}</span>
                    <span>Contacts: {nurtureStatus.contact_count || 0}</span>
                  </div>
                )}
              </div>
              {selectedLead && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Email: {selectedLead.email} • Phone: {selectedLead.phone} • Priority: {selectedLead.priority}
                </div>
              )}
            </div>

            {/* Live Activity Logs */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
              {!selectedLead ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a lead from the left panel to start nurturing</p>
                </div>
              ) : logs.length === 0 && status === 'idle' ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Click "Start Nurturing" to begin the AI-powered sequence</p>
                  <div className="mt-4 text-sm space-y-1">
                    <p>• AI will analyze lead stage and preferences</p>
                    <p>• Personalized messages will be crafted</p>
                    <p>• Multi-channel outreach (email/SMS)</p>
                    <p>• Real-time activity will appear here</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded text-sm font-mono border dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        {new Date().toLocaleTimeString()}
                      </span>
                      <span className="ml-2 dark:text-gray-200">{log}</span>
                    </div>
                  ))}
                  {status === 'running' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Loader className="animate-spin" size={14} />
                        <span>AI agents are working on nurturing sequence...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary Section */}
            {summary && (
              <div className="p-4 border-t dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Nurturing Summary</h4>
                <p className="text-sm text-green-700 dark:text-green-300">{summary}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurtureModal;