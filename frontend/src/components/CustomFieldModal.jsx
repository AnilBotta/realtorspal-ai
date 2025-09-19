import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

export default function CustomFieldModal({ open, onClose, onSave }) {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('Text');
  const [dropdownOptions, setDropdownOptions] = useState(['']);
  const [errors, setErrors] = useState({});

  const fieldTypes = [
    { value: 'Text', label: 'Text' },
    { value: 'Date', label: 'Date' },
    { value: 'Number', label: 'Number' },
    { value: 'Dropdown', label: 'Dropdown' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!fieldName.trim()) {
      newErrors.fieldName = 'Field name is required';
    }
    
    if (fieldType === 'Dropdown') {
      const validOptions = dropdownOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        newErrors.dropdownOptions = 'Dropdown must have at least 2 options';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const customField = {
      name: fieldName.trim(),
      type: fieldType,
      options: fieldType === 'Dropdown' ? dropdownOptions.filter(opt => opt.trim()) : null
    };

    onSave(customField);
    handleClose();
  };

  const handleClose = () => {
    setFieldName('');
    setFieldType('Text');
    setDropdownOptions(['']);
    setErrors({});
    onClose();
  };

  const addDropdownOption = () => {
    setDropdownOptions([...dropdownOptions, '']);
  };

  const updateDropdownOption = (index, value) => {
    const newOptions = [...dropdownOptions];
    newOptions[index] = value;
    setDropdownOptions(newOptions);
  };

  const removeDropdownOption = (index) => {
    if (dropdownOptions.length > 1) {
      const newOptions = dropdownOptions.filter((_, i) => i !== index);
      setDropdownOptions(newOptions);
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    New Custom Field
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {/* Field Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.fieldName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Type Here..."
                      value={fieldName}
                      onChange={(e) => {
                        setFieldName(e.target.value);
                        if (errors.fieldName) {
                          setErrors(prev => ({ ...prev, fieldName: '' }));
                        }
                      }}
                    />
                    {errors.fieldName && (
                      <p className="text-red-500 text-xs mt-1">{errors.fieldName}</p>
                    )}
                  </div>

                  {/* Field Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Type
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={fieldType}
                      onChange={(e) => setFieldType(e.target.value)}
                    >
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dropdown Options */}
                  {fieldType === 'Dropdown' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dropdown Options
                      </label>
                      <div className="space-y-2">
                        {dropdownOptions.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={`Option ${index + 1}`}
                              value={option}
                              onChange={(e) => updateDropdownOption(index, e.target.value)}
                            />
                            {dropdownOptions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeDropdownOption(index)}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addDropdownOption}
                          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                        >
                          + Add Option
                        </button>
                      </div>
                      {errors.dropdownOptions && (
                        <p className="text-red-500 text-xs mt-1">{errors.dropdownOptions}</p>
                      )}
                    </div>
                  )}

                  {/* Field Type Description */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600">
                      {fieldType === 'Text' && 'Users can enter any text value'}
                      {fieldType === 'Date' && 'Users can select a date using a date picker'}
                      {fieldType === 'Number' && 'Users can enter numeric values only'}
                      {fieldType === 'Dropdown' && 'Users can select from predefined options'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6">
                  <button
                    onClick={handleSave}
                    disabled={!fieldName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}