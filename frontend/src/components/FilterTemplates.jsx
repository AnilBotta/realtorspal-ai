import React, { useState, useEffect } from 'react';
import { Filter, Plus, X, Save, Play, Trash2 } from 'lucide-react';

const FilterTemplates = ({ onApplyFilter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [filterName, setFilterName] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [savedTemplates, setSavedTemplates] = useState([]);

  // Load saved templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('filterTemplates');
    if (saved) {
      setSavedTemplates(JSON.parse(saved));
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = (templates) => {
    localStorage.setItem('filterTemplates', JSON.stringify(templates));
    setSavedTemplates(templates);
  };

  // Comprehensive filter categories and fields
  const filterCategories = {
    COMMUNICATION: [
      'Last Contacted By Lead',
      'Lead Was Last Contacted', 
      'Lead Was Not Contacted',
      'Phone Validity',
      'Number of Calls',
      'Call Result',
      'Call Result: Talked to Lead',
      'Last Call Result',
      'Conversation Duration (in minutes)',
      'Number of SMS',
      'Last SMS to Lead',
      'Email Validity',
      'Unsubscribed Leads'
    ],
    PIPELINE: [
      'Pipeline',
      'Pipeline Status'
    ],
    'TASKS & CAMPAIGNS': [
      'Tasks',
      'Campaigns',
      'Last E-mail Activity'
    ],
    'LEAD DETAILS': [
      'Name (including Additional Contacts)',
      'Keywords (Name, Additional Contacts, Email, …)',
      'Birthday',
      'Religion',
      "Lead's IP City",
      'Lead Status',
      'Lead Type',
      'Mortgage Type',
      'Rating Status',
      'Tag',
      'Notes',
      "Lead's Street Address",
      "Lead's City",
      "Lead's Postal/Zip Code"
    ],
    'SEARCH CRITERIA': [
      'Buying City',
      'Buying Price',
      'Price',
      'Buying Timeframe',
      'Selling Timeframe',
      'Saved Searches'
    ],
    ACTIVITY: [
      'Registration',
      'Source',
      'Receiving Listing',
      'Last Activity (Property view)',
      'Lead Viewed Property Three or More Times',
      'Lead Last Liked Property',
      'Downloaded HomeLocator App',
      'HomeLocator App Usage'
    ],
    AGENT: [
      'Main Agent',
      'Listing Agent',
      'Mortgage Agent'
    ],
    'CUSTOM FIELDS': [
      'Custom Field',
      'Daughter Birthday',
      'Email 2',
      'House Anniversary',
      'Lead Type 2',
      'Spouse Birthday',
      'Spouse Email',
      'Spouse First Name',
      'Spouse Last Name',
      'Spouse Mobile Phone',
      'Spouse Name'
    ]
  };

  const addFilter = (category, field) => {
    const filterId = `${category}-${field}`;
    if (!selectedFilters.find(f => f.id === filterId)) {
      setSelectedFilters([...selectedFilters, {
        id: filterId,
        category,
        field,
        operator: 'equals',
        value: ''
      }]);
    }
  };

  const removeFilter = (filterId) => {
    setSelectedFilters(selectedFilters.filter(f => f.id !== filterId));
  };

  const updateFilter = (filterId, updates) => {
    setSelectedFilters(selectedFilters.map(f => 
      f.id === filterId ? { ...f, ...updates } : f
    ));
  };

  const saveTemplate = () => {
    if (!filterName.trim() || selectedFilters.length === 0) {
      alert('Please enter a template name and add at least one filter.');
      return;
    }

    const newTemplate = {
      id: Date.now().toString(),
      name: filterName,
      filters: selectedFilters,
      createdAt: new Date().toISOString()
    };

    const updatedTemplates = [...savedTemplates, newTemplate];
    saveTemplates(updatedTemplates);
    
    // Dispatch event to notify header dropdown of template update
    window.dispatchEvent(new CustomEvent('templateUpdated'));
    
    setFilterName('');
    setSelectedFilters([]);
    setActiveTab('saved');
    alert('Filter template saved successfully!');
  };

  const applyTemplate = (template) => {
    onApplyFilter(template.filters);
    setIsOpen(false);
  };

  const deleteTemplate = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
      saveTemplates(updatedTemplates);
      // Dispatch event to notify header dropdown of template update
      window.dispatchEvent(new CustomEvent('templateUpdated'));
    }
  };

  const clearFilters = () => {
    setSelectedFilters([]);
    setFilterName('');
  };

  return (
    <div className="relative">
      {/* Filter Templates Button */}
      <button
        onClick={(e) => {
          console.log('Filter Templates button clicked, current isOpen:', isOpen);
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
          console.log('After click, isOpen should be:', !isOpen);
        }}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Filter size={16} />
        <span className="text-sm font-medium">Filter Templates</span>
      </button>

      {/* Filter Templates Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Filter Templates</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'create'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Create Template
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'saved'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Saved Templates ({savedTemplates.length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'create' ? (
                <div className="h-full flex">
                  {/* Filter Categories */}
                  <div className="w-1/2 border-r overflow-y-auto">
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Please Select Filters
                      </h3>
                      
                      {Object.entries(filterCategories).map(([category, fields]) => (
                        <div key={category} className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            {category}
                          </h4>
                          <div className="space-y-1">
                            {fields.map(field => (
                              <button
                                key={field}
                                onClick={() => addFilter(category, field)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                              >
                                + {field}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Filters */}
                  <div className="w-1/2 overflow-y-auto">
                    <div className="p-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Template Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Hot Leads Toronto"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                        />
                      </div>

                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Selected Filters ({selectedFilters.length})
                      </h3>

                      {selectedFilters.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Filter size={48} className="mx-auto mb-4 text-gray-300" />
                          <p>No filters selected</p>
                          <p className="text-sm">Choose from the categories on the left</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedFilters.map(filter => (
                            <div key={filter.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {filter.field}
                                </span>
                                <button
                                  onClick={() => removeFilter(filter.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                              <div className="text-xs text-gray-500 mb-2">
                                {filter.category}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  className="text-sm px-2 py-1 border rounded"
                                  value={filter.operator}
                                  onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                                >
                                  <option value="equals">Equals</option>
                                  <option value="contains">Contains</option>
                                  <option value="startsWith">Starts with</option>
                                  <option value="endsWith">Ends with</option>
                                  <option value="greaterThan">Greater than</option>
                                  <option value="lessThan">Less than</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Value"
                                  className="text-sm px-2 py-1 border rounded"
                                  value={filter.value}
                                  onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Saved Templates */
                <div className="p-6 overflow-y-auto h-full">
                  {savedTemplates.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Filter size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No saved templates</p>
                      <p>Create your first filter template to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedTemplates.map(template => (
                        <div key={template.id} className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-medium text-gray-900">
                              {template.name}
                            </h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() => applyTemplate(template)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                              >
                                <Play size={14} />
                                Apply
                              </button>
                              <button
                                onClick={() => deleteTemplate(template.id)}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center gap-1"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            Created: {new Date(template.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {template.filters.length} filter{template.filters.length !== 1 ? 's' : ''}:
                            {template.filters.slice(0, 3).map(f => f.field).join(', ')}
                            {template.filters.length > 3 && ` and ${template.filters.length - 3} more`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {activeTab === 'create' && (
              <div className="p-6 border-t bg-gray-50 flex justify-between">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear Filters
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (selectedFilters.length > 0) {
                        onApplyFilter(selectedFilters);
                        setIsOpen(false);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={selectedFilters.length === 0}
                  >
                    Apply and Preview
                  </button>
                  <button
                    onClick={saveTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save size={16} />
                    Save as New
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterTemplates;