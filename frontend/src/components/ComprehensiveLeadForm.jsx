import React, { useState, useEffect, useCallback } from 'react';
import { User, Home, Users, Settings, UserCheck } from 'lucide-react';
import CustomFieldModal from './CustomFieldModal';

// FormField component moved outside to prevent re-creation on every render
const FormField = ({ label, name, type = 'text', options = null, placeholder = '', required = false, formData, handleInputChange }) => {
  if (type === 'select') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData[name] || ''}
          onChange={(e) => handleInputChange(name, e.target.value)}
        >
          {options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
          value={formData[name] || ''}
          onChange={(e) => handleInputChange(name, e.target.value)}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={formData[name] || ''}
        onChange={(e) => handleInputChange(name, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};

const ComprehensiveLeadForm = ({ lead = null, onSave, onCancel, isModal = false }) => {
  const [activeTab, setActiveTab] = useState('lead-data');
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);
  const [formData, setFormData] = useState({
    // Basic Information
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    lead_description: '',
    
    // Additional Contact Information
    work_phone: '',
    home_phone: '',
    email_2: '',
    
    // Spouse Information
    spouse_name: '',
    spouse_first_name: '',
    spouse_last_name: '',
    spouse_email: '',
    spouse_mobile_phone: '',
    spouse_birthday: '',
    
    // Pipeline and Status
    pipeline: 'Not set',
    status: 'Open',
    ref_source: 'Ext. source',
    lead_rating: 'Not selected',
    lead_source: 'Not selected',
    lead_type: 'Not selected',
    lead_type_2: 'Not selected',
    
    // Property Information
    house_to_sell: 'Unknown',
    buying_in: 'Not selected',
    selling_in: 'Not selected',
    owns_rents: 'Not Selected',
    mortgage_type: 'Not selected',
    
    // Address Information
    city: '',
    zip_postal_code: '',
    address: '',
    
    // Property Details
    property_type: '',
    property_condition: '',
    listing_status: '',
    bedrooms: '',
    bathrooms: '',
    basement: '',
    parking_type: '',
    
    // Dates and Anniversaries
    date_of_birth: '',
    home_anniversary: '',
    house_anniversary: '',
    planning_to_sell_in: '',
    
    // Agent Assignments
    main_agent: 'Anil Botta',
    mort_agent: 'Not selected',
    list_agent: 'Not selected',
    
    // Custom Fields
    custom_fields: {},
    
    // Existing compatibility fields
    priority: 'medium',
    stage: 'New',
    notes: '',
    neighborhood: '',
    budget: '',
    price_min: '',
    price_max: '',
    source_tags: []
  });

  // Populate form if editing existing lead
  useEffect(() => {
    if (lead) {
      setFormData(prevData => ({
        ...prevData,
        ...lead,
        // Handle any field transformations if needed
        custom_fields: lead.custom_fields || {}
      }));
    }
  }, [lead]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleCustomFieldChange = useCallback((key, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [key]: value
      }
    }));
  }, []);

  const handleAddCustomField = (customFieldDef) => {
    const fieldName = customFieldDef.name;
    
    // Add to field definitions
    setCustomFieldDefinitions(prev => [...prev, customFieldDef]);
    
    // Initialize field value
    handleCustomFieldChange(fieldName, '');
  };

  const handleRemoveCustomField = (fieldName) => {
    // Remove from field definitions
    setCustomFieldDefinitions(prev => prev.filter(field => field.name !== fieldName));
    
    // Remove from form data
    const newCustomFields = { ...formData.custom_fields };
    delete newCustomFields[fieldName];
    setFormData(prev => ({ ...prev, custom_fields: newCustomFields }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    // Basic validation
    if (!formData.first_name || !formData.last_name) {
      alert('Please fill in the required fields: First Name and Last Name');
      return;
    }
    
    // Clean up data before submission
    const submitData = {
      ...formData,
      // Convert empty strings to null for optional fields
      budget: formData.budget ? parseInt(formData.budget) : null,
      price_min: formData.price_min ? parseInt(formData.price_min) : null,
      price_max: formData.price_max ? parseInt(formData.price_max) : null,
    };
    
    console.log('Submitting data:', submitData);
    onSave(submitData);
  };

  const tabs = [
    { id: 'lead-data', label: 'Lead Data', icon: User },
    { id: 'more-details', label: 'More Details', icon: Home },
    { id: 'buyer-info', label: 'Buyer Info', icon: Users },
    { id: 'seller-info', label: 'Seller Info', icon: Settings },
    { id: 'custom-fields', label: 'Custom Fields', icon: UserCheck },
  ];

  const TabButton = ({ tab, isActive, onClick }) => {
    const Icon = tab.icon;
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
        }`}
      >
        <Icon size={16} />
        {tab.label}
      </button>
    );
  };

  const renderLeadDataTab = () => (
    <div className="grid md:grid-cols-2 gap-4">
      <FormField label="First Name" name="first_name" required formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Last Name" name="last_name" required formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Phone" name="phone" type="tel" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Email" name="email" type="email" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Work Phone" name="work_phone" type="tel" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Home Phone" name="home_phone" type="tel" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Email 2" name="email_2" type="email" formData={formData} handleInputChange={handleInputChange} />
      <div className="md:col-span-2">
        <FormField label="Lead Description" name="lead_description" type="textarea" formData={formData} handleInputChange={handleInputChange} />
      </div>
      <FormField
        label="Pipeline"
        name="pipeline"
        type="select"
        formData={formData}
        handleInputChange={handleInputChange}
        options={[
          { value: 'Not set', label: 'Not set' },
          { value: 'New Lead', label: 'New Lead' },
          { value: 'Tried to contact', label: 'Tried to contact' },
          { value: 'not responsive', label: 'not responsive' },
          { value: 'made contact', label: 'made contact' },
          { value: 'cold/not ready', label: 'cold/not ready' },
          { value: 'warm / nurturing', label: 'warm / nurturing' },
          { value: 'Hot/ Ready', label: 'Hot/ Ready' },
          { value: 'set meeting', label: 'set meeting' },
          { value: 'signed agreement', label: 'signed agreement' },
          { value: 'showing', label: 'showing' },
          { value: 'sold', label: 'sold' },
          { value: 'past client', label: 'past client' },
          { value: 'sphere of influence', label: 'sphere of influence' },
          { value: 'archive', label: 'archive' }
        ]}
      />
      <FormField
        label="Status"
        name="status"
        type="select"
        formData={formData}
        handleInputChange={handleInputChange}
        options={[
          { value: 'Open', label: 'Open' },
          { value: 'Contacted', label: 'Contacted' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'Closed', label: 'Closed' }
        ]}
      />
    </div>
  );

  const renderMoreDetailsTab = () => (
    <div className="grid md:grid-cols-2 gap-4">
      <FormField label="City" name="city" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Zip/Postal Code" name="zip_postal_code" formData={formData} handleInputChange={handleInputChange} />
      <div className="md:col-span-2">
        <FormField label="Address" name="address" formData={formData} handleInputChange={handleInputChange} />
      </div>
      <FormField
        label="Ref. Source"
        name="ref_source"
        type="select"
        formData={formData}
        handleInputChange={handleInputChange}
        options={[
          { value: 'Ext. source', label: 'Ext. source' },
          { value: 'Website', label: 'Website' },
          { value: 'Referral', label: 'Referral' },
          { value: 'Social Media', label: 'Social Media' }
        ]}
      />
      <FormField
        label="Lead Rating"
        name="lead_rating"
        type="select"
        formData={formData}
        handleInputChange={handleInputChange}
        options={[
          { value: 'Not selected', label: 'Not selected' },
          { value: 'Hot', label: 'Hot' },
          { value: 'Warm', label: 'Warm' },
          { value: 'Cold', label: 'Cold' }
        ]}
      />
      <FormField
        label="Lead Source"
        name="lead_source"
        type="select"
        formData={formData}
        handleInputChange={handleInputChange}
        options={[
          { value: 'Not selected', label: 'Not selected' },
          { value: 'Website', label: 'Website' },
          { value: 'Referral', label: 'Referral' },
          { value: 'Advertisement', label: 'Advertisement' }
        ]}
      />
      <FormField
        label="Lead Type"
        name="lead_type"
        type="select"
        formData={formData}
        handleInputChange={handleInputChange}
        options={[
          { value: 'Not selected', label: 'Not selected' },
          { value: 'Buyer', label: 'Buyer' },
          { value: 'Seller', label: 'Seller' },
          { value: 'Both', label: 'Both' }
        ]}
      />
    </div>
  );

  const renderBuyerInfoTab = () => (
    <div className="grid md:grid-cols-2 gap-4">
      <FormField
        label="Buying In"
        name="buying_in"
        type="select"
        formData={formData}
        handleInputChange={handleInputChange}
        options={[
          { value: 'Not selected', label: 'Not selected' },
          { value: '0-3 months', label: '0-3 months' },
          { value: '3-6 months', label: '3-6 months' },
          { value: '6-12 months', label: '6-12 months' },
          { value: '12+ months', label: '12+ months' }
        ]}
      />
      <FormField
        label="Mortgage Type"
        name="mortgage_type"
        type="select"
        formData={formData}
        handleInputChange={handleInputChange}
        options={[
          { value: 'Not selected', label: 'Not selected' },
          { value: 'Conventional', label: 'Conventional' },
          { value: 'FHA', label: 'FHA' },
          { value: 'VA', label: 'VA' },
          { value: 'Cash', label: 'Cash' }
        ]}
      />
      <FormField label="Property Type" name="property_type" formData={formData} handleInputChange={handleInputChange} />
      <FormField
        label="Owns/Rents"
        name="owns_rents"
        type="select"
        formData={formData}
        handleInputChange={handleInputChange}
        options={[
          { value: 'Not Selected', label: 'Not Selected' },
          { value: 'Owns', label: 'Owns' },
          { value: 'Rents', label: 'Rents' }
        ]}
      />
      <FormField label="Budget Min" name="price_min" type="number" placeholder="0" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Budget Max" name="price_max" type="number" placeholder="0" formData={formData} handleInputChange={handleInputChange} />
      
      {/* Spouse Information */}
      <div className="md:col-span-2">
        <h4 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Spouse Information</h4>
      </div>
      <FormField label="Spouse First Name" name="spouse_first_name" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Spouse Last Name" name="spouse_last_name" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Spouse Email" name="spouse_email" type="email" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Spouse Mobile Phone" name="spouse_mobile_phone" type="tel" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Spouse Birthday" name="spouse_birthday" type="date" formData={formData} handleInputChange={handleInputChange} />
    </div>
  );

  const renderSellerInfoTab = () => (
    <div className="grid md:grid-cols-2 gap-4">
      <FormField
        label="House to Sell"
        name="house_to_sell"
        type="select"
        formData={formData}
        handleInputChange={handleInputChange}
        options={[
          { value: 'Unknown', label: 'Unknown' },
          { value: 'Yes', label: 'Yes' },
          { value: 'No', label: 'No' },
          { value: 'Maybe', label: 'Maybe' }
        ]}
      />
      <FormField
        label="Selling In"
        name="selling_in"
        type="select"
        formData={formData}
        handleInputChange={handleInputChange}
        options={[
          { value: 'Not selected', label: 'Not selected' },
          { value: '0-3 months', label: '0-3 months' },
          { value: '3-6 months', label: '3-6 months' },
          { value: '6-12 months', label: '6-12 months' },
          { value: '12+ months', label: '12+ months' }
        ]}
      />
      <FormField label="Bedrooms" name="bedrooms" placeholder="e.g., 3" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Bathrooms" name="bathrooms" placeholder="e.g., 2.5" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Basement" name="basement" placeholder="e.g., Finished" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Parking Type" name="parking_type" placeholder="e.g., Garage" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Property Condition" name="property_condition" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="Listing Status" name="listing_status" formData={formData} handleInputChange={handleInputChange} />
      <FormField label="House Anniversary" name="house_anniversary" type="date" formData={formData} handleInputChange={handleInputChange} />
      <FormField
        label="Planning to Sell In"
        name="planning_to_sell_in"
        type="select"
        formData={formData}
        handleInputChange={handleInputChange}
        options={[
          { value: '', label: 'Not selected' },
          { value: '0-3 months', label: '0-3 months' },
          { value: '3-6 months', label: '3-6 months' },
          { value: '6-12 months', label: '6-12 months' },
          { value: '12+ months', label: '12+ months' }
        ]}
      />
    </div>
  );

  const renderCustomFieldsTab = () => (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <FormField
          label="Lead Type 2"
          name="lead_type_2"
          type="select"
          formData={formData}
          handleInputChange={handleInputChange}
          options={[
            { value: 'Not selected', label: 'Not selected' },
            { value: 'First Time Buyer', label: 'First Time Buyer' },
            { value: 'Investor', label: 'Investor' },
            { value: 'Relocating', label: 'Relocating' }
          ]}
        />
        
        {/* Agent Assignments */}
        <div className="md:col-span-2">
          <h4 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">Agent Assignments</h4>
        </div>
        <FormField
          label="Main Agent"
          name="main_agent"
          type="select"
          formData={formData}
          handleInputChange={handleInputChange}
          options={[
            { value: 'Anil Botta', label: 'Anil Botta' },
            { value: 'Not selected', label: 'Not selected' }
          ]}
        />
        <FormField
          label="Mort. Agent"
          name="mort_agent"
          type="select"
          formData={formData}
          handleInputChange={handleInputChange}
          options={[
            { value: 'Not selected', label: 'Not selected' },
            { value: 'John Smith', label: 'John Smith' },
            { value: 'Jane Doe', label: 'Jane Doe' }
          ]}
        />
        <FormField
          label="List. Agent"
          name="list_agent"
          type="select"
          formData={formData}
          handleInputChange={handleInputChange}
          options={[
            { value: 'Not selected', label: 'Not selected' },
            { value: 'Mike Johnson', label: 'Mike Johnson' },
            { value: 'Sarah Wilson', label: 'Sarah Wilson' }
          ]}
        />
      </div>
      
      {/* Custom Fields Section */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Custom Fields</h4>
          <button
            type="button"
            onClick={() => setShowCustomFieldModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Add Custom Field
          </button>
        </div>
        
        {/* Render Custom Fields */}
        <div className="space-y-3">
          {customFieldDefinitions.map((fieldDef) => {
            const fieldName = fieldDef.name;
            const fieldValue = formData.custom_fields?.[fieldName] || '';
            
            return (
              <div key={fieldName} className="flex gap-3 items-start">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {fieldName}
                  </label>
                  
                  {fieldDef.type === 'Text' && (
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={fieldValue}
                      onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
                      placeholder={`Enter ${fieldName.toLowerCase()}`}
                    />
                  )}
                  
                  {fieldDef.type === 'Number' && (
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={fieldValue}
                      onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
                      placeholder={`Enter ${fieldName.toLowerCase()}`}
                    />
                  )}
                  
                  {fieldDef.type === 'Date' && (
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={fieldValue}
                      onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
                    />
                  )}
                  
                  {fieldDef.type === 'Dropdown' && (
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={fieldValue}
                      onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
                    >
                      <option value="">Not selected</option>
                      {fieldDef.options?.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(fieldName)}
                  className="mt-6 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                >
                  Remove
                </button>
              </div>
            );
          })}
          
          {customFieldDefinitions.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <p className="text-sm">No custom fields added yet</p>
              <p className="text-xs mt-1">Click "Add Custom Field" to create your first custom field</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'lead-data':
        return renderLeadDataTab();
      case 'more-details':
        return renderMoreDetailsTab();
      case 'buyer-info':
        return renderBuyerInfoTab();
      case 'seller-info':
        return renderSellerInfoTab();
      case 'custom-fields':
        return renderCustomFieldsTab();
      default:
        return renderLeadDataTab();
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b pb-4">
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {renderTabContent()}
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            {lead ? 'Update Lead' : 'Create Lead'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Custom Field Modal */}
      <CustomFieldModal
        open={showCustomFieldModal}
        onClose={() => setShowCustomFieldModal(false)}
        onSave={handleAddCustomField}
      />
    </div>
  );
};

export default ComprehensiveLeadForm;