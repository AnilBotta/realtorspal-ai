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
  Edit
} from 'lucide-react';
import { getNurturingActivities, updateActivityStatus, generateNurturingPlan } from '../api';

const ActivityBoard = ({ user, onGenerateActivities }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, today
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedActivity, setExpandedActivity] = useState(null);

  useEffect(() => {
    loadActivities();
  }, [user.id, filter]);

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
        return <Phone size={16} />;
      case 'email':
        return <Mail size={16} />;
      case 'sms':
        return <MessageSquare size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const getActivityTypeColor = (action) => {
    switch (action) {
      case 'voice_call':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'email':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sms':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rescheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'skipped':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityTitle = (action) => {
    switch (action) {
      case 'voice_call':
        return 'Phone Call';
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

  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = activity.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const ActivityCard = ({ activity }) => {
    const [showDraftModal, setShowDraftModal] = useState(false);
    
    return (
      <>
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          {/* Activity Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${getActivityTypeColor(activity.action)}`}>
                {getActivityIcon(activity.action)}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{getActivityTitle(activity.action)}</h4>
                <p className="text-sm text-gray-600">{activity.to}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(activity.status)}`}>
                {activity.status === 'pending' ? 'Open' : activity.status}
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Activity Details */}
          {activity.notes && (
            <p className="text-sm text-gray-700 mb-3">{activity.notes}</p>
          )}

          {/* Draft Content Preview */}
          {activity.draft_content && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">DRAFT MESSAGE</span>
                <button 
                  onClick={() => setShowDraftModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  View Full
                </button>
              </div>
              <p className="text-sm text-gray-800 line-clamp-2">
                {activity.subject && `Subject: ${activity.subject} - `}
                {activity.draft_content}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={12} />
              <span>Created {new Date(activity.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {activity.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleActivityStatusUpdate(activity.id, 'completed')}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1"
                  >
                    <CheckCircle size={12} />
                    Done
                  </button>
                  <button
                    onClick={() => handleActivityStatusUpdate(activity.id, 'rescheduled')}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1"
                  >
                    <RotateCcw size={12} />
                    Reschedule
                  </button>
                </>
              )}
              
              {activity.draft_content && (
                <button
                  onClick={() => setShowDraftModal(true)}
                  className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 flex items-center gap-1"
                >
                  <Send size={12} />
                  Send
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Draft Modal */}
        {showDraftModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDraftModal(false)} />
              
              <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Draft {getActivityTitle(activity.action)}
                  </h3>
                  <button
                    onClick={() => setShowDraftModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                    <p className="text-sm text-gray-900">{activity.to}</p>
                  </div>

                  {activity.subject && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                      <p className="text-sm text-gray-900">{activity.subject}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{activity.draft_content}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowDraftModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Here you would integrate with your actual sending logic
                      handleActivityStatusUpdate(activity.id, 'completed', 'Message sent via draft modal');
                      setShowDraftModal(false);
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Activity Board</h2>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {filteredActivities.length} activities
            </span>
          </div>
          
          <button
            onClick={onGenerateActivities}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Generate Activities
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Activities</option>
              <option value="today">Today</option>
              <option value="pending">Open</option>
              <option value="completed">Done</option>
            </select>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="p-6">
        {Object.keys(groupedActivities).length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? "No nurturing activities have been created yet." 
                : `No ${filter} activities found.`}
            </p>
            <button
              onClick={onGenerateActivities}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              Generate Your First Activities
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities)
              .sort(([a], [b]) => new Date(a) - new Date(b))
              .map(([date, dayActivities]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{formatDate(date)}</h3>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {dayActivities.length} activities
                    </span>
                  </div>
                  
                  <div className="grid gap-3">
                    {dayActivities.map((activity) => (
                      <ActivityCard key={activity.id} activity={activity} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityBoard;