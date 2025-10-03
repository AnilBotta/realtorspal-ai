import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Phone, 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  RotateCcw, 
  AlertCircle,
  User,
  Filter,
  Plus,
  Search,
  MoreVertical,
  Send,
  Edit,
  X
} from 'lucide-react';
import { getNurturingActivities, updateActivityStatus, generateNurturingPlan } from '../api';

const ActivityBoardModal = ({ open, onClose, user, onGenerateActivities }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, today
  const [searchTerm, setSearchTerm] = useState('');
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    if (open) {
      loadActivities();
    }
  }, [user.id, filter, open]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? null : filter;
      const dateFilter = filter === 'today' ? new Date().toISOString().split('T')[0] : null;
      
      const response = await getNurturingActivities(user.id, dateFilter, statusFilter === 'today' ? null : statusFilter);
      
      if (response.data.status === 'success') {
        setActivities(response.data.activities || []);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityStatusUpdate = async (activityId, newStatus, notes = null) => {
    try {
      await updateActivityStatus(activityId, newStatus, user.id, notes);
      await loadActivities(); // Refresh the list
    } catch (error) {
      console.error('Failed to update activity status:', error);
      alert('Failed to update activity status');
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'voice_call':
        return <Phone size={16} className="text-blue-600" />;
      case 'email':
        return <Mail size={16} className="text-green-600" />;
      case 'sms':
        return <MessageSquare size={16} className="text-purple-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  const getActivityTypeColor = (action) => {
    switch (action) {
      case 'voice_call':
        return 'bg-blue-600 text-white';
      case 'email':
        return 'bg-green-600 text-white';
      case 'sms':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'pending':
        return 'bg-blue-500 text-white';
      case 'rescheduled':
        return 'bg-yellow-500 text-white';
      case 'skipped':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getActivityTitle = (action) => {
    switch (action) {
      case 'voice_call':
        return 'Phone call';
      case 'email':
        return 'Email';
      case 'sms':
        return 'SMS';
      default:
        return 'Activity';
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.to?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return activity.date === today && matchesSearch;
    }
    
    return matchesSearch;
  });

  const openDraftModal = (activity) => {
    setSelectedActivity(activity);
    setShowDraftModal(true);
  };

  const closeDraftModal = () => {
    setSelectedActivity(null);
    setShowDraftModal(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Main Activity Board Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
          
          <div className="inline-block w-full max-w-7xl p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Activities</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={onGenerateActivities}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={16} />
                  New activity
                </button>

                <div className="flex items-center gap-2">
                  <Search size={16} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Filter</option>
                    <option value="today">Today</option>
                    <option value="pending">Open</option>
                    <option value="completed">Done</option>
                  </select>
                </div>

                <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  Person
                </button>

                <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Group by
                </button>
              </div>
            </div>

            {/* Activity Table */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="bg-white">
                  {/* Account Activities Section */}
                  <div className="border-b border-gray-200">
                    <div className="px-6 py-3 bg-gray-50 flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-600">▼ Account Activities</span>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-1">
                        <input type="checkbox" className="rounded" />
                      </div>
                      <div className="col-span-3">Activity</div>
                      <div className="col-span-2">Activity Type</div>
                      <div className="col-span-1">Owner</div>
                      <div className="col-span-2">Start time</div>
                      <div className="col-span-2">End time</div>
                      <div className="col-span-1">Status</div>
                    </div>

                    {/* Activities */}
                    {filteredActivities.length === 0 ? (
                      <div className="px-6 py-12 text-center text-gray-500">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg font-medium mb-2">No Activities Found</p>
                        <p className="mb-4">
                          {filter === 'all' 
                            ? "No nurturing activities have been created yet." 
                            : `No ${filter} activities found.`}
                        </p>
                        <button
                          onClick={onGenerateActivities}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Generate Activities
                        </button>
                      </div>
                    ) : (
                      filteredActivities.map((activity, index) => (
                        <div key={activity.id} className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 border-b border-gray-100 ${index === 0 ? 'bg-blue-50' : ''}`}>
                          <div className="col-span-1">
                            <input type="checkbox" className="rounded" />
                          </div>
                          <div className="col-span-3 flex items-center gap-2">
                            {getActivityIcon(activity.action)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {getActivityTitle(activity.action)} with Lead
                              </p>
                              {activity.draft_content && (
                                <button
                                  onClick={() => openDraftModal(activity)}
                                  className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                  View draft message
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getActivityTypeColor(activity.action)}`}>
                              {getActivityTitle(activity.action)}
                            </span>
                          </div>
                          <div className="col-span-1">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User size={16} className="text-gray-600" />
                            </div>
                          </div>
                          <div className="col-span-2 text-sm text-gray-900">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </div>
                          <div className="col-span-2 text-sm text-gray-900">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </div>
                          <div className="col-span-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(activity.status)}`}>
                              {activity.status === 'pending' ? 'Open' : 'Done'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Add activity row */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={onGenerateActivities}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Add activity
                      </button>
                    </div>
                  </div>

                  {/* Add new group */}
                  <div className="px-6 py-4 border-t border-gray-200">
                    <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-2">
                      <Plus size={16} />
                      Add new group
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Draft Message Modal */}
      {showDraftModal && selectedActivity && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={closeDraftModal} />
            
            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Draft {getActivityTitle(selectedActivity.action)}
                </h3>
                <button
                  onClick={closeDraftModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedActivity.to}</p>
                </div>

                {selectedActivity.subject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedActivity.subject}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedActivity.draft_content}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeDraftModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleActivityStatusUpdate(selectedActivity.id, 'completed', 'Message sent via draft modal');
                    closeDraftModal();
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActivityBoardModal;