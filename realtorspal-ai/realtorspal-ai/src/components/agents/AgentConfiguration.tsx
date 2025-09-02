"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import {
  Bot,
  BrainCircuit,
  Search,
  MessageSquare,
  Phone,
  FileText,
  Settings,
  Save,
  RefreshCw,
  Zap,
  Target,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Copy,
  Trash2,
  Cpu,
  Database,
  Sparkles,
  DollarSign
} from "lucide-react"

interface AgentConfig {
  id: string
  name: string
  role: string
  status: "active" | "paused" | "training"
  icon: React.ComponentType<{ className?: string }>
  color: string
  aiModel: "gpt-4" | "gpt-3.5-turbo" | "claude-3" | "claude-instant" | "gemini-pro" | "gemini-pro-vision"
  systemPrompt: string
  temperature: number
  maxTokens: number
  responseTime: number
  automationRules: Array<{
    id: string
    trigger: string
    condition: string
    action: string
    enabled: boolean
  }>
  performance: {
    successRate: number
    avgResponseTime: number
    tasksCompleted: number
  }
  modelSettings: {
    topP: number
    frequencyPenalty: number
    presencePenalty: number
  }
}

const aiModels = [
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    description: "Most capable model with superior reasoning",
    cost: "High",
    speed: "Medium",
    capabilities: ["Text", "Code", "Analysis"],
    recommended: true
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    description: "Fast and efficient for most tasks",
    cost: "Low",
    speed: "Fast",
    capabilities: ["Text", "Code"]
  },
  {
    id: "claude-3",
    name: "Claude 3",
    provider: "Anthropic",
    description: "Excellent for analysis and reasoning",
    cost: "Medium",
    speed: "Medium",
    capabilities: ["Text", "Analysis", "Safety"]
  },
  {
    id: "claude-instant",
    name: "Claude Instant",
    provider: "Anthropic",
    description: "Faster Claude variant for quick responses",
    cost: "Low",
    speed: "Fast",
    capabilities: ["Text", "Quick Analysis"]
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    description: "Advanced multimodal capabilities",
    cost: "Medium",
    speed: "Medium",
    capabilities: ["Text", "Vision", "Code"]
  },
  {
    id: "gemini-pro-vision",
    name: "Gemini Pro Vision",
    provider: "Google",
    description: "Specialized for image understanding",
    cost: "High",
    speed: "Medium",
    capabilities: ["Text", "Vision", "Analysis"]
  }
]

export function AgentConfiguration() {
  const { toast } = useToast()
  const [selectedAgent, setSelectedAgent] = useState<string>("orchestrator")

  const [agents, setAgents] = useState<AgentConfig[]>([
    {
      id: "orchestrator",
      name: "Main Orchestrator AI",
      role: "System Coordinator",
      status: "active",
      icon: BrainCircuit,
      color: "from-purple-500 to-pink-500",
      aiModel: "gpt-4",
      systemPrompt: `You are the Main Orchestrator AI for RealtorsPal, responsible for coordinating all AI agents and ensuring optimal system performance. Your primary objectives are:

1. Monitor all agent activities and performance metrics
2. Resolve conflicts between agents when they overlap or duplicate work
3. Optimize lead routing and task distribution
4. Ensure system-wide efficiency and harmony
5. Generate insights and recommendations for improvement

Always maintain a professional, analytical approach while ensuring seamless coordination between all system components.`,
      temperature: 0.3,
      maxTokens: 500,
      responseTime: 2,
      modelSettings: {
        topP: 0.9,
        frequencyPenalty: 0.1,
        presencePenalty: 0.1
      },
      automationRules: [
        {
          id: "1",
          trigger: "Agent Conflict Detected",
          condition: "Multiple agents working on same lead",
          action: "Reassign tasks and notify agents",
          enabled: true
        },
        {
          id: "2",
          trigger: "Low Conversion Rate",
          condition: "Conversion rate below 20% for 24 hours",
          action: "Send optimization recommendations",
          enabled: true
        }
      ],
      performance: {
        successRate: 98,
        avgResponseTime: 1.8,
        tasksCompleted: 247
      }
    },
    {
      id: "lead-generator",
      name: "Lead Generator AI",
      role: "Lead Acquisition",
      status: "active",
      icon: Search,
      color: "from-blue-500 to-cyan-500",
      aiModel: "claude-3",
      systemPrompt: `You are the Lead Generator AI for RealtorsPal, specialized in identifying and acquiring high-quality real estate leads. Your responsibilities include:

1. Scan social media platforms for potential property buyers/sellers
2. Analyze engagement patterns to identify intent
3. Enrich lead data with contact information and preferences
4. Score leads based on buying/selling likelihood
5. Integrate with advertising platforms to optimize targeting

Focus on quality over quantity, ensuring all generated leads meet our minimum qualification criteria.`,
      temperature: 0.7,
      maxTokens: 300,
      responseTime: 5,
      modelSettings: {
        topP: 0.8,
        frequencyPenalty: 0.2,
        presencePenalty: 0.0
      },
      automationRules: [
        {
          id: "3",
          trigger: "New Social Media Post",
          condition: "Property-related keywords detected",
          action: "Scan user profile and generate lead",
          enabled: true
        },
        {
          id: "4",
          trigger: "Ad Campaign Response",
          condition: "User clicks on property ad",
          action: "Capture lead and initiate qualification",
          enabled: true
        }
      ],
      performance: {
        successRate: 85,
        avgResponseTime: 4.2,
        tasksCompleted: 89
      }
    },
    {
      id: "lead-nurturing",
      name: "Lead Nurturing AI",
      role: "Relationship Building",
      status: "active",
      icon: MessageSquare,
      color: "from-green-500 to-emerald-500",
      aiModel: "gpt-3.5-turbo",
      systemPrompt: `You are the Lead Nurturing AI for RealtorsPal, focused on building relationships and guiding leads through the sales funnel. Your key functions are:

1. Send personalized follow-up emails and SMS messages
2. Respond to lead inquiries with relevant information
3. Schedule property viewings and agent meetings
4. Maintain engagement through valuable content sharing
5. Identify hot leads ready for conversion

Always maintain a warm, professional tone that builds trust and demonstrates expertise in real estate.`,
      temperature: 0.8,
      maxTokens: 400,
      responseTime: 3,
      modelSettings: {
        topP: 0.9,
        frequencyPenalty: 0.3,
        presencePenalty: 0.2
      },
      automationRules: [
        {
          id: "5",
          trigger: "Lead Inquiry",
          condition: "Lead sends message or email",
          action: "Send personalized response within 2 minutes",
          enabled: true
        },
        {
          id: "6",
          trigger: "No Response",
          condition: "Lead hasn't responded for 3 days",
          action: "Send follow-up with property suggestions",
          enabled: true
        }
      ],
      performance: {
        successRate: 72,
        avgResponseTime: 2.8,
        tasksCompleted: 156
      }
    },
    {
      id: "customer-service",
      name: "Customer Service AI",
      role: "Client Support",
      status: "active",
      icon: Phone,
      color: "from-orange-500 to-red-500",
      aiModel: "gemini-pro",
      systemPrompt: `You are the Customer Service AI for RealtorsPal, providing exceptional support to leads and clients. Your responsibilities include:

1. Answer questions about properties, financing, and processes
2. Schedule appointments and property viewings
3. Handle support tickets and resolve issues
4. Escalate complex matters to human agents when needed
5. Maintain detailed interaction logs for continuity

Provide helpful, accurate information while maintaining a friendly and professional demeanor.`,
      temperature: 0.5,
      maxTokens: 350,
      responseTime: 1,
      modelSettings: {
        topP: 0.85,
        frequencyPenalty: 0.1,
        presencePenalty: 0.1
      },
      automationRules: [
        {
          id: "7",
          trigger: "Incoming Call",
          condition: "Call received during business hours",
          action: "Answer with greeting and route appropriately",
          enabled: true
        },
        {
          id: "8",
          trigger: "FAQ Question",
          condition: "Question matches FAQ database",
          action: "Provide immediate automated response",
          enabled: true
        }
      ],
      performance: {
        successRate: 91,
        avgResponseTime: 1.2,
        tasksCompleted: 43
      }
    },
    {
      id: "onboarding",
      name: "Onboarding Agent AI",
      role: "Document Processing",
      status: "active",
      icon: FileText,
      color: "from-indigo-500 to-purple-500",
      aiModel: "claude-instant",
      systemPrompt: `You are the Onboarding Agent AI for RealtorsPal, specializing in client onboarding and document management. Your duties include:

1. Prepare and send contracts, agreements, and legal documents
2. Guide clients through e-signature processes
3. Validate document completeness and accuracy
4. Coordinate with legal and compliance teams
5. Manage client onboarding workflows

Ensure all processes comply with legal requirements and maintain accurate records throughout.`,
      temperature: 0.2,
      maxTokens: 300,
      responseTime: 4,
      modelSettings: {
        topP: 0.7,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0
      },
      automationRules: [
        {
          id: "9",
          trigger: "Deal Accepted",
          condition: "Client accepts property offer",
          action: "Generate purchase agreement automatically",
          enabled: true
        },
        {
          id: "10",
          trigger: "Document Signed",
          condition: "E-signature completed",
          action: "Send confirmation and next steps",
          enabled: true
        }
      ],
      performance: {
        successRate: 94,
        avgResponseTime: 3.5,
        tasksCompleted: 28
      }
    }
  ])

  const currentAgent = agents.find(agent => agent.id === selectedAgent)

  const updateAgent = (updates: Partial<AgentConfig>) => {
    setAgents(prev => prev.map(agent =>
      agent.id === selectedAgent ? { ...agent, ...updates } : agent
    ))
  }

  const toggleAgentStatus = () => {
    const newStatus = currentAgent?.status === "active" ? "paused" : "active"
    updateAgent({ status: newStatus })
    toast({
      title: "Agent Status Updated",
      description: `${currentAgent?.name} is now ${newStatus}`,
    })
  }

  const saveConfiguration = () => {
    toast({
      title: "Configuration Saved",
      description: `${currentAgent?.name} configuration has been updated successfully.`,
    })
  }

  const testAgent = () => {
    toast({
      title: "Testing Agent",
      description: `Running test scenarios for ${currentAgent?.name}...`,
    })
  }

  const addAutomationRule = () => {
    const newRule = {
      id: Date.now().toString(),
      trigger: "New Trigger",
      condition: "Condition to evaluate",
      action: "Action to perform",
      enabled: true
    }
    updateAgent({
      automationRules: [...(currentAgent?.automationRules || []), newRule]
    })
  }

  const deleteAutomationRule = (ruleId: string) => {
    updateAgent({
      automationRules: currentAgent?.automationRules?.filter(rule => rule.id !== ruleId) || []
    })
  }

  const toggleRule = (ruleId: string) => {
    updateAgent({
      automationRules: currentAgent?.automationRules?.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      ) || []
    })
  }

  const changeAIModel = (modelId: string) => {
    updateAgent({ aiModel: modelId as AgentConfig['aiModel'] })
    toast({
      title: "AI Model Changed",
      description: `${currentAgent?.name} now uses ${aiModels.find(m => m.id === modelId)?.name}`,
    })
  }

  if (!currentAgent) return null

  const Icon = currentAgent.icon
  const selectedModel = aiModels.find(m => m.id === currentAgent.aiModel)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${currentAgent.color} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI Agent Configuration</h1>
              <p className="text-slate-600">Customize behavior, prompts, and AI models</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={testAgent}
              className="px-4"
            >
              <Play className="w-4 h-4 mr-2" />
              Test Agent
            </Button>
            <Button
              variant={currentAgent.status === "active" ? "destructive" : "default"}
              onClick={toggleAgentStatus}
              className="px-4"
            >
              {currentAgent.status === "active" ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Agent
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Activate Agent
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Agent Selector */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
          <CardContent className="p-4">
            <div className="flex gap-4 overflow-x-auto">
              {agents.map((agent) => {
                const AgentIcon = agent.icon
                const model = aiModels.find(m => m.id === agent.aiModel)
                return (
                  <Button
                    key={agent.id}
                    variant={selectedAgent === agent.id ? "default" : "outline"}
                    onClick={() => setSelectedAgent(agent.id)}
                    className="flex flex-col items-center gap-2 min-w-fit h-auto p-3"
                  >
                    <div className="flex items-center gap-2">
                      <AgentIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={agent.status === "active" ? "default" : "secondary"} className="text-xs">
                        {agent.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {model?.name}
                      </Badge>
                    </div>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Tabs */}
        <Tabs defaultValue="behavior" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="behavior">Behavior & Prompts</TabsTrigger>
            <TabsTrigger value="ai-model">AI Model</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* AI Model Selection Tab */}
          <TabsContent value="ai-model">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  AI Model Selection
                </CardTitle>
                <CardDescription>
                  Choose the best AI model for this agent's specific role and requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Model */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-blue-900">Currently Selected</h3>
                        <p className="text-sm text-blue-700">{selectedModel?.name} by {selectedModel?.provider}</p>
                      </div>
                    </div>
                    {selectedModel?.recommended && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-blue-700">{selectedModel?.description}</p>
                  <div className="flex gap-4 mt-3 text-xs">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Cost: {selectedModel?.cost}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Speed: {selectedModel?.speed}
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      Capabilities: {selectedModel?.capabilities.join(", ")}
                    </span>
                  </div>
                </div>

                {/* Model Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiModels.map((model) => (
                    <Card
                      key={model.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        currentAgent.aiModel === model.id
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-slate-50'
                      }`}
                      onClick={() => changeAIModel(model.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{model.name}</CardTitle>
                            <CardDescription className="text-sm">{model.provider}</CardDescription>
                          </div>
                          {model.recommended && (
                            <Badge variant="secondary" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-slate-600">{model.description}</p>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>Cost: {model.cost}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Speed: {model.speed}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {model.capabilities.map((cap) => (
                            <Badge key={cap} variant="outline" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavior & Prompts */}
          <TabsContent value="behavior">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle>System Prompt</CardTitle>
                    <CardDescription>
                      Define the agent's personality, knowledge, and behavior patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={currentAgent.systemPrompt}
                      onChange={(e) => updateAgent({ systemPrompt: e.target.value })}
                      rows={12}
                      className="font-mono text-sm"
                      placeholder="Enter the system prompt for this agent..."
                    />
                    <div className="flex justify-between items-center mt-4 text-xs text-slate-600">
                      <span>{currentAgent.systemPrompt.length} characters</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button size="sm" variant="outline">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reset to Default
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle>Agent Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Current Status</Label>
                      <Badge variant={currentAgent.status === "active" ? "default" : "secondary"}>
                        {currentAgent.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Label>Performance Overview</Label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center p-2 bg-slate-50 rounded">
                          <div className="font-bold text-lg">{currentAgent.performance.successRate}%</div>
                          <div className="text-slate-600">Success Rate</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded">
                          <div className="font-bold text-lg">{currentAgent.performance.avgResponseTime}s</div>
                          <div className="text-slate-600">Avg Response</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Restart Agent
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Copy className="w-4 h-4 mr-2" />
                      Clone Configuration
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Logs
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Performance Tuning */}
          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle>Response Parameters</CardTitle>
                  <CardDescription>
                    Fine-tune how the agent generates responses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Temperature</Label>
                      <span className="text-sm text-slate-600">{currentAgent.temperature}</span>
                    </div>
                    <Slider
                      value={[currentAgent.temperature]}
                      onValueChange={([value]) => updateAgent({ temperature: value })}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-600">Higher values make responses more creative, lower values more focused</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Max Tokens</Label>
                      <span className="text-sm text-slate-600">{currentAgent.maxTokens}</span>
                    </div>
                    <Slider
                      value={[currentAgent.maxTokens]}
                      onValueChange={([value]) => updateAgent({ maxTokens: value })}
                      max={1000}
                      min={100}
                      step={50}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-600">Maximum length of agent responses</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Top P</Label>
                      <span className="text-sm text-slate-600">{currentAgent.modelSettings.topP}</span>
                    </div>
                    <Slider
                      value={[currentAgent.modelSettings.topP]}
                      onValueChange={([value]) => updateAgent({
                        modelSettings: { ...currentAgent.modelSettings, topP: value }
                      })}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-600">Controls diversity via nucleus sampling</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Response Time (seconds)</Label>
                      <span className="text-sm text-slate-600">{currentAgent.responseTime}</span>
                    </div>
                    <Slider
                      value={[currentAgent.responseTime]}
                      onValueChange={([value]) => updateAgent({ responseTime: value })}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-600">Target response time for this agent</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Real-time performance data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{currentAgent.performance.successRate}%</div>
                      <div className="text-sm text-slate-600">Success Rate</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{currentAgent.performance.avgResponseTime}s</div>
                      <div className="text-sm text-slate-600">Avg Response Time</div>
                    </div>
                  </div>

                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{currentAgent.performance.tasksCompleted}</div>
                    <div className="text-sm text-slate-600">Tasks Completed Today</div>
                  </div>

                  <div className="space-y-2">
                    <Label>Performance Trend</Label>
                    <div className="h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-slate-400" />
                      <span className="ml-2 text-slate-600">Chart placeholder</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Automation Rules */}
          <TabsContent value="automation">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Automation Rules</CardTitle>
                    <CardDescription>
                      Configure triggers and actions for automated behavior
                    </CardDescription>
                  </div>
                  <Button onClick={addAutomationRule}>
                    <Zap className="w-4 h-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentAgent.automationRules.map((rule) => (
                    <div key={rule.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => toggleRule(rule.id)}
                          />
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteAutomationRule(rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Trigger</Label>
                          <Input
                            value={rule.trigger}
                            onChange={(e) => {
                              const updatedRules = currentAgent.automationRules.map(r =>
                                r.id === rule.id ? { ...r, trigger: e.target.value } : r
                              )
                              updateAgent({ automationRules: updatedRules })
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Condition</Label>
                          <Input
                            value={rule.condition}
                            onChange={(e) => {
                              const updatedRules = currentAgent.automationRules.map(r =>
                                r.id === rule.id ? { ...r, condition: e.target.value } : r
                              )
                              updateAgent({ automationRules: updatedRules })
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Action</Label>
                          <Input
                            value={rule.action}
                            onChange={(e) => {
                              const updatedRules = currentAgent.automationRules.map(r =>
                                r.id === rule.id ? { ...r, action: e.target.value } : r
                              )
                              updateAgent({ automationRules: updatedRules })
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {currentAgent.automationRules.length === 0 && (
                    <div className="text-center py-8 text-slate-600">
                      <Zap className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      No automation rules configured yet. Click "Add Rule" to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle>Agent Analytics</CardTitle>
                <CardDescription>
                  Detailed performance analytics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600">Detailed analytics coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-6">
          <Button onClick={saveConfiguration} className="px-6">
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  )
}
