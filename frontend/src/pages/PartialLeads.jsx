import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, X, Trash2, Eye, Plus } from 'lucide-react';
import * as api from '../api';

export default function PartialLeads({ user }) {
  const [partialLeads, setPartialLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartialLead, setSelectedPartialLead] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  
  // Load partial leads on mount
  useEffect(() => {
    loadPartialLeads();
  }, []);

  const loadPartialLeads = async () => {
    try {
      setLoading(true);
      const response = await api.getPartialLeads();
      setPartialLeads(response.data || []);
    } catch (error) {
      console.error('Failed to load partial leads:', error);
      setPartialLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPartialLead = (partialLead) => {
    setSelectedPartialLead(partialLead);
    setShowConvertModal(true);
  };

  const handleRemovePartialLead = async (partialLead) => {
    if (!window.confirm('Are you sure you want to remove this partial lead? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.deletePartialLead(partialLead.id);
      await loadPartialLeads(); // Reload the list
    } catch (error) {
      console.error('Failed to remove partial lead:', error);
      alert('Failed to remove partial lead. Please try again.');
    }
  };

  // Search functionality
  const searchAllFields = (partialLead, query) => {
    if (!query) return true;
    
    const searchableText = [
      partialLead.raw_data?.name,
      partialLead.raw_data?.title,
      partialLead.raw_data?.phone,
      partialLead.raw_data?.email,
      partialLead.raw_data?.city,
      partialLead.raw_data?.address,
      partialLead.raw_data?.seller?.name,
      partialLead.raw_data?.seller?.phone,
      partialLead.raw_data?.category,
      partialLead.source,
      partialLead.notes
    ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

    return searchableText.includes(query.toLowerCase());
  };

  // Filter partial leads based on search
  const filteredPartialLeads = partialLeads.filter(partialLead => 
    searchAllFields(partialLead, searchQuery)
  );

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const extractDisplayData = (partialLead) => {
    const rawData = partialLead.raw_data || {};
    const seller = rawData.seller || {};
    
    return {
      name: seller.name || rawData.title || rawData.name || 'Unknown Contact',
      phone: seller.phone || rawData.phone || 'No phone',
      email: seller.email || rawData.email || 'No email',
      city: rawData.city || seller.location || 'No city',
      category: rawData.category || 'No category',
      website: rawData.website || seller.website || 'No website',
      rating: rawData.rating ? `${rawData.rating}/5` : 'No rating',
      source: partialLead.source || 'Unknown'
    };
  };

  // Component for partial lead table row
  const PartialLeadTableRow = ({ partialLead, index }) => {
    const displayData = extractDisplayData(partialLead);
    
    return (
      <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
        {/* INFO - Sticky Column */}
        <td className="sticky left-0 bg-inherit px-3 py-3 border-b border-r w-48 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
              {displayData.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">
                {displayData.name}
              </div>
              <div className="text-sm text-gray-500 truncate">{displayData.email}</div>
              <div className="text-sm text-gray-500 truncate">{displayData.phone}</div>
            </div>
          </div>
        </td>

        {/* STATUS */}
        <td className="px-3 py-3 border-b w-32">
          <div className="space-y-1">
            <span className="block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 truncate">
              {partialLead.status || 'Needs Review'}
            </span>
            <span className="block text-xs text-gray-600 truncate">
              Partial Data
            </span>
          </div>
        </td>

        {/* CONTACT INFO */}
        <td className="px-3 py-3 border-b w-48">
          <div className="text-sm text-gray-900">
            <div className="mb-1 truncate"><strong>Category:</strong> {displayData.category}</div>
            <div className="mb-1 truncate"><strong>City:</strong> {displayData.city}</div>
            <div className="truncate"><strong>Source:</strong> {displayData.source}</div>
          </div>
        </td>

        {/* BUSINESS INFO */}
        <td className="px-3 py-3 border-b w-44">
          <div className="text-sm text-gray-900">
            <div className="mb-1 truncate"><strong>Website:</strong> {displayData.website}</div>
            <div className="mb-1 truncate"><strong>Rating:</strong> {displayData.rating}</div>
          </div>
        </td>

        {/* TIMELINE */}
        <td className="px-3 py-3 border-b w-32">
          <div className="text-sm text-gray-900">
            <div className="mb-1 truncate"><strong>Created:</strong> {formatDate(partialLead.created_at)}</div>
          </div>
        </td>

        {/* NOTES */}
        <td className="px-3 py-3 border-b w-64">
          <div className="text-sm text-gray-900">
            <div className="truncate" title={partialLead.notes}>
              {partialLead.notes || 'No notes'}
            </div>
          </div>
        </td>

        {/* ACTIONS */}
        <td className="px-3 py-3 border-b w-32">
          <div className="flex gap-1">
            <button
              onClick={() => handleViewPartialLead(partialLead)}
              className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
              title="View and Convert"
            >
              <Eye size={12} className="inline mr-1" />
              View
            </button>
            
            <button
              onClick={() => handleRemovePartialLead(partialLead)}
              className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
              title="Remove Partial Lead"
            >
              <Trash2 size={12} className="inline mr-1" />
              Remove
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading partial leads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partial Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredPartialLeads.length} of {partialLeads.length} partial leads
            {filteredPartialLeads.length !== partialLeads.length && ' (filtered)'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadPartialLeads}
            className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border p-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search partial leads... (name, phone, email, city, category, etc.)"
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Partial Leads Table */}
      {filteredPartialLeads.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <div className="text-gray-500 mb-4">
            {searchQuery 
              ? 'No partial leads match your search' 
              : partialLeads.length === 0 
                ? 'No partial leads found' 
                : 'No partial leads to display'
            }
          </div>
          {partialLeads.length === 0 && (
            <p className="text-sm text-gray-400">
              Partial leads are created when the AI Lead Generation finds contacts with incomplete information.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="sticky left-0 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 border-r z-20">
                    INFO
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    STATUS
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    CONTACT INFO
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                    BUSINESS INFO
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    TIMELINE
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                    NOTES
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPartialLeads.map((partialLead, index) => (
                  <PartialLeadTableRow key={partialLead.id} partialLead={partialLead} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Convert Modal - Will be implemented using existing AddLeadModal pattern */}
      {showConvertModal && selectedPartialLead && (
        <PartialLeadConvertModal
          partialLead={selectedPartialLead}
          onClose={() => {
            setShowConvertModal(false);
            setSelectedPartialLead(null);
          }}
          onConvert={() => {
            loadPartialLeads(); // Reload the list after conversion
            setShowConvertModal(false);
            setSelectedPartialLead(null);
          }}
          user={user}
        />
      )}
    </div>
  );
}

// Convert Modal Component
function PartialLeadConvertModal({ partialLead, onClose, onConvert, user }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-populate form with data from partial lead
    const rawData = partialLead.raw_data || {};
    const seller = rawData.seller || {};
    
    const businessName = seller.name || rawData.title || rawData.name || '';
    let firstName = '';
    let lastName = '';
    
    // Parse business name into first/last name
    if (businessName) {
      const nameParts = businessName.split(' ');
      if (nameParts.length >= 2) {
        firstName = nameParts.slice(0, -1).join(' ');
        lastName = nameParts[nameParts.length - 1];
      } else {
        firstName = businessName;
        lastName = 'Agency';
      }
    }

    setFormData({
      first_name: firstName,
      last_name: lastName,
      email: seller.email || rawData.email || '',
      phone: seller.phone || rawData.phone || '',
      property_type: rawData.property_type || rawData.homeType || '',
      city: rawData.city || '',
      address: rawData.address || '',
      zip_postal_code: rawData.postalCode || rawData.zip_code || '',
      lead_source: 'Converted from Partial Lead',
      lead_type: 'Agent',
      priority: 'medium',
      pipeline: 'New Lead',
      status: 'Open',
      stage: 'New',
      notes: `Converted from partial lead\nCategory: ${rawData.category || 'N/A'}\nWebsite: ${seller.website || rawData.website || 'N/A'}\nRating: ${rawData.rating || 'N/A'}\nSource URL: ${rawData.source_url || 'N/A'}`,
      in_dashboard: true,
      source_tags: ['Converted from Partial', rawData.source || 'Unknown']
    });
  }, [partialLead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.convertPartialLead(partialLead.id, {
        user_id: user.id,
        ...formData
      });
      
      alert('Partial lead successfully converted to full lead!');
      onConvert();
    } catch (error) {
      console.error('Failed to convert partial lead:', error);
      alert('Failed to convert partial lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const rawData = partialLead.raw_data || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Convert Partial Lead</h2>
              <p className="text-sm text-gray-500 mt-1">
                Complete the information and convert to a full lead
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Raw Data Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Original Partial Lead Data</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Source:</strong> {partialLead.source}</div>
              <div><strong>Created:</strong> {new Date(partialLead.created_at).toLocaleString()}</div>
              <div><strong>Status:</strong> {partialLead.status}</div>
              {rawData.category && <div><strong>Category:</strong> {rawData.category}</div>}
              {rawData.rating && <div><strong>Rating:</strong> {rawData.rating}/5</div>}
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Property Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <input
                  type="text"
                  name="property_type"
                  value={formData.property_type || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="zip_postal_code"
                  value={formData.zip_postal_code || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Lead Classification */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={formData.priority || 'medium'}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline</label>
                <select
                  name="pipeline"
                  value={formData.pipeline || 'New Lead'}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Not set">Not set</option>
                  <option value="New Lead">New Lead</option>
                  <option value="Tried to contact">Tried to contact</option>
                  <option value="made contact">Made contact</option>
                  <option value="warm / nurturing">Warm / nurturing</option>
                  <option value="Hot/ Ready">Hot/ Ready</option>
                  <option value="set meeting">Set meeting</option>
                  <option value="signed agreement">Signed agreement</option>
                  <option value="showing">Showing</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead Type</label>
                <select
                  name="lead_type"
                  value={formData.lead_type || 'Agent'}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Agent">Agent</option>
                  <option value="Buyer">Buyer</option>
                  <option value="Seller">Seller</option>
                  <option value="Investor">Investor</option>
                  <option value="Contact">Contact</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={16} />
              {loading ? 'Converting...' : 'Convert to Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}