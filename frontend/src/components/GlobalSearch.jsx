import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, ChevronDown, ChevronUp, Home, Users, Bot, BarChart3, Database, Settings, Plus, Upload, Mail, Phone, MessageSquare, Zap, Key, Globe } from 'lucide-react';
import { getLeads } from '../api';

const GlobalSearch = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    pages: [],
    features: [],
    settings: [],
    leads: [],
    actions: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  // Static search data for app navigation and features
  const staticSearchData = {
    pages: [
      { id: 'dashboard', name: 'Dashboard', path: '/', description: 'View KPIs and lead pipeline', icon: Home, category: 'Navigation' },
      { id: 'leads', name: 'Leads', path: '/leads', description: 'Manage all your leads', icon: Users, category: 'Navigation' },
      { id: 'ai-agents', name: 'AI Agents', path: '/agents', description: 'Configure AI assistants', icon: Bot, category: 'Navigation' },
      { id: 'analytics', name: 'Analytics', path: '/analytics', description: 'View reports and insights', icon: BarChart3, category: 'Navigation' },
      { id: 'data', name: 'Data', path: '/data', description: 'Manage your data', icon: Database, category: 'Navigation' },
      { id: 'agent-config', name: 'Agent Config', path: '/agent-config', description: 'Configure agent settings', icon: Settings, category: 'Navigation' },
      { id: 'settings', name: 'Settings', path: '/settings', description: 'App configuration and preferences', icon: Settings, category: 'Navigation' }
    ],
    features: [
      { id: 'add-lead', name: 'Add Lead', path: '/leads', action: 'add-lead', description: 'Create a new lead', icon: Plus, category: 'Features' },
      { id: 'import-leads', name: 'Import Leads', path: '/leads', action: 'import-leads', description: 'Import leads from file', icon: Upload, category: 'Features' },
      { id: 'filter-templates', name: 'Filter Templates', path: '/leads', action: 'filter-templates', description: 'Create and manage lead filters', icon: Filter, category: 'Features' },
      { id: 'global-search', name: 'Global Search', path: null, action: 'global-search', description: 'Search across entire application', icon: Search, category: 'Features' },
      { id: 'email-lead', name: 'Email Lead', path: '/leads', action: 'email', description: 'Send email to leads', icon: Mail, category: 'Communication' },
      { id: 'call-lead', name: 'Call Lead', path: '/leads', action: 'call', description: 'Make phone calls to leads', icon: Phone, category: 'Communication' },
      { id: 'sms-lead', name: 'SMS Lead', path: '/leads', action: 'sms', description: 'Send SMS to leads', icon: MessageSquare, category: 'Communication' }
    ],
    settings: [
      { id: 'ai-config', name: 'AI Configuration', path: '/settings', action: 'ai-config', description: 'Configure OpenAI, Anthropic, Gemini API keys', icon: Bot, category: 'Settings' },
      { id: 'twilio-settings', name: 'Twilio Communication', path: '/settings', action: 'twilio', description: 'Configure phone and SMS settings', icon: Phone, category: 'Settings' },
      { id: 'smtp-settings', name: 'SMTP Email', path: '/settings', action: 'smtp', description: 'Configure email server settings', icon: Mail, category: 'Settings' },
      { id: 'webhook-settings', name: 'Lead Generation Webhooks', path: '/settings', action: 'webhooks', description: 'Facebook, Instagram lead capture', icon: Globe, category: 'Settings' },
      { id: 'crew-api', name: 'Crew.AI API Integration', path: '/settings', action: 'crew-api', description: 'External API for Crew.AI agents', icon: Zap, category: 'Settings' },
      { id: 'api-keys', name: 'API Keys', path: '/settings', action: 'api-keys', description: 'Manage API authentication', icon: Key, category: 'Settings' }
    ],
    actions: [
      { id: 'refresh-leads', name: 'Refresh Leads', path: '/leads', action: 'refresh', description: 'Reload lead data', icon: Search, category: 'Actions' },
      { id: 'clear-filters', name: 'Clear Filters', path: '/leads', action: 'clear-filters', description: 'Remove all applied filters', icon: X, category: 'Actions' },
      { id: 'export-data', name: 'Export Data', path: '/data', action: 'export', description: 'Export your CRM data', icon: Upload, category: 'Actions' }
    ]
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search function across all app data
  const performGlobalSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults({ pages: [], features: [], settings: [], leads: [], actions: [] });
      return;
    }

    setIsSearching(true);
    const searchTerm = query.toLowerCase();
    
    try {
      // Search through static app data
      const searchInArray = (items) => items.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
      );

      const filteredPages = searchInArray(staticSearchData.pages);
      const filteredFeatures = searchInArray(staticSearchData.features);
      const filteredSettings = searchInArray(staticSearchData.settings);
      const filteredActions = searchInArray(staticSearchData.actions);

      // Search through leads data
      let filteredLeads = [];
      try {
        const response = await getLeads(user.id);
        console.log('Global search API response:', response);
        
        const leadsData = response.data || [];
        filteredLeads = leadsData.filter(lead => {
          return (
            `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase().includes(searchTerm) ||
            lead.email?.toLowerCase().includes(searchTerm) ||
            lead.phone?.includes(searchTerm) ||
            lead.city?.toLowerCase().includes(searchTerm) ||
            lead.property_type?.toLowerCase().includes(searchTerm) ||
            lead.pipeline?.toLowerCase().includes(searchTerm) ||
            lead.status?.toLowerCase().includes(searchTerm) ||
            lead.lead_description?.toLowerCase().includes(searchTerm)
          );
        }) || [];
      } catch (leadError) {
        console.error('Error searching leads:', leadError);
      }

      console.log('Search results:', {
        pages: filteredPages.length,
        features: filteredFeatures.length, 
        settings: filteredSettings.length,
        leads: filteredLeads.length,
        actions: filteredActions.length
      });

      setSearchResults({
        pages: filteredPages,
        features: filteredFeatures,
        settings: filteredSettings,
        leads: filteredLeads,
        actions: filteredActions
      });
    } catch (error) {
      console.error('Global search error:', error);
      setSearchResults({ pages: [], features: [], settings: [], leads: [], actions: [] });
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        performGlobalSearch(searchQuery);
      } else {
        setSearchResults({ leads: [], agents: [], properties: [], tasks: [], campaigns: [] });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, user.id]);

  const totalResults = Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="relative" ref={searchRef}>
      {/* Global Search Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Search size={16} className="text-gray-500" />
        <span className="text-sm text-gray-700">Search everything...</span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-96 bg-white border rounded-lg shadow-lg z-50">
          {/* Search Input */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search across entire app..."
                className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Searching...
              </div>
            ) : searchQuery && totalResults === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No results found for "{searchQuery}"
              </div>
            ) : searchQuery && totalResults > 0 ? (
              <div className="py-2">
                {/* Leads Results */}
                {searchResults.leads.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-2 bg-gray-50 border-b">
                      <h3 className="text-sm font-medium text-gray-700">
                        Leads ({searchResults.leads.length})
                      </h3>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {searchResults.leads.map(lead => (
                        <div
                          key={lead.id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                          onClick={() => {
                            // Navigate to lead details
                            window.location.href = '/leads';
                            setIsOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                              {((lead.first_name || '').charAt(0) + (lead.last_name || '').charAt(0)).toUpperCase() || 'L'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {lead.first_name} {lead.last_name}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {lead.email} • {lead.phone}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {lead.pipeline || 'No Pipeline'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {lead.city || 'No City'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add more result sections as needed */}
                {/* Agents, Properties, Tasks, Campaigns */}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Start typing to search across all your data...
              </div>
            )}
          </div>

          {/* Footer */}
          {searchQuery && totalResults > 0 && (
            <div className="p-3 border-t bg-gray-50 text-center">
              <span className="text-xs text-gray-600">
                Found {totalResults} results across your CRM
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;