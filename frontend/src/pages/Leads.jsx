import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Mail, Phone, MapPin, Calendar, User, Edit, Trash2, RefreshCw, LayoutDashboard, X } from 'lucide-react';
import { getLeads, createLead, updateLead, deleteLead } from '../api';
import AddLeadModal from '../components/AddLeadModal';
import ImportLeadsModal from '../components/ImportLeadsModal';
import LeadDrawer from '../components/LeadDrawer';
import EmailModal from '../components/EmailModal';
import CommunicationModal from '../components/CommunicationModal';

export default function Leads({ user }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Advanced Filtering States
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const [temperatureFilter, setTemperatureFilter] = useState('all');
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' });
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  
  // Advanced Panel Filters
  const [locationFilter, setLocationFilter] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
  const [leadSourceFilter, setLeadSourceFilter] = useState('all');
  const [lastContactFilter, setLastContactFilter] = useState('all');
  const [communicationFilter, setCommunicationFilter] = useState('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLeadDrawer, setShowLeadDrawer] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Communication modal states
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [communicationType, setCommunicationType] = useState('call');
  const [communicationLead, setCommunicationLead] = useState(null);

  useEffect(() => {
    loadLeads();
  }, [user]);

  // Add event listener for when leads page becomes visible (e.g., tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadLeads(); // Refresh leads when page becomes visible
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const loadLeads = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await getLeads(user.id);
      console.log('API Response:', response);
      // Handle different response structures
      const data = response.data || response || [];
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (leadData) => {
    try {
      console.log('Creating lead with data:', leadData);
      // Create lead but don't add to dashboard automatically - user chooses
      const response = await createLead({ ...leadData, user_id: user.id, in_dashboard: false });
      console.log('Create lead response:', response);
      const newLead = response.data || response;
      if (newLead) {
        setLeads(prev => Array.isArray(prev) ? [newLead, ...prev] : [newLead]);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
      throw error;
    }
  };

  const handleUpdateLead = async (leadData) => {
    try {
      const updatedLead = await updateLead(leadData.id, leadData);
      if (updatedLead) {
        setLeads(prev => Array.isArray(prev) ? 
          prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead) : 
          [updatedLead]
        );
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
      throw error;
    }
  };

  const handleDeleteLead = async (lead) => {
    if (!window.confirm(`Are you sure you want to delete ${lead.first_name} ${lead.last_name}?`)) {
      return;
    }
    
    try {
      await deleteLead(lead.id);
      setLeads(prev => Array.isArray(prev) ? prev.filter(l => l.id !== lead.id) : []);
      setShowLeadDrawer(false);
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
  };

  const handleAddToDashboard = async (lead) => {
    try {
      // Update lead to be included in dashboard
      const updatedLead = await updateLead(lead.id, { ...lead, in_dashboard: true });
      if (updatedLead) {
        setLeads(prev => Array.isArray(prev) ? 
          prev.map(l => l.id === lead.id ? { ...l, in_dashboard: true } : l) : 
          [updatedLead]
        );
        alert(`${lead.first_name} ${lead.last_name} has been added to the Dashboard!`);
      }
    } catch (error) {
      console.error('Failed to add lead to dashboard:', error);
      alert('Failed to add lead to dashboard. Please try again.');
    }
  };

  const handleRemoveFromDashboard = async (lead) => {
    try {
      // Update lead to be removed from dashboard
      const updatedLead = await updateLead(lead.id, { ...lead, in_dashboard: false });
      if (updatedLead) {
        setLeads(prev => Array.isArray(prev) ? 
          prev.map(l => l.id === lead.id ? { ...l, in_dashboard: false } : l) : 
          [updatedLead]
        );
        alert(`${lead.first_name} ${lead.last_name} has been removed from the Dashboard!`);
      }
    } catch (error) {
      console.error('Failed to remove lead from dashboard:', error);
      alert('Failed to remove lead from dashboard. Please try again.');
    }
  };

  const handleViewLead = (lead) => {
    setSelectedLead(lead);
    setShowLeadDrawer(true);
  };

  const handleEmailLead = (lead) => {
    setSelectedLead(lead);
    setShowEmailModal(true);
  };

  const handleCallLead = (lead) => {
    setCommunicationLead(lead);
    setCommunicationType('call');
    setShowCommunicationModal(true);
  };

  const handleSMSLead = (lead) => {
    setCommunicationLead(lead);
    setCommunicationType('sms');
    setShowCommunicationModal(true);
  };

  const handleImportComplete = () => {
    loadLeads();
    setShowImportModal(false);
  };

  // Filter and sort leads
  const filteredLeads = (Array.isArray(leads) ? leads : []).filter(lead => {
    const matchesSearch = searchQuery === '' || 
      `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery) ||
      lead.property_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || lead.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle date sorting
    if (sortBy === 'created_at') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    }
    
    // Handle string sorting
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue?.toLowerCase() || '';
    }
    
    // Handle undefined/null values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusColor = (status) => {
    const statusStr = typeof status === 'string' ? status.toLowerCase() : (status || '').toString().toLowerCase();
    switch (statusStr) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    const priorityStr = typeof priority === 'string' ? priority.toLowerCase() : (priority || '').toString().toLowerCase();
    switch (priorityStr) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  // Table component for lead row
  const LeadTableRow = ({ lead, index }) => (
    <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
      {/* INFO */}
      <td className="px-3 py-3 border-b w-48">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
            {((lead.first_name || '').charAt(0) + (lead.last_name || '').charAt(0)).toUpperCase() || 'L'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate">
              {lead.first_name || 'N/A'} {lead.last_name || ''}
            </div>
            <div className="text-sm text-gray-500 truncate">{lead.email || 'No email'}</div>
            <div className="text-sm text-gray-500 truncate">{lead.phone || 'No phone'}</div>
          </div>
        </div>
      </td>

      {/* PIPELINE/STATUS/TYPE */}
      <td className="px-3 py-3 border-b w-40">
        <div className="space-y-1">
          <span className="block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 truncate">
            {lead.pipeline || 'Not set'}
          </span>
          <span className={`block px-2 py-1 text-xs rounded-full ${getStatusColor(lead.status)} truncate`}>
            {lead.status || 'Open'}
          </span>
          <span className="block text-xs text-gray-600 truncate">
            {lead.lead_type || 'Not specified'}
          </span>
        </div>
      </td>

      {/* PERSONAL */}
      <td className="px-3 py-3 border-b w-48">
        <div className="text-sm text-gray-900">
          <div className="mb-1"><strong>Priority:</strong> 
            <span className={`ml-1 px-2 py-1 text-xs rounded-full ${getPriorityColor(lead.priority)}`}>
              {lead.priority || 'Medium'}
            </span>
          </div>
          <div className="mb-1 truncate"><strong>Source:</strong> {lead.ref_source || lead.lead_source || 'Not specified'}</div>
          <div className="truncate"><strong>Rating:</strong> {lead.lead_rating || 'Not selected'}</div>
        </div>
      </td>

      {/* PROPERTY */}
      <td className="px-3 py-3 border-b w-44">
        <div className="text-sm text-gray-900">
          <div className="mb-1 truncate"><strong>Type:</strong> {lead.property_type || 'Not specified'}</div>
          <div className="mb-1 truncate"><strong>Location:</strong> {lead.city || lead.neighborhood || 'Not specified'}</div>
          <div className="truncate"><strong>Budget:</strong> 
            {lead.price_min || lead.price_max ? 
              `$${(lead.price_min || 0).toLocaleString()} - $${(lead.price_max || 0).toLocaleString()}` : 
              'Not specified'}
          </div>
        </div>
      </td>

      {/* TIMELINE */}
      <td className="px-3 py-3 border-b w-40">
        <div className="text-sm text-gray-900">
          <div className="mb-1 truncate"><strong>Created:</strong> {formatDate(lead.created_at)}</div>
          <div className="mb-1 truncate"><strong>Buying In:</strong> {lead.buying_in || 'Not specified'}</div>
          <div className="truncate"><strong>Selling In:</strong> {lead.selling_in || 'Not specified'}</div>
        </div>
      </td>

      {/* ACTIVITY */}
      <td className="px-3 py-3 border-b w-32">
        <div className="flex flex-col gap-1 text-xs">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-center">
            📞 {lead.call_count || 0}
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-center">
            ✉️ {lead.email_count || 0}
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-center">
            💬 {lead.sms_count || 0}
          </span>
        </div>
      </td>

      {/* DASHBOARD STATUS */}
      <td className="px-3 py-3 border-b w-36">
        {lead.in_dashboard ? (
          <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800 block text-center">
            📊 On Dashboard
          </span>
        ) : (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 block text-center">
            Not on Dashboard
          </span>
        )}
      </td>

      {/* ACTIONS */}
      <td className="px-3 py-3 border-b w-80">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => handleViewLead(lead)}
            className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
            title="View Details"
          >
            View
          </button>
          
          {/* Dashboard Management Button */}
          {lead.in_dashboard ? (
            <button
              onClick={() => handleRemoveFromDashboard(lead)}
              className="px-2 py-1 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 transition-colors"
              title="Remove from Dashboard"
            >
              Remove
            </button>
          ) : (
            <button
              onClick={() => handleAddToDashboard(lead)}
              className="px-2 py-1 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors"
              title="Add to Dashboard"
            >
              Add
            </button>
          )}
          
          <button
            onClick={() => handleCallLead(lead)}
            className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition-colors"
            title="Make Call"
          >
            Call
          </button>
          
          <button
            onClick={() => handleSMSLead(lead)}
            className="px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors"
            title="Send SMS"
          >
            SMS
          </button>
          
          {lead.email && (
            <button
              onClick={() => handleEmailLead(lead)}
              className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
              title="Send Email"
            >
              Email
            </button>
          )}
          
          <button
            onClick={() => handleDeleteLead(lead)}
            className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
            title="Delete Lead"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading leads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredLeads.length} of {Array.isArray(leads) ? leads.length : 0} leads
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadLeads}
            className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Import Leads
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="Contacted">Contacted</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Sort */}
          <select
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="first_name-asc">Name A-Z</option>
            <option value="first_name-desc">Name Z-A</option>
            <option value="status-asc">Status A-Z</option>
            <option value="priority-desc">High Priority First</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <div className="text-gray-500 mb-4">
            {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' 
              ? 'No leads match your filters' 
              : 'No leads found'
            }
          </div>
          {(!searchQuery && filterStatus === 'all' && filterPriority === 'all') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Add Your First Lead
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    INFO
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    PIPELINE/STATUS/TYPE
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    PERSONAL
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                    PROPERTY
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    TIMELINE
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    ACTIVITY
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                    DASHBOARD
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, index) => (
                  <LeadTableRow key={lead.id} lead={lead} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddLeadModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={handleCreateLead}
      />

      <ImportLeadsModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={handleImportComplete}
      />

      <LeadDrawer
        open={showLeadDrawer}
        lead={selectedLead}
        onClose={() => setShowLeadDrawer(false)}
        onSave={handleUpdateLead}
        onDelete={handleDeleteLead}
      />

      <EmailModal
        open={showEmailModal}
        lead={selectedLead}
        onClose={() => setShowEmailModal(false)}
        user={user}
      />

      <CommunicationModal
        open={showCommunicationModal}
        lead={communicationLead}
        type={communicationType}
        onClose={() => {
          setShowCommunicationModal(false);
          setCommunicationLead(null);
          setCommunicationType('call');
        }}
        user={user}
      />
    </div>
  );
}