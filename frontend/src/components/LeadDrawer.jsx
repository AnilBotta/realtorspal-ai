import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Edit, Trash2 } from 'lucide-react';
import ComprehensiveLeadForm from './ComprehensiveLeadForm';

export default function LeadDrawer({ open, lead, onClose, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);

  const handleSave = async (formData) => {
    try {
      await onSave(formData);
      setEditing(false);
    } catch (error) {
      console.error('Failed to save lead:', error);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  if (!lead) return null;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title className="text-xl font-medium text-gray-900">
                      {editing ? 'Edit Lead' : 'Lead Details'}
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 mt-1">
                      {lead.first_name} {lead.last_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!editing && (
                      <>
                        <button
                          onClick={handleEdit}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit Lead"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => onDelete && onDelete(lead)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                {editing ? (
                  <ComprehensiveLeadForm
                    lead={lead}
                    onSave={handleSave}
                    onCancel={handleCancelEdit}
                    isModal={true}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* Lead Information Display */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      
                      {/* Basic Information */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Basic Information</h3>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Name:</span> {lead.first_name} {lead.last_name}</div>
                          <div><span className="font-medium">Email:</span> {lead.email || 'Not provided'}</div>
                          <div><span className="font-medium">Phone:</span> {lead.phone || 'Not provided'}</div>
                          <div><span className="font-medium">Work Phone:</span> {lead.work_phone || 'Not provided'}</div>
                          <div><span className="font-medium">Home Phone:</span> {lead.home_phone || 'Not provided'}</div>
                        </div>
                      </div>

                      {/* Status Information */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Status & Pipeline</h3>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Pipeline:</span> {lead.pipeline || 'Not Set'}</div>
                          <div><span className="font-medium">Status:</span> {lead.status || 'Open'}</div>
                          <div><span className="font-medium">Stage:</span> {lead.stage || 'New'}</div>
                          <div><span className="font-medium">Priority:</span> {lead.priority || 'medium'}</div>
                          <div><span className="font-medium">Lead Rating:</span> {lead.lead_rating || 'Not selected'}</div>
                        </div>
                      </div>

                      {/* Property Information */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Property Information</h3>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Property Type:</span> {lead.property_type || 'Not specified'}</div>
                          <div><span className="font-medium">Buying In:</span> {lead.buying_in || 'Not selected'}</div>
                          <div><span className="font-medium">House to Sell:</span> {lead.house_to_sell || 'Unknown'}</div>
                          <div><span className="font-medium">Owns/Rents:</span> {lead.owns_rents || 'Not Selected'}</div>
                        </div>
                      </div>

                      {/* Address Information */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Address</h3>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Address:</span> {lead.address || 'Not provided'}</div>
                          <div><span className="font-medium">City:</span> {lead.city || 'Not provided'}</div>
                          <div><span className="font-medium">Zip Code:</span> {lead.zip_postal_code || 'Not provided'}</div>
                          <div><span className="font-medium">Neighborhood:</span> {lead.neighborhood || 'Not provided'}</div>
                        </div>
                      </div>

                      {/* Spouse Information */}
                      {(lead.spouse_first_name || lead.spouse_last_name || lead.spouse_email) && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-3">Spouse Information</h3>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Name:</span> {lead.spouse_first_name} {lead.spouse_last_name}</div>
                            <div><span className="font-medium">Email:</span> {lead.spouse_email || 'Not provided'}</div>
                            <div><span className="font-medium">Phone:</span> {lead.spouse_mobile_phone || 'Not provided'}</div>
                            <div><span className="font-medium">Birthday:</span> {lead.spouse_birthday || 'Not provided'}</div>
                          </div>
                        </div>
                      )}

                      {/* Agent Information */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Agent Assignments</h3>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Main Agent:</span> {lead.main_agent || 'Not selected'}</div>
                          <div><span className="font-medium">Mortgage Agent:</span> {lead.mort_agent || 'Not selected'}</div>
                          <div><span className="font-medium">Listing Agent:</span> {lead.list_agent || 'Not selected'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Property Details */}
                    {(lead.bedrooms || lead.bathrooms || lead.basement || lead.parking_type) && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Property Details</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div><span className="font-medium">Bedrooms:</span> {lead.bedrooms || 'Not specified'}</div>
                          <div><span className="font-medium">Bathrooms:</span> {lead.bathrooms || 'Not specified'}</div>
                          <div><span className="font-medium">Basement:</span> {lead.basement || 'Not specified'}</div>
                          <div><span className="font-medium">Parking:</span> {lead.parking_type || 'Not specified'}</div>
                        </div>
                      </div>
                    )}

                    {/* Budget Information */}
                    {(lead.budget || lead.price_min || lead.price_max) && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Budget Information</h3>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div><span className="font-medium">Budget:</span> {lead.budget ? `$${lead.budget.toLocaleString()}` : 'Not specified'}</div>
                          <div><span className="font-medium">Price Min:</span> {lead.price_min ? `$${lead.price_min.toLocaleString()}` : 'Not specified'}</div>
                          <div><span className="font-medium">Price Max:</span> {lead.price_max ? `$${lead.price_max.toLocaleString()}` : 'Not specified'}</div>
                        </div>
                      </div>
                    )}

                    {/* Custom Fields */}
                    {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Custom Fields</h3>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          {Object.entries(lead.custom_fields).map(([key, value]) => (
                            <div key={key}><span className="font-medium">{key}:</span> {value || 'Not specified'}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {lead.lead_description && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Description</h3>
                        <p className="text-sm text-gray-700">{lead.lead_description}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {lead.notes && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Notes</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}