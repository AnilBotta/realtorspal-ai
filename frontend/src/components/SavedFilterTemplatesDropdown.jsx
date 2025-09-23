import React, { useState, useEffect, useRef } from 'react';
import { Filter, ChevronDown, Play, X } from 'lucide-react';

const SavedFilterTemplatesDropdown = ({ onApplyFilter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [appliedTemplate, setAppliedTemplate] = useState(null);
  const dropdownRef = useRef(null);

  // Load saved templates from localStorage
  useEffect(() => {
    const loadSavedTemplates = () => {
      const saved = localStorage.getItem('filterTemplates');
      if (saved) {
        setSavedTemplates(JSON.parse(saved));
      }
    };

    loadSavedTemplates();

    // Listen for storage changes to update when templates are saved
    const handleStorageChange = (e) => {
      if (e.key === 'filterTemplates') {
        loadSavedTemplates();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when templates are updated in the same tab
    const handleTemplateUpdate = () => {
      loadSavedTemplates();
    };
    
    window.addEventListener('templateUpdated', handleTemplateUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('templateUpdated', handleTemplateUpdate);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const applyTemplate = (template) => {
    setAppliedTemplate(template);
    onApplyFilter(template.filters);
    setIsOpen(false);
  };

  const clearAppliedTemplate = () => {
    setAppliedTemplate(null);
    onApplyFilter([]);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ${
            appliedTemplate 
              ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
          }`}
        >
          <Filter size={16} />
          <span className="font-medium">Saved Filter Templates</span>
          {savedTemplates.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
              {savedTemplates.length}
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Clear Applied Template Button */}
        {appliedTemplate && (
          <button
            onClick={clearAppliedTemplate}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs transition-colors"
            title="Clear applied template"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Applied Template Indicator */}
      {appliedTemplate && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200 whitespace-nowrap">
          Active: {appliedTemplate.name} ({appliedTemplate.filters.length} filter{appliedTemplate.filters.length !== 1 ? 's' : ''})
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {savedTemplates.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              <Filter size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="font-medium">No saved templates</p>
              <p className="text-sm">Create templates from the Leads page</p>
            </div>
          ) : (
            <div className="p-2">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide px-2 py-1 mb-2">
                Saved Templates ({savedTemplates.length})
              </div>
              {savedTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`group p-3 rounded-lg border mb-2 transition-colors hover:bg-slate-50 ${
                    appliedTemplate?.id === template.id 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-slate-900 text-sm">
                      {template.name}
                    </h3>
                    <button
                      onClick={() => applyTemplate(template)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                        appliedTemplate?.id === template.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Play size={10} />
                      {appliedTemplate?.id === template.id ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                  
                  <div className="text-xs text-slate-500 mb-1">
                    Created: {formatDate(template.createdAt)}
                  </div>
                  
                  <div className="text-xs text-slate-600">
                    {template.filters.length} filter{template.filters.length !== 1 ? 's' : ''}:
                    <span className="ml-1 text-slate-500">
                      {template.filters.slice(0, 2).map(f => f.field).join(', ')}
                      {template.filters.length > 2 && ` and ${template.filters.length - 2} more`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedFilterTemplatesDropdown;