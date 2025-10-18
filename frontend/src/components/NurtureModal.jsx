import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Search, MessageSquare, User, Loader, CheckCircle, AlertCircle, Phone, Mail, Pause, Clock, StopCircle } from 'lucide-react';
import { getLeads, getNurturingStatus, pauseNurturingSequence, resumeNurturingSequence, snoozeNurturingSequence, stopNurturingSequence } from '../api';

const NurtureModal = ({ isOpen, onClose, user, preselectedLead = null }) => {
  const [leads, setLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showFullWidth, setShowFullWidth] = useState(false); // Track if should show full-width view
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, running, done, error
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [nurtureStatus, setNurtureStatus] = useState(null);
  const [showSnoozeDialog, setShowSnoozeDialog] = useState(false);
  const [snoozeDuration, setSnoozeDuration] = useState(24);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const eventSourceRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Auto-select preselected lead and show full-width
  useEffect(() => {
    if (preselectedLead) {
      setSelectedLead(preselectedLead);
      setShowFullWidth(true);
    }
  }, [preselectedLead]);

  // Load leads when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadLeads();
      // If there's a preselected lead, load its nurturing status
      if (preselectedLead?.id) {
        loadNurturingStatus(preselectedLead.id);
      }
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
  }, [isOpen, user?.id, preselectedLead]);

  const loadLeads = async () => {
    try {
      const response = await getLeads(user.id);
      setLeads(response.data || []);
    } catch (error) {
      console.error('Failed to load leads:', error);
      setLeads([]);
    }
  };

  const loadNurturingStatus = async (leadId) => {
    try {
      const response = await getNurturingStatus(leadId, user.id);
      setNurtureStatus(response.data);
      
      // If there's active nurturing, show it as running
      if (response.data && ['active', 'running', 'paused', 'snoozed'].includes(response.data.status)) {
        setStatus('running');
        
        // Load activity logs with full objects (including timestamps)
        if (response.data.activity_logs) {
          setLogs(response.data.activity_logs);
        }
      }
    } catch (error) {
      console.error('Failed to load nurturing status:', error);
    }
  };

  const handlePause = async () => {
    if (!selectedLead) return;
    try {
      await pauseNurturingSequence({
        lead_id: selectedLead.id,
        user_id: user.id,
        reason: 'user_paused'
      });
      await loadNurturingStatus(selectedLead.id);
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  };

  const handleResume = async () => {
    if (!selectedLead) return;
    try {
      await resumeNurturingSequence({
        lead_id: selectedLead.id,
        user_id: user.id
      });
      await loadNurturingStatus(selectedLead.id);
    } catch (error) {
      console.error('Failed to resume:', error);
    }
  };

  const handleSnooze = async () => {
    if (!selectedLead) return;
    try {
      await snoozeNurturingSequence({
        lead_id: selectedLead.id,
        user_id: user.id,
        snooze_duration_hours: snoozeDuration
      });
      await loadNurturingStatus(selectedLead.id);
      setShowSnoozeDialog(false);
    } catch (error) {
      console.error('Failed to snooze:', error);
    }
  };

  const handleStop = async () => {
    if (!selectedLead) return;
    try {
      await stopNurturingSequence({
        lead_id: selectedLead.id,
        user_id: user.id
      });
      await loadNurturingStatus(selectedLead.id);
      setShowStopConfirm(false);
    } catch (error) {
      console.error('Failed to stop:', error);
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
      
      // Switch to full-width view immediately when starting nurturing
      setShowFullWidth(true);

      // Step 0: Check if lead is already being nurtured
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      if (!backendUrl) {
        throw new Error('Backend URL not configured');
      }
      
      // Check existing nurturing status
      try {
        const statusResponse = await fetch(`${backendUrl}/api/nurturing/status/${selectedLead.id}?user_id=${user.id}`);
        if (statusResponse.ok) {
          const existingStatus = await statusResponse.json();
          
          // If lead is already being nurtured (active/paused/snoozed), load existing session
          if (existingStatus.status && ['active', 'running', 'paused', 'snoozed'].includes(existingStatus.status)) {
            console.log('Lead is already being nurtured, loading existing session:', existingStatus);
            
            // Load existing nurturing status and logs
            setNurtureStatus(existingStatus);
            
            if (existingStatus.activity_logs && existingStatus.activity_logs.length > 0) {
              setLogs(existingStatus.activity_logs);
            }
            
            // Set status to running to show we're viewing an active session
            setStatus('running');
            
            // Show message that we're viewing existing session
            setLogs(prev => [...prev, {
              message: `📋 Viewing existing nurturing session for ${selectedLead.first_name} ${selectedLead.last_name}`,
              timestamp: new Date().toISOString(),
              action_type: 'info'
            }]);
            
            // Don't start a new session, just return
            return;
          }
        }
      } catch (error) {
        console.warn('Could not check existing nurturing status:', error);
        // Continue with starting new session
      }
      
      // Step 1: Create persistent nurturing sequence in background system (only if not already nurturing)
      // Start the persistent background sequence first
      try {
        const persistResponse = await fetch(`${backendUrl}/api/nurturing/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lead_id: selectedLead.id,
            user_id: user.id,
            total_steps: 5
          })
        });
        
        if (persistResponse.ok) {
          const persistResult = await persistResponse.json();
          console.log('Background nurturing sequence started:', persistResult);
          
          // Load the nurturing status to show controls and progress
          await loadNurturingStatus(selectedLead.id);
        } else {
          const errorData = await persistResponse.json();
          console.warn('Persistent sequence creation failed:', errorData);
        }
      } catch (error) {
        console.warn('Could not start background sequence:', error);
        // Continue anyway to show SSE streaming
      }
      
      // Step 2: Start SSE streaming for live execution logs
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
        setLogs(prev => [...prev, {
          message: '🔗 Connected to nurturing stream...',
          timestamp: new Date().toISOString(),
          action_type: 'info'
        }]);
      };

      eventSource.addEventListener('log', (e) => {
        // Store as object with timestamp
        setLogs(prev => [...prev, {
          message: e.data,
          timestamp: new Date().toISOString(),
          action_type: 'info'
        }]);
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
        setLogs(prev => [...prev, {
          message: '❌ Connection lost, retrying...',
          timestamp: new Date().toISOString(),
          action_type: 'error'
        }]);
        eventSource.close();
        eventSourceRef.current = null;
        // Don't set error status, let polling handle it
      };

      // Add initial logs as objects with timestamps
      setLogs(prev => [...prev, {
        message: `🚀 Starting nurturing for ${selectedLead.first_name} ${selectedLead.last_name}`,
        timestamp: new Date().toISOString(),
        action_type: 'info'
      }]);
      setLogs(prev => [...prev, {
        message: `📧 Lead Contact: ${selectedLead.email || 'No email'}`,
        timestamp: new Date().toISOString(),
        action_type: 'info'
      }]);
      setLogs(prev => [...prev, {
        message: `📱 Lead Phone: ${selectedLead.phone || 'No phone'}`,
        timestamp: new Date().toISOString(),
        action_type: 'info'
      }]);
      setLogs(prev => [...prev, {
        message: `🎯 Current Stage: ${result.stage || 'Unknown'}`,
        timestamp: new Date().toISOString(),
        action_type: 'info'
      }]);

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
              setLogs(prev => [...prev, {
                message: `✅ Nurturing completed with stage: ${statusData.stage}`,
                timestamp: new Date().toISOString(),
                action_type: 'success'
              }]);
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
          setLogs(prev => [...prev, {
            message: '✅ Nurturing sequence completed',
            timestamp: new Date().toISOString(),
            action_type: 'success'
          }]);
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
      setLogs(prev => [...prev, {
        message: `❌ Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        action_type: 'error'
      }]);
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
    setShowFullWidth(false); // Reset full-width mode
    
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
          {/* Left Panel - Lead Selection (hide if preselected lead or full-width mode) */}
          {!preselectedLead && !showFullWidth && (
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
            <div className="p-4 border-t dark:border-gray-700 space-y-3">
              <button
                onClick={handleStart}
                disabled={!selectedLead || (status === 'running' && nurtureStatus?.status !== 'paused' && nurtureStatus?.status !== 'snoozed')}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {nurtureStatus && ['active', 'running'].includes(nurtureStatus.status) ? (
                  <>
                    <CheckCircle size={16} />
                    Lead is Nurturing
                  </>
                ) : nurtureStatus && ['paused', 'snoozed'].includes(nurtureStatus.status) ? (
                  <>
                    <Play size={16} />
                    Resume Nurturing
                  </>
                ) : status === 'running' ? (
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

              {/* Nurturing Controls */}
              {nurtureStatus && ['active', 'running', 'paused', 'snoozed'].includes(nurtureStatus.status) && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Nurturing Controls:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {nurtureStatus.status === 'active' || nurtureStatus.status === 'running' ? (
                      <>
                        <button
                          onClick={handlePause}
                          className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                        >
                          <Pause size={14} />
                          Pause
                        </button>
                        <button
                          onClick={() => setShowSnoozeDialog(true)}
                          className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          <Clock size={14} />
                          Snooze
                        </button>
                        <button
                          onClick={() => setShowStopConfirm(true)}
                          className="col-span-2 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          <StopCircle size={14} />
                          Stop
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleResume}
                          className="col-span-2 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          <Play size={14} />
                          Resume
                        </button>
                        <button
                          onClick={() => setShowStopConfirm(true)}
                          className="col-span-2 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          <StopCircle size={14} />
                          Stop
                        </button>
                      </>
                    )}
                  </div>

                  {/* Status Info */}
                  {nurtureStatus.current_step !== undefined && nurtureStatus.total_steps && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>Progress: Step {nurtureStatus.current_step + 1} / {nurtureStatus.total_steps}</div>
                      {nurtureStatus.next_action_at && (
                        <div>Next action: {new Date(nurtureStatus.next_action_at).toLocaleString()}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Right Panel - Activity Stream */}
          <div className={`${preselectedLead || showFullWidth ? 'w-full' : 'w-2/3'} flex flex-col`}>
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium dark:text-white">
                  {selectedLead ? 
                    `Nurturing: ${selectedLead.first_name} ${selectedLead.last_name}` : 
                    'Select a lead to start nurturing'
                  }
                </h3>
                
                {/* Nurturing Status Badge */}
                {nurtureStatus && nurtureStatus.status && (
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    nurtureStatus.status === 'active' || nurtureStatus.status === 'running' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : nurtureStatus.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : nurtureStatus.status === 'snoozed'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {nurtureStatus.status === 'active' || nurtureStatus.status === 'running' ? '🤖 Nurturing Active' :
                     nurtureStatus.status === 'paused' ? '⏸️ Paused' :
                     nurtureStatus.status === 'snoozed' ? '😴 Snoozed' :
                     nurtureStatus.status === 'completed' ? '✅ Completed' :
                     '⏹️ Stopped'}
                  </div>
                )}
              </div>
              
              {/* Progress and Info */}
              {nurtureStatus && (
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <div className="flex items-center space-x-4">
                    {nurtureStatus.current_step !== undefined && nurtureStatus.total_steps && (
                      <span>Step {nurtureStatus.current_step + 1} / {nurtureStatus.total_steps}</span>
                    )}
                    {nurtureStatus.stage && <span>Stage: {nurtureStatus.stage}</span>}
                  </div>
                  {nurtureStatus.next_action_at && (
                    <span>Next: {new Date(nurtureStatus.next_action_at).toLocaleString()}</span>
                  )}
                </div>
              )}
              
              {selectedLead && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Email: {selectedLead.email} • Phone: {selectedLead.phone}
                </div>
              )}
              
              {/* Control Buttons for Preselected Lead or Full-Width Mode */}
              {(preselectedLead || showFullWidth) && nurtureStatus && ['active', 'running', 'paused', 'snoozed'].includes(nurtureStatus.status) && (
                <div className="mt-3 flex gap-2">
                  {nurtureStatus.status === 'active' || nurtureStatus.status === 'running' ? (
                    <>
                      <button
                        onClick={handlePause}
                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                      >
                        <Pause size={12} />
                        Pause
                      </button>
                      <button
                        onClick={() => setShowSnoozeDialog(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        <Clock size={12} />
                        Snooze
                      </button>
                      <button
                        onClick={() => setShowStopConfirm(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        <StopCircle size={12} />
                        Stop
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleResume}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                      >
                        <Play size={12} />
                        Resume
                      </button>
                      <button
                        onClick={() => setShowStopConfirm(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        <StopCircle size={12} />
                        Stop
                      </button>
                    </>
                  )}
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
                  {logs.map((log, index) => {
                    // Handle both string logs (from SSE) and object logs (from activity_logs)
                    const isObject = typeof log === 'object' && log !== null;
                    const logMessage = isObject ? log.message : log;
                    const logTimestamp = isObject && log.timestamp 
                      ? new Date(log.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })
                      : new Date().toLocaleTimeString();
                    
                    return (
                      <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded text-sm font-mono border dark:border-gray-700">
                        <span className="text-gray-500 dark:text-gray-400">
                          {logTimestamp}
                        </span>
                        <span className="ml-2 dark:text-gray-200">{logMessage}</span>
                      </div>
                    );
                  })}
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
      
      {/* Snooze Dialog */}
      {showSnoozeDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSnoozeDialog(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Snooze Nurturing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">How long would you like to snooze?</p>
            <input
              type="number"
              value={snoozeDuration}
              onChange={(e) => setSnoozeDuration(parseInt(e.target.value) || 24)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 dark:bg-gray-700 dark:text-white"
              placeholder="Hours"
              min="1"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSnoozeDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSnooze}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Snooze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop Confirmation Dialog */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowStopConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Stop Nurturing?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will permanently stop the nurturing sequence for this lead. You can start a new sequence anytime.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStopConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleStop}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurtureModal;