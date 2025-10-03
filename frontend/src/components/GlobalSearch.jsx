import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { getLeads } from '../api';

const GlobalSearch = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    leads: [],
    agents: [],
    properties: [],
    tasks: [],
    campaigns: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

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
      setSearchResults({ leads: [], agents: [], properties: [], tasks: [], campaigns: [] });
      return;
    }

    setIsSearching(true);
    try {
      // Simulate API call - in real app, this would search across all data
      // For now, we'll focus on leads since that's our main data
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/leads/${user.id}`);
      const leadsData = await response.json();
      
      const filteredLeads = leadsData.data?.filter(lead => {
        const searchTerm = query.toLowerCase();
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

      setSearchResults({
        leads: filteredLeads,
        agents: [], // TODO: Add agent search
        properties: [], // TODO: Add property search
        tasks: [], // TODO: Add task search
        campaigns: [] // TODO: Add campaign search
      });
    } catch (error) {
      console.error('Global search error:', error);
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