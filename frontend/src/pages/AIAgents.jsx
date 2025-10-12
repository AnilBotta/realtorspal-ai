import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Settings, Activity, Clock, CheckCircle, AlertCircle, Brain, Users, MessageSquare, Phone, BarChart3, Zap, Eye, ThumbsUp, ThumbsDown, Edit3, X, Search } from 'lucide-react';
import { getAIAgents, updateAIAgent, getAgentActivities, getApprovalQueue, handleApprovalDecision, createAgentActivity, orchestrateAgents, getLiveActivityStream, getAgentRuns, executeAgent } from '../api';
import LeadGenModal from '../components/LeadGenModal';
import NurtureModal from '../components/NurtureModal';

const AIAgents = ({ user }) => {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [liveStream, setLiveStream] = useState([]);
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [liveActivityStream, setLiveActivityStream] = useState([]);
  const [agentRuns, setAgentRuns] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showLeadGenModal, setShowLeadGenModal] = useState(false);
  const [showNurtureModal, setShowNurtureModal] = useState(false);
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
      loadData();
      
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

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load agents
      const agentsResponse = await getAIAgents(user.id);
      if (agentsResponse?.data?.agents) {
        const apiAgents = agentsResponse.data.agents.map(agent => ({
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
      }

      // Load activities (legacy)
      const activitiesResponse = await getAgentActivities(user.id, 50);
      if (activitiesResponse?.data?.activities) {
        const activities = activitiesResponse.data.activities.map(activity => ({
          ...activity,
          agent: {
            name: activity.agent_name,
            color: getColorForAgent(activity.agent_id),
            icon: getIconForAgent(activity.agent_id)
          },
          timestamp: new Date(activity.timestamp)
        }));
        setLiveStream(activities);
      }

      // Load approval queue
      const approvalsResponse = await getApprovalQueue(user.id);
      if (approvalsResponse?.data?.approvals) {
        const approvals = approvalsResponse.data.approvals.map(approval => ({
          ...approval,
          agent: {
            name: approval.agent_name,
            color: getColorForAgent(approval.agent_id),
            icon: getIconForAgent(approval.agent_id)
          },
          timestamp: new Date(approval.created_at)
        }));
        setApprovalQueue(approvals);
      }

      // Load Live Activity Stream (new)
      const streamResponse = await getLiveActivityStream(user.id, 50);
      if (streamResponse?.data?.activity_stream) {
        setLiveActivityStream(streamResponse.data.activity_stream);
      }

      // Load Agent Runs
      const runsResponse = await getAgentRuns(user.id, null, 100);
      if (runsResponse?.data?.agent_runs) {
        setAgentRuns(runsResponse.data.agent_runs);
      }

    } catch (error) {
      console.error('Failed to load AI Agents data:', error);
      // Fallback to local definitions for agents
      setAgents(agentDefinitions);
      setSelectedAgent(agentDefinitions[0]);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Agents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monitor and configure your AI workforce</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Agent Status</h3>
            <div className="space-y-3">
              {agents.map(agent => (
                <div 
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAgent?.id === agent.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getAgentColor(agent.color)}`}>
                        <agent.icon size={16} />
                      </div>
                      <div>
                        <div className="font-medium text-sm dark:text-white">{agent.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{agent.model}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{agent.lastActivity}</div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="dark:text-gray-300">Success: {agent.performance.successRate}%</span>
                    <span className="dark:text-gray-300">Avg: {agent.performance.avgResponse}s</span>
                  </div>
                  {agent.id === 'lead-generator' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLeadGenModal(true);
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Search size={14} />
                      Run Lead Gen
                    </button>
                  )}
                  {agent.id === 'lead-nurturing' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNurtureModal(true);
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <MessageSquare size={14} />
                      Start Nurture
                    </button>
                  )}
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
              {liveActivityStream.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Activity size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No activity yet</p>
                    <p className="text-sm">Start streaming to see AI agent activities</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveActivityStream.map((run, index) => (
                    <div key={run.id || index} className="border-l-4 border-blue-500 pl-4 pb-4">
                      {/* Agent Run Header */}
                      <div className="flex items-start gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-full ${getColorForAgent(run.agent_code)} flex items-center justify-center flex-shrink-0`}>
                          {React.createElement(getIconForAgent(run.agent_code), { 
                            size: 16, 
                            className: "text-white" 
                          })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{run.agent_code}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-sm text-gray-700">{run.lead_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(run.started_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              run.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                              run.status === 'failed' ? 'bg-red-100 text-red-800' :
                              run.status === 'running' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {run.status}
                            </span>
                            {run.step && (
                              <span className="text-xs text-gray-500">
                                Step: {run.step}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Events */}
                      {run.events && run.events.length > 0 && (
                        <div className="ml-11 space-y-1">
                          {run.events.slice(0, 3).map((event, eventIndex) => (
                            <div key={event.id || eventIndex} className="text-sm">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                event.type === 'ERROR' ? 'bg-red-400' :
                                event.type === 'MSG.DRAFTED' ? 'bg-purple-400' :
                                event.type === 'CRM.UPDATE' ? 'bg-blue-400' :
                                'bg-gray-400'
                              }`}></span>
                              <span className="text-gray-600">
                                {event.type}: {event.payload?.msg || JSON.stringify(event.payload).slice(0, 50)}...
                              </span>
                              <span className="text-xs text-gray-400 ml-2">
                                {new Date(event.ts).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                          {run.events.length > 3 && (
                            <div className="text-xs text-gray-500 ml-4">
                              +{run.events.length - 3} more events
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tasks Created */}
                      {run.tasks && run.tasks.length > 0 && (
                        <div className="ml-11 mt-2">
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            Tasks Created: {run.tasks.length}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {run.tasks.slice(0, 3).map((task, taskIndex) => (
                              <span key={task.id || taskIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                {task.channel === 'sms' && <MessageSquare size={10} className="mr-1" />}
                                {task.channel === 'email' && <Users size={10} className="mr-1" />}
                                {task.channel === 'call' && <Phone size={10} className="mr-1" />}
                                {task.title?.slice(0, 20)}...
                              </span>
                            ))}
                            {run.tasks.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{run.tasks.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
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

      {/* Configuration Modal */}
      {showConfigModal && (
        <AgentConfigModal 
          agent={configAgent}
          agents={agents}
          onSave={saveAgentConfig}
          onClose={() => setShowConfigModal(false)}
        />
      )}

      {/* Lead Generation Modal */}
      {showLeadGenModal && (
        <LeadGenModal 
          isOpen={showLeadGenModal}
          onClose={() => setShowLeadGenModal(false)}
          user={user}
        />
      )}

      {showNurtureModal && (
        <NurtureModal 
          isOpen={showNurtureModal}
          onClose={() => setShowNurtureModal(false)}
          user={user}
        />
      )}
    </div>
  );
};

// NurtureModal component moved to separate file: /app/frontend/src/components/NurtureModal.jsx

// Agent Configuration Modal Component
const AgentConfigModal = ({ agent, agents, onSave, onClose }) => {
  const [config, setConfig] = useState({
    status: agent?.status || 'active',
    model: agent?.model || 'gpt-4o',
    provider: agent?.provider || 'openai',
    system_prompt: agent?.system_prompt || '',
    response_tone: agent?.response_tone || 'professional',
    automation_rules: agent?.automation_rules || {},
    custom_templates: agent?.custom_templates || {}
  });

  const modelsByProvider = {
    openai: ['gpt-5', 'gpt-4o', 'gpt-4o-mini', 'gpt-4', 'o1', 'o1-mini'],
    anthropic: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    gemini: ['gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
  };

  const handleSave = () => {
    if (agent) {
      // Save individual agent config
      onSave(agent.id, config);
    } else {
      // Save global config to all agents
      agents.forEach(a => {
        onSave(a.id, config);
      });
    }
  };

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateAutomationRule = (key, value) => {
    setConfig(prev => ({
      ...prev,
      automation_rules: { ...prev.automation_rules, [key]: value }
    }));
  };

  const updateTemplate = (key, value) => {
    setConfig(prev => ({
      ...prev,
      custom_templates: { ...prev.custom_templates, [key]: value }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {agent ? `Configure ${agent.name}` : 'Global Agent Configuration'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Settings</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select 
                  value={config.status} 
                  onChange={(e) => updateConfig('status', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="idle">Idle</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Provider</label>
                <select 
                  value={config.provider} 
                  onChange={(e) => {
                    updateConfig('provider', e.target.value);
                    // Reset model when provider changes
                    updateConfig('model', modelsByProvider[e.target.value]?.[0] || 'gpt-4o');
                  }}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <select 
                  value={config.model} 
                  onChange={(e) => updateConfig('model', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  {modelsByProvider[config.provider]?.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Response Tone</label>
                <select 
                  value={config.response_tone} 
                  onChange={(e) => updateConfig('response_tone', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="empathetic">Empathetic</option>
                  <option value="analytical">Analytical</option>
                </select>
              </div>
            </div>

            {/* Automation Rules */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Automation Rules</h3>
              
              <div>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={config.automation_rules.auto_approve_low_risk || false}
                    onChange={(e) => updateAutomationRule('auto_approve_low_risk', e.target.checked)}
                  />
                  <span className="text-sm">Auto-approve low risk tasks</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={config.automation_rules.auto_validate || false}
                    onChange={(e) => updateAutomationRule('auto_validate', e.target.checked)}
                  />
                  <span className="text-sm">Auto-validate data</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={config.automation_rules.duplicate_check || false}
                    onChange={(e) => updateAutomationRule('duplicate_check', e.target.checked)}
                  />
                  <span className="text-sm">Perform duplicate checks</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Escalation Threshold (0-1)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="1" 
                  step="0.1"
                  value={config.automation_rules.escalate_threshold || 0.8}
                  onChange={(e) => updateAutomationRule('escalate_threshold', parseFloat(e.target.value))}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <h3 className="text-lg font-semibold mb-2">System Prompt</h3>
            <textarea 
              value={config.system_prompt} 
              onChange={(e) => updateConfig('system_prompt', e.target.value)}
              placeholder="Enter the system prompt for this agent..."
              className="w-full p-3 border rounded-lg h-32 resize-none"
            />
          </div>

          {/* Custom Templates */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Custom Templates</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Initial Contact Template</label>
                <textarea 
                  value={config.custom_templates.initial_contact || ''}
                  onChange={(e) => updateTemplate('initial_contact', e.target.value)}
                  placeholder="Hi {first_name}, thanks for your interest..."
                  className="w-full p-2 border rounded-lg h-20 resize-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Follow-up Template</label>
                <textarea 
                  value={config.custom_templates.follow_up || ''}
                  onChange={(e) => updateTemplate('follow_up', e.target.value)}
                  placeholder="Hi {first_name}, I wanted to follow up..."
                  className="w-full p-2 border rounded-lg h-20 resize-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Welcome Template</label>
                <textarea 
                  value={config.custom_templates.welcome || ''}
                  onChange={(e) => updateTemplate('welcome', e.target.value)}
                  placeholder="Welcome to our real estate family, {first_name}!"
                  className="w-full p-2 border rounded-lg h-20 resize-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAgents;