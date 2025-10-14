import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Mail, Phone, MapPin, Calendar, User, Edit, Trash2, RefreshCw, LayoutDashboard, X, Bot } from 'lucide-react';
import { getLeads, createLead, updateLead, deleteLead, orchestrateAgents, createAgentActivity, getEmailDraftCount } from '../api';
import AddLeadModal from '../components/AddLeadModal';
import ImportLeadsModal from '../components/ImportLeadsModal';
import LeadDrawer from '../components/LeadDrawer';
import EmailModal from '../components/EmailModal';
import EmailDraftModal from '../components/EmailDraftModal';
import EmailDraftModal from '../components/EmailDraftModal';
import CommunicationModal from '../components/CommunicationModal';
import FilterTemplates from '../components/FilterTemplates';
import AIAgentModal from '../components/AIAgentModal';

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
  const [appliedTemplateFilters, setAppliedTemplateFilters] = useState([]);
  
  // Advanced Panel Filters
  const [locationFilter, setLocationFilter] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
  const [leadSourceFilter, setLeadSourceFilter] = useState('all');
  const [lastContactFilter, setLastContactFilter] = useState('all');
  const [communicationFilter, setCommunicationFilter] = useState('all');

  // Handle template filters from FilterTemplates component
  const handleApplyTemplateFilters = (templateFilters) => {
    setAppliedTemplateFilters(templateFilters);
    console.log('Applied template filters:', templateFilters);
  };
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLeadDrawer, setShowLeadDrawer] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEmailDraftModal, setShowEmailDraftModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Communication modal states
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  
  // Email draft counts for each lead
  const [emailDraftCounts, setEmailDraftCounts] = useState({});
  const [communicationType, setCommunicationType] = useState('call');
  const [communicationLead, setCommunicationLead] = useState(null);

  // AI Agent modal states
  const [showAIAgentModal, setShowAIAgentModal] = useState(false);
  const [aiAgentLead, setAIAgentLead] = useState(null);

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

  // Listen for global filter events from header dropdown
  useEffect(() => {
    const handleGlobalFilters = (event) => {
      const { filters } = event.detail;
      console.log('Received global filters:', filters);
      setAppliedTemplateFilters(filters);
    };

    window.addEventListener('applyGlobalFilters', handleGlobalFilters);
    return () => {
      window.removeEventListener('applyGlobalFilters', handleGlobalFilters);
    };
  }, []);

  const loadLeads = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await getLeads(user.id);
      console.log('API Response:', response);
      // Handle different response structures
      const data = response.data || response || [];
      setLeads(Array.isArray(data) ? data : []);
      
      // Load email draft counts for each lead
      await loadEmailDraftCounts(data || []);
    } catch (error) {
      console.error('Failed to load leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };
  
  const loadEmailDraftCounts = async (leadsData) => {
    try {
      const counts = {};
      await Promise.all(
        leadsData.map(async (lead) => {
          try {
            const response = await getEmailDraftCount(lead.id);
            counts[lead.id] = response.data.draft_count || 0;
          } catch (error) {
            console.error(`Failed to get draft count for lead ${lead.id}:`, error);
            counts[lead.id] = 0;
          }
        })
      );
      setEmailDraftCounts(counts);
    } catch (error) {
      console.error('Failed to load email draft counts:', error);
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
    setShowEmailDraftModal(true);
  };

  const handleOpenEmailComposer = () => {
    setShowEmailDraftModal(false);
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

  const handleAIAgentLead = (lead) => {
    setAIAgentLead(lead);
    setShowAIAgentModal(true);
  };

  const handleRunAgent = async (agentConfig) => {
    try {
      console.log('Running AI agent with config:', agentConfig);
      
      // Create activity log for the AI action
      await createAgentActivity({
        agent_id: agentConfig.agent_id,
        lead_id: agentConfig.lead_id,
        activity_type: 'lead_processing',
        status: 'started',
        description: `Started processing lead: ${agentConfig.lead_data.name}`,
        metadata: {
          pipeline: agentConfig.lead_data.pipeline,
          priority: agentConfig.lead_data.priority,
          approval_mode: agentConfig.approval_mode
        }
      }, user.id);

      // If orchestrator is selected, let it decide the agent
      if (agentConfig.agent_id === 'orchestrator') {
        const orchestrationResult = await orchestrateAgents({
          task_type: 'analyze_and_assign_lead',
          lead_data: agentConfig.lead_data,
          approval_mode: agentConfig.approval_mode,
          context: `User requested AI assistance for lead in ${agentConfig.lead_data.pipeline || 'unknown'} stage`
        }, user.id);
        
        console.log('Orchestration result:', orchestrationResult);
      } else {
        // Run specific agent
        const agentResult = await orchestrateAgents({
          task_type: 'run_specific_agent',
          agent_id: agentConfig.agent_id,
          lead_data: agentConfig.lead_data,
          approval_mode: agentConfig.approval_mode
        }, user.id);
        
        console.log('Agent result:', agentResult);
      }
      
      // Update the lead with AI activity status
      const leadWithAIStatus = {
        ...agentConfig.lead_data,
        ai_status: 'processing',
        ai_agent: agentConfig.agent_id,
        last_ai_activity: new Date().toISOString()
      };
      
      // Update local state to show AI activity
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === agentConfig.lead_id 
            ? { ...lead, ...leadWithAIStatus }
            : lead
        )
      );

      alert(`AI agent is now working on this lead! Check the AI Agents page for live updates.`);
      
    } catch (error) {
      console.error('Failed to run AI agent:', error);
      alert('Failed to start AI agent. Please try again.');
    }
  };

  const handleImportComplete = () => {
    loadLeads();
    setShowImportModal(false);
  };

  // Smart search function - searches across all fields
  const searchAllFields = (lead, query) => {
    if (!query) return true;
    
    const searchTerm = query.toLowerCase();
    const searchableFields = [
      // Contact Info (100% weight)
      `${lead.first_name || ''} ${lead.last_name || ''}`,
      lead.email || '',
      lead.phone || '',
      lead.work_phone || '',
      lead.home_phone || '',
      
      // Location (80% weight)
      lead.city || '',
      lead.neighborhood || '',
      lead.address || '',
      lead.zip_postal_code || '',
      
      // Property & Budget (70% weight)
      lead.property_type || '',
      lead.price_min?.toString() || '',
      lead.price_max?.toString() || '',
      
      // Lead Details (60% weight)
      lead.lead_type || '',
      lead.lead_source || '',
      lead.ref_source || '',
      lead.pipeline || '',
      lead.status || '',
      lead.priority || '',
      lead.lead_rating || '',
      
      // Additional Info
      lead.lead_description || '',
      lead.spouse_first_name || '',
      lead.spouse_last_name || '',
      lead.main_agent || ''
    ];
    
    return searchableFields.some(field => 
      field.toLowerCase().includes(searchTerm)
    );
  };

  // Lead temperature classification
  const getLeadTemperature = (lead) => {
    const hotPipelines = ['signed agreement', 'showing', 'Hot/ Ready', 'set meeting'];
    const warmPipelines = ['warm / nurturing', 'made contact'];
    const coldPipelines = ['cold/not ready', 'not responsive', 'archive'];
    
    if (hotPipelines.includes(lead.pipeline)) return 'hot';
    if (warmPipelines.includes(lead.pipeline)) return 'warm';
    if (coldPipelines.includes(lead.pipeline)) return 'cold';
    return 'new'; // For 'Not set', 'New Lead', 'Tried to contact'
  };

  // Quick filter logic
  const applyQuickFilter = (lead, filterType) => {
    const now = new Date();
    const leadDate = new Date(lead.created_at);
    const daysDiff = Math.floor((now - leadDate) / (1000 * 60 * 60 * 24));
    
    switch (filterType) {
      case 'call-today':
        return lead.pipeline === 'Tried to contact' || lead.pipeline === 'not responsive';
      case 'show-ready':
        return ['Hot/ Ready', 'set meeting', 'showing'].includes(lead.pipeline);
      case 'new-leads':
        return daysDiff <= 7 || lead.pipeline === 'New Lead' || lead.pipeline === 'Not set';
      case 'hot-prospects':
        return getLeadTemperature(lead) === 'hot' || lead.priority === 'high';
      default:
        return true;
    }
  };

  // Budget filter logic
  const applyBudgetFilter = (lead) => {
    if (!budgetRange.min && !budgetRange.max) return true;
    
    const leadMin = lead.price_min || 0;
    const leadMax = lead.price_max || Infinity;
    const filterMin = budgetRange.min ? parseInt(budgetRange.min) : 0;
    const filterMax = budgetRange.max ? parseInt(budgetRange.max) : Infinity;
    
    return (leadMin <= filterMax && leadMax >= filterMin);
  };

  // Timeline filter logic
  const applyTimelineFilter = (lead) => {
    if (timelineFilter === 'all') return true;
    
    switch (timelineFilter) {
      case 'urgent':
        return lead.buying_in === '0-3 months' || lead.selling_in === '0-3 months';
      case 'soon':
        return lead.buying_in === '3-6 months' || lead.selling_in === '3-6 months';
      case 'later':
        return lead.buying_in === '6-12 months' || lead.selling_in === '6-12 months';
      case 'future':
        return lead.buying_in === '12+ months' || lead.selling_in === '12+ months';
      default:
        return true;
    }
  };

  // Template filter logic
  const applyTemplateFilters = (lead) => {
    if (!appliedTemplateFilters || appliedTemplateFilters.length === 0) return true;
    
    // All template filters must match for the lead to pass
    return appliedTemplateFilters.every(filter => {
      if (!filter.value) return true; // Skip filters without values
      
      let leadValue = '';
      const filterValue = filter.value.toLowerCase();
      
      // Map filter fields to lead object properties
      switch (filter.field) {
        case 'Phone Validity':
          leadValue = lead.phone ? 'valid' : 'invalid';
          break;
        case 'Pipeline':
          leadValue = (lead.pipeline || '').toLowerCase();
          break;
        case 'Pipeline Status':
          leadValue = (lead.status || '').toLowerCase();
          break;
        case 'Lead Type':
          leadValue = (lead.lead_type || '').toLowerCase();
          break;
        case 'Rating Status':
          leadValue = (lead.lead_rating || '').toLowerCase();
          break;
        case 'Source':
          leadValue = (lead.lead_source || lead.ref_source || '').toLowerCase();
          break;
        case 'Main Agent':
          leadValue = (lead.main_agent || '').toLowerCase();
          break;
        case 'Listing Agent':
          leadValue = (lead.list_agent || '').toLowerCase();
          break;
        case 'Mortgage Agent':
          leadValue = (lead.mort_agent || '').toLowerCase();
          break;
        case "Lead's City":
        case 'Buying City':
          leadValue = (lead.city || '').toLowerCase();
          break;
        case "Lead's Postal/Zip Code":
          leadValue = (lead.zip_postal_code || '').toLowerCase();
          break;
        case 'Email Validity':
          leadValue = lead.email ? 'valid' : 'invalid';
          break;
        case 'Price':
        case 'Buying Price':
          leadValue = (lead.price_min || lead.price_max || '').toString().toLowerCase();
          break;
        case 'Buying Timeframe':
          leadValue = (lead.buying_in || '').toLowerCase();
          break;
        case 'Selling Timeframe':
          leadValue = (lead.selling_in || '').toLowerCase();
          break;
        case 'Name (including Additional Contacts)':
          leadValue = (`${lead.first_name || ''} ${lead.last_name || ''} ${lead.spouse_first_name || ''} ${lead.spouse_last_name || ''}`).toLowerCase();
          break;
        case 'Keywords (Name, Additional Contacts, Email, …)':
          leadValue = (`${lead.first_name || ''} ${lead.last_name || ''} ${lead.email || ''} ${lead.spouse_first_name || ''} ${lead.spouse_last_name || ''} ${lead.spouse_email || ''} ${lead.lead_description || ''}`).toLowerCase();
          break;
        case 'Tag':
          leadValue = (lead.tags || '').toLowerCase();
          break;
        case 'Notes':
          leadValue = (lead.lead_description || '').toLowerCase();
          break;
        case "Lead's Street Address":
          leadValue = (lead.address || '').toLowerCase();
          break;
        case 'Mortgage Type':
          leadValue = (lead.mortgage_type || '').toLowerCase();
          break;
        case 'Email 2':
          leadValue = (lead.email_2 || '').toLowerCase();
          break;
        case 'Spouse First Name':
          leadValue = (lead.spouse_first_name || '').toLowerCase();
          break;
        case 'Spouse Last Name':
          leadValue = (lead.spouse_last_name || '').toLowerCase();
          break;
        case 'Spouse Email':
          leadValue = (lead.spouse_email || '').toLowerCase();
          break;
        case 'Spouse Mobile Phone':
          leadValue = (lead.spouse_mobile_phone || '').toLowerCase();
          break;
        default:
          return true; // Skip unknown fields
      }
      
      // Apply the operator
      switch (filter.operator) {
        case 'equals':
          return leadValue === filterValue;
        case 'contains':
          return leadValue.includes(filterValue);
        case 'startsWith':
          return leadValue.startsWith(filterValue);
        case 'endsWith':
          return leadValue.endsWith(filterValue);
        case 'greaterThan':
          return parseFloat(leadValue) > parseFloat(filterValue);
        case 'lessThan':
          return parseFloat(leadValue) < parseFloat(filterValue);
        default:
          return true;
      }
    });
  };

  // Filter and sort leads
  const filteredLeads = (Array.isArray(leads) ? leads : []).filter(lead => {
    // Apply all filters
    const matchesSearch = searchAllFields(lead, searchQuery);
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || lead.priority === filterPriority;
    const matchesQuickFilter = applyQuickFilter(lead, activeQuickFilter);
    const matchesTemperature = temperatureFilter === 'all' || getLeadTemperature(lead) === temperatureFilter;
    const matchesBudget = applyBudgetFilter(lead);
    const matchesTimeline = applyTimelineFilter(lead);
    
    // Advanced panel filters (only apply if advanced panel is open)
    let matchesAdvanced = true;
    if (showAdvancedPanel) {
      const matchesLocation = !locationFilter || 
        (lead.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
         lead.neighborhood?.toLowerCase().includes(locationFilter.toLowerCase()) ||
         lead.zip_postal_code?.includes(locationFilter));
      
      const matchesPropertyType = propertyTypeFilter === 'all' || lead.property_type === propertyTypeFilter;
      const matchesLeadSource = leadSourceFilter === 'all' || 
        lead.lead_source === leadSourceFilter || lead.ref_source === leadSourceFilter;
      
      matchesAdvanced = matchesLocation && matchesPropertyType && matchesLeadSource;
    }

    // Apply template filters
    const matchesTemplateFilters = applyTemplateFilters(lead);

    return matchesSearch && matchesStatus && matchesPriority && matchesQuickFilter && 
           matchesTemperature && matchesBudget && matchesTimeline && matchesAdvanced && matchesTemplateFilters;
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
      {/* INFO - Sticky Column */}
      <td className="sticky left-0 bg-inherit px-3 py-3 border-b border-r w-48 z-10">
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
              className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors relative"
              title={emailDraftCounts[lead.id] > 0 ? `Send Email (${emailDraftCounts[lead.id]} drafts pending)` : "Send Email"}
            >
              Email
              {emailDraftCounts[lead.id] > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {emailDraftCounts[lead.id] > 9 ? '9+' : emailDraftCounts[lead.id]}
                </span>
              )}
            </button>
          )}
          
          <button
            onClick={() => handleAIAgentLead(lead)}
            className={`px-2 py-1 text-white text-xs font-medium rounded transition-colors ${
              lead.ai_status === 'processing' 
                ? 'bg-purple-700 animate-pulse' 
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
            title={lead.ai_status === 'processing' ? `AI ${lead.ai_agent} is working...` : 'Run AI Agent'}
          >
            <Bot size={12} className="inline mr-1" />
            {lead.ai_status === 'processing' ? 'Working...' : 'AI Agent'}
          </button>
          
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
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-gray-500">
              {filteredLeads.length} of {Array.isArray(leads) ? leads.length : 0} leads
            </p>
            {appliedTemplateFilters && appliedTemplateFilters.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Template Active: {appliedTemplateFilters.length} filter{appliedTemplateFilters.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setAppliedTemplateFilters([])}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  title="Clear template filters"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <FilterTemplates onApplyFilter={handleApplyTemplateFilters} />
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

      {/* Advanced Filtering System */}
      <div className="bg-white rounded-lg border p-6">
        {/* Search Everything Box */}
        <div className="mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search everything... (name, email, phone, location, budget, etc.)"
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveQuickFilter(activeQuickFilter === 'all' ? 'all' : 'all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeQuickFilter === 'all' 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Leads ({filteredLeads.length})
            </button>
            <button
              onClick={() => setActiveQuickFilter(activeQuickFilter === 'call-today' ? 'all' : 'call-today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeQuickFilter === 'call-today' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              📞 Call Today
            </button>
            <button
              onClick={() => setActiveQuickFilter(activeQuickFilter === 'show-ready' ? 'all' : 'show-ready')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeQuickFilter === 'show-ready' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              🏠 Show Ready
            </button>
            <button
              onClick={() => setActiveQuickFilter(activeQuickFilter === 'new-leads' ? 'all' : 'new-leads')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeQuickFilter === 'new-leads' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              ✨ New Leads
            </button>
            <button
              onClick={() => setActiveQuickFilter(activeQuickFilter === 'hot-prospects' ? 'all' : 'hot-prospects')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeQuickFilter === 'hot-prospects' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              🔥 Hot Prospects
            </button>
          </div>
        </div>

        {/* Smart Filters Row */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Primary Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Temperature Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Temperature</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={temperatureFilter}
                onChange={(e) => setTemperatureFilter(e.target.value)}
              >
                <option value="all">All Temperatures</option>
                <option value="hot">🔥 Hot (Ready Now)</option>
                <option value="warm">🟡 Warm (Interested)</option>
                <option value="cold">🔵 Cold (Long Term)</option>
                <option value="new">✨ New (Just Added)</option>
              </select>
            </div>

            {/* Budget Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min ($)"
                  className="w-1/2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={budgetRange.min}
                  onChange={(e) => setBudgetRange(prev => ({ ...prev, min: e.target.value }))}
                />
                <input
                  type="number"
                  placeholder="Max ($)"
                  className="w-1/2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={budgetRange.max}
                  onChange={(e) => setBudgetRange(prev => ({ ...prev, max: e.target.value }))}
                />
              </div>
            </div>

            {/* Timeline Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={timelineFilter}
                onChange={(e) => setTimelineFilter(e.target.value)}
              >
                <option value="all">All Timelines</option>
                <option value="urgent">⚡ Urgent (0-3 months)</option>
                <option value="soon">📅 Soon (3-6 months)</option>
                <option value="later">🕒 Later (6-12 months)</option>
                <option value="future">🔮 Future (12+ months)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Panel Toggle */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Filter size={16} />
            {showAdvancedPanel ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {showAdvancedPanel ? 'Collapse' : 'Expand'}
            </span>
          </button>

          {/* Advanced Panel */}
          {showAdvancedPanel && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-800 mb-3">Advanced Filters</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="City, neighborhood, zip..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>

                {/* Property Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={propertyTypeFilter}
                    onChange={(e) => setPropertyTypeFilter(e.target.value)}
                  >
                    <option value="all">All Property Types</option>
                    <option value="Condo">Condo</option>
                    <option value="House">House</option>
                    <option value="Townhouse">Townhouse</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>

                {/* Lead Source Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={leadSourceFilter}
                    onChange={(e) => setLeadSourceFilter(e.target.value)}
                  >
                    <option value="all">All Sources</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Ext. source">External Source</option>
                    <option value="Advertisement">Advertisement</option>
                  </select>
                </div>
              </div>

              {/* Clear All Filters Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveQuickFilter('all');
                    setTemperatureFilter('all');
                    setBudgetRange({ min: '', max: '' });
                    setTimelineFilter('all');
                    setLocationFilter('');
                    setPropertyTypeFilter('all');
                    setLeadSourceFilter('all');
                    setFilterStatus('all');
                    setFilterPriority('all');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
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
                  <th className="sticky left-0 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 border-r z-20">
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

      <EmailDraftModal
        open={showEmailDraftModal}
        lead={selectedLead}
        onClose={() => setShowEmailDraftModal(false)}
        onOpenComposer={handleOpenEmailComposer}
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

      <AIAgentModal
        open={showAIAgentModal}
        lead={aiAgentLead}
        onClose={() => {
          setShowAIAgentModal(false);
          setAIAgentLead(null);
        }}
        onRunAgent={handleRunAgent}
        user={user}
      />
    </div>
  );
}