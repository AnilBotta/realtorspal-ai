import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Settings, Activity, Clock, CheckCircle, AlertCircle, Brain, Users, MessageSquare, Phone, BarChart3, Zap, Eye, ThumbsUp, ThumbsDown, Edit3 } from 'lucide-react';
import { getAIAgents, updateAIAgent, getAgentActivities, getApprovalQueue, handleApprovalDecision, createAgentActivity, orchestrateAgents } from '../api';

const AIAgents = ({ user }) => {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [liveStream, setLiveStream] = useState([]);
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configAgent, setConfigAgent] = useState(null);
  const streamRef = useRef(null);

  // Agent definitions matching the user's requirements
  const agentDefinitions = [
    {
      id: 'orchestrator',
      name: 'Main Orchestrator AI',
      description: 'Coordinates all AI agents and makes strategic decisions',
      icon: Brain,
      color: 'purple',
      status: 'active',
      model: 'auto',
      lastActivity: 'Analyzing lead distribution pattern',
      performance: { successRate: 98, avgResponse: 1.2, tasksCompleted: 1547 }
    },
    {
      id: 'lead-generator',
      name: 'Lead Generator AI',
      description: 'Sources and normalizes leads from social media',
      icon: Users,
      color: 'blue',
      status: 'active',
      model: 'gpt-4o',
      lastActivity: 'Processing Facebook lead integration',
      performance: { successRate: 94, avgResponse: 2.1, tasksCompleted: 892 }
    },
    {
      id: 'lead-nurturing',
      name: 'Lead Nurturing AI',
      description: 'Creates personalized follow-up sequences',
      icon: MessageSquare,
      color: 'green',
      status: 'active',
      model: 'claude-3-sonnet',
      lastActivity: 'Drafting email sequence for warm leads',
      performance: { successRate: 96, avgResponse: 1.8, tasksCompleted: 634 }
    },
    {
      id: 'customer-service',
      name: 'Customer Service AI',
      description: 'Triages inbound messages and drafts replies',
      icon: Phone,
      color: 'orange',
      status: 'active',
      model: 'gemini-pro',
      lastActivity: 'Analyzing customer inquiry sentiment',
      performance: { successRate: 92, avgResponse: 0.9, tasksCompleted: 1203 }
    },
    {
      id: 'onboarding',
      name: 'Onboarding Agent AI',
      description: 'Converts qualified leads into active clients',
      icon: CheckCircle,
      color: 'emerald',
      status: 'active',
      model: 'gpt-4o-mini',
      lastActivity: 'Creating onboarding checklist',
      performance: { successRate: 89, avgResponse: 3.2, tasksCompleted: 156 }
    },
    {
      id: 'call-analyst',
      name: 'Call Log Analyst AI',
      description: 'Analyzes transcripts and extracts insights',
      icon: BarChart3,
      color: 'indigo',
      status: 'idle',
      model: 'claude-3-haiku',
      lastActivity: 'Waiting for call transcripts',
      performance: { successRate: 97, avgResponse: 2.5, tasksCompleted: 78 }
    }
  ];

  // Load real data from API
  useEffect(() => {
    if (user?.id) {
      loadAgentsData();
      loadActivitiesData();
      loadApprovalQueue();
      
      // Start live streaming
      startLiveStream();
    }
    
    return () => {
      if (streamRef.current) {
        clearInterval(streamRef.current);
      }
    };
  }, [user?.id]);

  const loadAgentsData = async () => {
    try {
      const response = await getAIAgents(user.id);
      const apiAgents = response.data.agents.map(agent => ({
        ...agent,
        icon: getIconForAgent(agent.id),
        color: getColorForAgent(agent.id),
        lastActivity: agent.lastActivity || 'Waiting for tasks',
        performance: agent.performance_metrics || { successRate: 0, avgResponse: 0, tasksCompleted: 0 }
      }));
      setAgents(apiAgents);
      if (apiAgents.length > 0) {
        setSelectedAgent(apiAgents[0]);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      // Fallback to local definitions
      setAgents(agentDefinitions);
      setSelectedAgent(agentDefinitions[0]);
    }
  };

  const loadActivitiesData = async () => {
    try {
      const response = await getAgentActivities(user.id, 50);
      const activities = response.data.activities.map(activity => ({
        ...activity,
        agent: {
          name: activity.agent_name,
          color: getColorForAgent(activity.agent_id),
          icon: getIconForAgent(activity.agent_id)
        },
        timestamp: new Date(activity.timestamp)
      }));
      setLiveStream(activities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const loadApprovalQueue = async () => {
    try {
      const response = await getApprovalQueue(user.id);
      const approvals = response.data.approvals.map(approval => ({
        ...approval,
        agent: {
          name: approval.agent_name,
          color: getColorForAgent(approval.agent_id),
          icon: getIconForAgent(approval.agent_id)
        },
        timestamp: new Date(approval.created_at)
      }));
      setApprovalQueue(approvals);
    } catch (error) {
      console.error('Error loading approval queue:', error);
    }
  };

  const getIconForAgent = (agentId) => {
    const iconMap = {
      'orchestrator': Brain,
      'lead-generator': Users,
      'lead-nurturing': MessageSquare,
      'customer-service': Phone,
      'onboarding': CheckCircle,
      'call-analyst': BarChart3,
      'human-supervisor': Eye
    };
    return iconMap[agentId] || Brain;
  };

  const getColorForAgent = (agentId) => {
    const colorMap = {
      'orchestrator': 'purple',
      'lead-generator': 'blue',
      'lead-nurturing': 'green',
      'customer-service': 'orange',
      'onboarding': 'emerald',
      'call-analyst': 'indigo',
      'human-supervisor': 'gray'
    };
    return colorMap[agentId] || 'gray';
  };

  const testAgent = async (agentType) => {
    try {
      let testData = {};
      
      switch (agentType) {
        case 'lead-generator':
          testData = {
            type: 'lead_generation',
            lead_data: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john.doe@example.com',
              phone: '+1234567890',
              city: 'Toronto',
              property_type: 'condo',
              budget_range: '$500k-$700k',
              source: 'facebook'
            }
          };
          break;
          
        case 'lead-nurturing':
          testData = {
            type: 'nurturing',
            nurture_type: 'follow_up'
          };
          break;
          
        case 'customer-service':
          testData = {
            type: 'customer_service',
            message: {
              content: 'Hi, I am interested in viewing some properties in downtown Toronto. Can you help me schedule a viewing?',
              source: 'email',
              timestamp: new Date().toISOString()
            },
            customer: {
              name: 'Jane Smith',
              email: 'jane.smith@email.com',
              previous_inquiries: 2
            }
          };
          break;
      }
      
      console.log(`Testing ${agentType} with data:`, testData);
      
      // This will be processed by the orchestrator
      const response = await orchestrateAgents(testData, user.id);
      console.log(`${agentType} test response:`, response);
      
      // Add to live stream
      const testActivity = {
        id: Date.now(),
        agent: {
          name: `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} AI (Test)`,
          color: getColorForAgent(agentType),
          icon: getIconForAgent(agentType)
        },
        activity: `Test completed: ${response.task || 'Agent processing'}`,
        timestamp: new Date(),
        status: 'completed',
        type: 'test'
      };
      setLiveStream(prev => [testActivity, ...prev.slice(0, 49)]);
      
    } catch (error) {
      console.error(`Error testing ${agentType}:`, error);
      
      // Add error to live stream
      const errorActivity = {
        id: Date.now(),
        agent: {
          name: 'System Error',
          color: 'red',
          icon: AlertCircle
        },
        activity: `Test failed for ${agentType}: ${error.message}`,
        timestamp: new Date(),
        status: 'failed',
        type: 'error'
      };
      setLiveStream(prev => [errorActivity, ...prev.slice(0, 49)]);
    }
  };

  const testOrchestrator = async () => {
    try {
      const testData = {
        type: 'general',
        priority: 'medium',
        description: 'Test orchestrator decision making with multiple lead scenarios'
      };
      
      console.log('Testing orchestrator with data:', testData);
      
      const response = await orchestrateAgents(testData, user.id);
      console.log('Orchestrator test response:', response);
      
      // Add to live stream
      const testActivity = {
        id: Date.now(),
        agent: {
          name: 'Master Orchestrator (Test)',
          color: 'purple',
          icon: Brain
        },
        activity: `Orchestration test: Selected ${response.selected_agent || 'an agent'} for task processing`,
        timestamp: new Date(),
        status: 'completed',
        type: 'test'
      };
      setLiveStream(prev => [testActivity, ...prev.slice(0, 49)]);
      
    } catch (error) {
      console.error('Error testing orchestrator:', error);
    }
  };

  const openGlobalConfig = () => {
    setShowConfigModal(true);
    setConfigAgent(null); // Global config
  };

  const openAgentConfig = (agent) => {
    setConfigAgent(agent);
    setShowConfigModal(true);
  };

  const saveAgentConfig = async (agentId, config) => {
    try {
      await updateAIAgent(agentId, config, user.id);
      
      // Update local agent state
      setAgents(prev => prev.map(agent => 
        agent.id === agentId ? { ...agent, ...config } : agent
      ));
      
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(prev => ({ ...prev, ...config }));
      }
      
      setShowConfigModal(false);
      
      // Add activity to stream
      const configActivity = {
        id: Date.now(),
        agent: {
          name: 'Human Supervisor',
          color: 'gray',
          icon: Settings
        },
        activity: `Updated configuration for ${agents.find(a => a.id === agentId)?.name || 'agent'}`,
        timestamp: new Date(),
        status: 'completed',
        type: 'configuration'
      };
      setLiveStream(prev => [configActivity, ...prev.slice(0, 49)]);
      
    } catch (error) {
      console.error('Error updating agent config:', error);
    }
  };

  // Live streaming with periodic API updates and simulated activities
  const startLiveStream = () => {
    setIsStreaming(true);
    
    // Refresh data periodically and simulate some activities
    streamRef.current = setInterval(async () => {
      // Refresh approval queue
      if (user?.id) {
        try {
          await loadApprovalQueue();
        } catch (error) {
          console.error('Error refreshing approval queue:', error);
        }
      }
      
      // Simulate some agent activities for demonstration
      if (Math.random() > 0.3) {  // 70% chance to add simulated activity
        const activities = [
          'Processing new lead from Facebook integration',
          'Analyzing customer sentiment in recent inquiry',
          'Drafting personalized follow-up email sequence',
          'Updating lead scoring based on engagement',
          'Generating onboarding checklist for new client',
          'Extracting insights from call transcript',
          'Optimizing lead distribution across agents',
          'Monitoring system performance metrics',
          'Validating lead data quality and duplicates',
          'Creating automated response templates'
        ];
        
        const agentIds = ['orchestrator', 'lead-generator', 'lead-nurturing', 'customer-service', 'onboarding', 'call-analyst'];
        const randomAgentId = agentIds[Math.floor(Math.random() * agentIds.length)];
        
        const newActivity = {
          id: Date.now(),
          agent: {
            name: agentDefinitions.find(a => a.id === randomAgentId)?.name || 'AI Agent',
            color: getColorForAgent(randomAgentId),
            icon: getIconForAgent(randomAgentId)
          },
          activity: activities[Math.floor(Math.random() * activities.length)],
          timestamp: new Date(),
          status: Math.random() > 0.1 ? 'completed' : 'processing',
          type: Math.random() > 0.8 ? 'approval_required' : 'automated'
        };

        setLiveStream(prev => [newActivity, ...prev.slice(0, 49)]);
        
        // Add to approval queue if approval required
        if (newActivity.type === 'approval_required' && user?.id) {
          const approvalItem = {
            id: newActivity.id,
            agent: newActivity.agent,
            task: newActivity.activity,
            proposal: {
              title: `${newActivity.agent.name} Recommendation`,
              summary: [
                'AI agent has analyzed the situation',
                'Proposed action will be executed',
                'Human approval required before proceeding'
              ],
              risks: ['Potential false positive', 'May require manual adjustment'],
              action: newActivity.activity
            },
            timestamp: newActivity.timestamp
          };
          setApprovalQueue(prev => [approvalItem, ...prev]);
        }
      }
    }, 3000);  // Check every 3 seconds
  };

  const stopLiveStream = () => {
    setIsStreaming(false);
    if (streamRef.current) {
      clearInterval(streamRef.current);
    }
  };

  const handleApproval = async (approvalId, decision) => {
    try {
      const approvalItem = approvalQueue.find(item => item.id === approvalId);
      
      await handleApprovalDecision(approvalId, { decision }, user.id);
      
      // Remove from approval queue
      setApprovalQueue(prev => prev.filter(item => item.id !== approvalId));
      
      // Add to live stream with decision
      const decision_activity = {
        id: Date.now(),
        agent: { name: 'Human Supervisor', color: 'gray', icon: Eye },
        activity: `${decision.toUpperCase()}: ${approvalItem?.task}`,
        timestamp: new Date(),
        status: 'completed',
        type: 'human_decision'
      };
      setLiveStream(prev => [decision_activity, ...prev.slice(0, 49)]);
    } catch (error) {
      console.error('Error handling approval:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'idle': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgentColor = (color) => {
    const colors = {
      purple: 'bg-purple-100 text-purple-700',
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      orange: 'bg-orange-100 text-orange-700',
      emerald: 'bg-emerald-100 text-emerald-700',
      indigo: 'bg-indigo-100 text-indigo-700',
      gray: 'bg-gray-100 text-gray-700'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-sm text-gray-500">Monitor and configure your AI workforce</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={isStreaming ? stopLiveStream : startLiveStream}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
              isStreaming ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isStreaming ? <Pause size={16} /> : <Play size={16} />}
            {isStreaming ? 'Stop Stream' : 'Start Stream'}
          </button>
          <button 
            onClick={openGlobalConfig}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Settings size={16} />
            Configure
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Overview */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-lg font-semibold mb-4">Agent Status</h3>
            <div className="space-y-3">
              {agents.map(agent => (
                <div 
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAgent?.id === agent.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getAgentColor(agent.color)}`}>
                        <agent.icon size={16} />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{agent.name}</div>
                        <div className="text-xs text-gray-500">{agent.model}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">{agent.lastActivity}</div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span>Success: {agent.performance.successRate}%</span>
                    <span>Avg: {agent.performance.avgResponse}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Queue */}
          {approvalQueue.length > 0 && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-600" />
                Approval Queue ({approvalQueue.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {approvalQueue.map(item => (
                  <div key={item.id} className="border rounded-lg p-3 bg-amber-50">
                    <div className="flex items-center gap-2 mb-2">
                      <item.agent.icon size={16} className={getAgentColor(item.agent.color)} />
                      <span className="font-medium text-sm">{item.agent.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm mb-3">{item.task}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproval(item.id, 'approve')}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        <ThumbsUp size={12} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(item.id, 'edit')}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        <Edit3 size={12} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleApproval(item.id, 'reject')}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        <ThumbsDown size={12} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Stream */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Activity size={18} className={isStreaming ? 'text-green-600 animate-pulse' : 'text-gray-400'} />
                  Live Activity Stream
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  {isStreaming ? 'Streaming' : 'Stopped'}
                </div>
              </div>
            </div>
            
            <div className="h-96 overflow-y-auto p-4">
              {liveStream.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Activity size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No activity yet</p>
                    <p className="text-sm">Start streaming to see AI agent activities</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveStream.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getAgentColor(activity.agent.color)}`}>
                        <activity.agent.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{activity.agent.name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                          {activity.type === 'approval_required' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                              Approval Required
                            </span>
                          )}
                          {activity.type === 'human_decision' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Human Decision
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-700">{activity.activity}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-2 h-2 rounded-full ${
                            activity.status === 'completed' ? 'bg-green-500' :
                            activity.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                            'bg-gray-400'
                          }`}></span>
                          <span className="text-xs text-gray-500 capitalize">{activity.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Agent Details */}
      {selectedAgent && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Agent Details: {selectedAgent.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Performance Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-medium">{selectedAgent.performance.successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Response:</span>
                  <span className="font-medium">{selectedAgent.performance.avgResponse}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasks Completed:</span>
                  <span className="font-medium">{selectedAgent.performance.tasksCompleted}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedAgent.status)}`}>
                    {selectedAgent.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span className="font-medium">{selectedAgent.model}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Actions</h4>
              <div className="space-y-2">
                <button 
                  onClick={() => openAgentConfig(selectedAgent)}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Configure Agent
                </button>
                <button className="w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                  View Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Testing Panel */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Test AI Agents</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => testAgent('lead-generator')}
            className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 text-center"
          >
            <Users size={24} className="mx-auto mb-2 text-blue-600" />
            <div className="font-medium">Test Lead Generator</div>
            <div className="text-sm text-gray-500">Analyze sample lead data</div>
          </button>
          
          <button
            onClick={() => testAgent('lead-nurturing')}
            className="p-4 border border-green-200 rounded-lg hover:bg-green-50 text-center"
          >
            <MessageSquare size={24} className="mx-auto mb-2 text-green-600" />
            <div className="font-medium">Test Lead Nurturing</div>
            <div className="text-sm text-gray-500">Create sample sequences</div>
          </button>
          
          <button
            onClick={() => testAgent('customer-service')}
            className="p-4 border border-orange-200 rounded-lg hover:bg-orange-50 text-center"
          >
            <Phone size={24} className="mx-auto mb-2 text-orange-600" />
            <div className="font-medium">Test Customer Service</div>
            <div className="text-sm text-gray-500">Triage sample message</div>
          </button>
        </div>
        
        <button
          onClick={testOrchestrator}
          className="mt-4 w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Brain size={20} className="inline mr-2" />
          Test Master Orchestrator
        </button>
      </div>
    </div>
  );
};

export default AIAgents;