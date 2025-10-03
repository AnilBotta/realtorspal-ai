import React, { useState } from 'react';
import { X, Bot, Brain, Users, MessageSquare, Phone, CheckCircle, BarChart3 } from 'lucide-react';

const AIAgentModal = ({ open, lead, onClose, onRunAgent, user }) => {
  const [selectedAgent, setSelectedAgent] = useState('orchestrator');
  const [approvalMode, setApprovalMode] = useState('ask'); // 'ask' or 'automate'
  const [loading, setLoading] = useState(false);

  // Agent definitions matching the AIAgents page
  const availableAgents = [
    {
      id: 'orchestrator',
      name: 'Main Orchestrator AI',
      description: 'Analyzes lead stage and assigns the best agent automatically',
      icon: Brain,
      color: 'purple',
      recommended: true
    },
    {
      id: 'lead-nurturing',
      name: 'Lead Nurturing AI',
      description: 'Creates personalized follow-up sequences and emails',
      icon: MessageSquare,
      color: 'green'
    },
    {
      id: 'customer-service',
      name: 'Customer Service AI',
      description: 'Handles inquiries and provides customer support',
      icon: Phone,
      color: 'orange'
    },
    {
      id: 'onboarding',
      name: 'Onboarding Agent AI',
      description: 'Helps convert qualified leads into active clients',
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      id: 'call-analyst',
      name: 'Call Log Analyst AI',
      description: 'Analyzes call data and provides insights',
      icon: BarChart3,
      color: 'indigo'
    }
  ];

  const handleRunAgent = async () => {
    if (!selectedAgent || !lead) return;

    setLoading(true);
    try {
      await onRunAgent({
        agent_id: selectedAgent,
        lead_id: lead.id,
        lead_data: {
          name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
          email: lead.email,
          phone: lead.phone,
          pipeline: lead.pipeline,
          status: lead.status,
          priority: lead.priority,
          property_type: lead.property_type,
          city: lead.city,
          neighborhood: lead.neighborhood,
          price_min: lead.price_min,
          price_max: lead.price_max,
          lead_source: lead.lead_source || lead.ref_source,
          created_at: lead.created_at
        },
        approval_mode: approvalMode,
        user_id: user.id
      });
      onClose();
    } catch (error) {
      console.error('Failed to run AI agent:', error);
      // You could add error handling UI here
    } finally {
      setLoading(false);
    }
  };

  const getAgentColorClass = (color) => {
    const colorMap = {
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Run AI Agent</h3>
                <p className="text-sm text-gray-500">
                  {lead ? `for ${lead.first_name || ''} ${lead.last_name || ''}`.trim() : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Agent Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose AI Agent
            </label>
            <div className="space-y-2">
              {availableAgents.map((agent) => {
                const IconComponent = agent.icon;
                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedAgent === agent.id
                        ? `${getAgentColorClass(agent.color)} border-2`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedAgent === agent.id ? 'bg-white' : getAgentColorClass(agent.color)
                      }`}>
                        <IconComponent size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{agent.name}</h4>
                          {agent.recommended && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{agent.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedAgent === agent.id
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedAgent === agent.id && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Approval Mode */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Approval Flow
            </label>
            <div className="space-y-2">
              <div
                onClick={() => setApprovalMode('ask')}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  approvalMode === 'ask'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    approvalMode === 'ask'
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {approvalMode === 'ask' && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Ask for Approval</p>
                    <p className="text-sm text-gray-600">AI will ask permission before taking actions</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setApprovalMode('automate')}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  approvalMode === 'automate'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    approvalMode === 'automate'
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {approvalMode === 'automate' && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Automate Flow</p>
                    <p className="text-sm text-gray-600">AI will execute actions automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Context */}
          {lead && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Lead Context</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Stage:</span> {lead.pipeline || 'Not set'}</p>
                <p><span className="font-medium">Priority:</span> {lead.priority || 'Medium'}</p>
                <p><span className="font-medium">Property:</span> {lead.property_type || 'Not specified'}</p>
                <p><span className="font-medium">Location:</span> {lead.city || lead.neighborhood || 'Not specified'}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRunAgent}
              disabled={loading || !selectedAgent}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Bot size={16} />
                  Run AI Agent
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentModal;