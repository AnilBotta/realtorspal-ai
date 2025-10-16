import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Clock, 
  StopCircle, 
  Bot,
  Activity,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import {
  startNurturingSequence,
  pauseNurturingSequence,
  resumeNurturingSequence,
  snoozeNurturingSequence,
  stopNurturingSequence,
  getNurturingStatus
} from '../api';
import { formatNextActionTime, getStatusColorClass } from '../utils/nurturingUtils';

const NurturingControlPanel = ({ open, lead, user, onClose, onStatusChange }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [showSnoozeDialog, setShowSnoozeDialog] = useState(false);
  const [snoozeDuration, setSnoozeDuration] = useState(24);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  useEffect(() => {
    if (open && lead) {
      loadNurturingStatus();
    }
  }, [open, lead]);

  const loadNurturingStatus = async () => {
    try {
      setLoading(true);
      const response = await getNurturingStatus(lead.id, user.id);
      setStatus(response.data);
      setActivityLogs(response.data.activity_logs || []);
    } catch (error) {
      console.error('Failed to load nurturing status:', error);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      setActionLoading(true);
      await startNurturingSequence({
        lead_id: lead.id,
        user_id: user.id,
        total_steps: 5
      });
      await loadNurturingStatus();
      onStatusChange && onStatusChange();
    } catch (error) {
      console.error('Failed to start nurturing:', error);
      alert('Failed to start nurturing sequence');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      setActionLoading(true);
      await pauseNurturingSequence({
        lead_id: lead.id,
        user_id: user.id,
        reason: 'user_paused'
      });
      await loadNurturingStatus();
      onStatusChange && onStatusChange();
    } catch (error) {
      console.error('Failed to pause nurturing:', error);
      alert('Failed to pause sequence');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setActionLoading(true);
      await resumeNurturingSequence({
        lead_id: lead.id,
        user_id: user.id
      });
      await loadNurturingStatus();
      onStatusChange && onStatusChange();
    } catch (error) {
      console.error('Failed to resume nurturing:', error);
      alert('Failed to resume sequence');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSnooze = async () => {
    try {
      setActionLoading(true);
      await snoozeNurturingSequence({
        lead_id: lead.id,
        user_id: user.id,
        snooze_duration_hours: snoozeDuration
      });
      await loadNurturingStatus();
      setShowSnoozeDialog(false);
      onStatusChange && onStatusChange();
    } catch (error) {
      console.error('Failed to snooze nurturing:', error);
      alert('Failed to snooze sequence');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setActionLoading(true);
      await stopNurturingSequence({
        lead_id: lead.id,
        user_id: user.id
      });
      await loadNurturingStatus();
      setShowStopConfirm(false);
      onStatusChange && onStatusChange();
    } catch (error) {
      console.error('Failed to stop nurturing:', error);
      alert('Failed to stop sequence');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!status || !status.status) return null;

    const statusConfig = {
      active: { color: 'green', text: 'Active', icon: Play },
      running: { color: 'green', text: 'Running', icon: Play },
      paused: { color: 'yellow', text: 'Paused', icon: Pause },
      snoozed: { color: 'blue', text: 'Snoozed', icon: Clock },
      completed: { color: 'gray', text: 'Completed', icon: CheckCircle },
      cancelled: { color: 'red', text: 'Cancelled', icon: StopCircle }
    };

    const config = statusConfig[status.status] || statusConfig.active;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClass(config.color)}`}>
        <Icon size={14} />
        {config.text}
      </div>
    );
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return timestamp;
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
          
          <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Lead Nurturing</h3>
                  <p className="text-sm text-gray-500">
                    {lead ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Status Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Status</h4>
                    {getStatusBadge()}
                  </div>

                  {status && status.status && ['active', 'running', 'paused', 'snoozed'].includes(status.status) && (
                    <>
                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-gray-900">
                            Step {(status.current_step || 0) + 1} / {status.total_steps || 5}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${((status.current_step || 0) / (status.total_steps || 5)) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Next Action */}
                      {status.next_action_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          <span>Next action: {formatNextActionTime(status.next_action_at)}</span>
                        </div>
                      )}

                      {/* Snooze/Pause Info */}
                      {status.paused_until && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                          <Clock size={14} />
                          <span>Until: {formatTimestamp(status.paused_until)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Controls */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Controls</h4>
                  <div className="flex flex-wrap gap-2">
                    {(!status || !status.status || ['completed', 'cancelled'].includes(status.status)) && (
                      <button
                        onClick={handleStart}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play size={16} />
                        Start Nurturing
                      </button>
                    )}

                    {status && ['active', 'running'].includes(status.status) && (
                      <>
                        <button
                          onClick={handlePause}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                        >
                          <Pause size={16} />
                          Pause
                        </button>
                        <button
                          onClick={() => setShowSnoozeDialog(true)}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Clock size={16} />
                          Snooze
                        </button>
                        <button
                          onClick={() => setShowStopConfirm(true)}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          <StopCircle size={16} />
                          Stop
                        </button>
                      </>
                    )}

                    {status && ['paused', 'snoozed'].includes(status.status) && (
                      <>
                        <button
                          onClick={handleResume}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          <Play size={16} />
                          Resume
                        </button>
                        <button
                          onClick={() => setShowStopConfirm(true)}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          <StopCircle size={16} />
                          Stop
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Activity Stream */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Activity size={16} />
                    Activity Stream
                  </h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {activityLogs.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
                    ) : (
                      activityLogs.map((log, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            log.action_type === 'success' ? 'bg-green-500' :
                            log.action_type === 'error' ? 'bg-red-500' :
                            log.action_type === 'warning' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{log.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimestamp(log.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Snooze Dialog */}
      {showSnoozeDialog && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowSnoozeDialog(false)} />
            <div className="relative bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4">Snooze Nurturing</h3>
              <p className="text-sm text-gray-600 mb-4">How long would you like to snooze?</p>
              <input
                type="number"
                value={snoozeDuration}
                onChange={(e) => setSnoozeDuration(parseInt(e.target.value) || 24)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                placeholder="Hours"
                min="1"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSnoozeDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSnooze}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Snooze
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stop Confirmation Dialog */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowStopConfirm(false)} />
            <div className="relative bg-white rounded-lg p-6 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold">Stop Nurturing?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                This will permanently stop the nurturing sequence for this lead. You can start a new sequence anytime.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowStopConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStop}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Stop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NurturingControlPanel;
