import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Mail, Phone, MapPin, Calendar, User, Edit, Trash2 } from 'lucide-react';
import { getLeads, createLead, updateLead, deleteLead } from '../api';
import AddLeadModal from '../components/AddLeadModal';
import ImportLeadsModal from '../components/ImportLeadsModal';
import LeadDrawer from '../components/LeadDrawer';
import EmailModal from '../components/EmailModal';

export default function Leads({ user }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLeadDrawer, setShowLeadDrawer] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    loadLeads();
  }, [user]);

  const loadLeads = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getLeads(user.id);
      // Ensure we always have an array
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
      const newLead = await createLead({ ...leadData, user_id: user.id });
      setLeads(prev => [newLead, ...prev]);
    } catch (error) {
      console.error('Failed to create lead:', error);
      throw error;
    }
  };

  const handleUpdateLead = async (leadData) => {
    try {
      const updatedLead = await updateLead(leadData.id, leadData);
      setLeads(prev => prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
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
      setLeads(prev => prev.filter(l => l.id !== lead.id));
      setShowLeadDrawer(false);
    } catch (error) {
      console.error('Failed to delete lead:', error);
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
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
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

  const LeadCard = ({ lead }) => (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900 text-lg">
            {lead.first_name} {lead.last_name}
          </h3>
          <p className="text-sm text-gray-500">{lead.lead_type || 'Lead'}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(lead.status)}`}>
            {lead.status || 'Open'}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(lead.priority)}`}>
            {lead.priority || 'Medium'}
          </span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {lead.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail size={14} />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={14} />
            <span>{lead.phone}</span>
          </div>
        )}
        {(lead.city || lead.neighborhood) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} />
            <span className="truncate">{lead.city || lead.neighborhood}</span>
          </div>
        )}
      </div>

      {/* Property Info */}
      {(lead.property_type || lead.buying_in || lead.budget) && (
        <div className="bg-gray-50 rounded p-3 mb-4">
          <div className="text-sm">
            {lead.property_type && (
              <div><span className="font-medium">Property:</span> {lead.property_type}</div>
            )}
            {lead.buying_in && (
              <div><span className="font-medium">Timeline:</span> {lead.buying_in}</div>
            )}
            {(lead.budget || lead.price_min || lead.price_max) && (
              <div>
                <span className="font-medium">Budget:</span> 
                {lead.budget && ` $${lead.budget.toLocaleString()}`}
                {!lead.budget && lead.price_min && lead.price_max && 
                  ` $${lead.price_min.toLocaleString()} - $${lead.price_max.toLocaleString()}`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agent Info */}
      {lead.main_agent && lead.main_agent !== 'Not selected' && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <User size={14} />
          <span>Agent: {lead.main_agent}</span>
        </div>
      )}

      {/* Meta Info */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={12} />
          <span>Created: {formatDate(lead.created_at)}</span>
        </div>
        {lead.pipeline && lead.pipeline !== 'Not Set' && (
          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
            {lead.pipeline}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => handleViewLead(lead)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
        >
          <Edit size={14} />
          View Details
        </button>
        {lead.email && (
          <button
            onClick={() => handleEmailLead(lead)}
            className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
          >
            <Mail size={14} />
            Email
          </button>
        )}
        <button
          onClick={() => handleDeleteLead(lead)}
          className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
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
            {filteredLeads.length} of {leads.length} leads
          </p>
        </div>
        <div className="flex gap-3">
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

      {/* Leads Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLeads.map(lead => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
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
    </div>
  );
}