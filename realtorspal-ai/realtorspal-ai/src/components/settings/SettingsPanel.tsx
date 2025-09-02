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
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import {
  Settings,
  Key,
  Mail,
  MessageSquare,
  Brain,
  Webhook,
  Database,
  Shield,
  Bell,
  Palette,
  Save,
  Eye,
  EyeOff,
  TestTube,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Copy,
  RefreshCw,
  Upload,
  Download,
  Zap,
  Lock,
  Unlock,
  DollarSign
} from "lucide-react"

export function SettingsPanel() {
  const { toast } = useToast()
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<Record<string, "connected" | "error" | "not-configured">>({
    openai: "connected",
    twilio: "connected",
    twilioAuthToken: "connected",
    twilioPhoneNumber: "connected",
    meta: "error",
    google: "not-configured",
    sendgrid: "connected",
    mailgun: "not-configured"
  })

  const [apiKeys, setApiKeys] = useState({
    openai: "sk-proj-••••••••••••••••••••••••••••••••••••••••••••••••••••",
    twilio: "AC••••••••••••••••••••••••••••••••••••••••••••••••••••",
    twilioAuthToken: "••••••••••••••••••••••••••••••••••••••••••••••••••••",
    twilioPhoneNumber: "+1 (555) 123-4567",
    meta: "EAA••••••••••••••••••••••••••••••••••••••••••••••••••••",
    google: "AIza••••••••••••••••••••••••••••••••••••••••••••••••••",
    sendgrid: "SG.••••••••••••••••••••••••••••••••••••••••••••••••••",
    mailgun: "key-••••••••••••••••••••••••••••••••••••••••••••••••"
  })

  const [emailSettings, setEmailSettings] = useState({
    provider: "sendgrid",
    fromName: "RealtorsPal AI",
    fromEmail: "noreply@realtorspal.ai",
    smtpHost: "smtp.sendgrid.net",
    smtpPort: "587",
    username: "apikey"
  })

  const [smsSettings, setSmsSettings] = useState({
    provider: "twilio",
    fromNumber: "+1 (555) 123-4567",
    webhookUrl: "https://api.realtorspal.ai/webhooks/sms"
  })

  const [notifications, setNotifications] = useState({
    newLeads: true,
    agentAlerts: true,
    appointments: true,
    documents: true,
    systemHealth: false,
    emailReports: true
  })

  const [webhooks, setWebhooks] = useState([
    {
      id: "1",
      name: "Lead Webhook",
      url: "https://api.realtorspal.ai/webhooks/leads",
      events: ["lead.created", "lead.updated"],
      status: "active"
    },
    {
      id: "2",
      name: "Calendar Sync",
      url: "https://calendar.google.com/webhook",
      events: ["appointment.created"],
      status: "inactive"
    }
  ])

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const testConnection = async (service: string) => {
    setTestingConnection(service)

    toast({
      title: "Testing Connection",
      description: `Testing ${service} connection...`,
    })

    // Simulate API test with realistic timing
    try {
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))

      // Simulate different outcomes
      const isSuccess = Math.random() > 0.3 // 70% success rate

      if (isSuccess) {
        setConnectionStatus(prev => ({ ...prev, [service]: "connected" }))
        toast({
          title: "Connection Successful",
          description: `${service} is properly configured and connected.`,
        })
      } else {
        setConnectionStatus(prev => ({ ...prev, [service]: "error" }))
        toast({
          title: "Connection Failed",
          description: `Unable to connect to ${service}. Please check your configuration.`,
          variant: "destructive"
        })
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [service]: "error" }))
      toast({
        title: "Test Failed",
        description: `Error testing ${service} connection.`,
        variant: "destructive"
      })
    } finally {
      setTestingConnection(null)
    }
  }

  const saveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "All configuration changes have been saved successfully.",
    })
  }

  const exportSettings = () => {
    const settings = {
      apiKeys: Object.keys(apiKeys).reduce((acc, key) => ({ ...acc, [key]: "••••••••" }), {}),
      emailSettings,
      smsSettings,
      notifications,
      webhooks,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'realtorspal-settings.json'
    a.click()

    toast({
      title: "Settings Exported",
      description: "Configuration exported to realtorspal-settings.json",
    })
  }

  const importSettings = () => {
    toast({
      title: "Import Settings",
      description: "Opening file picker to import configuration...",
    })
    // In a real app, this would open a file picker
  }

  const resetToDefaults = () => {
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
    })
  }

  const copyApiKey = (service: string) => {
    navigator.clipboard.writeText(apiKeys[service as keyof typeof apiKeys])
    toast({
      title: "API Key Copied",
      description: `${service} API key copied to clipboard`,
    })
  }

  const generateApiKey = (service: string) => {
    const newKey = `${service.toUpperCase()}-${Math.random().toString(36).substr(2, 20)}`
    setApiKeys(prev => ({ ...prev, [service]: newKey }))
    toast({
      title: "API Key Generated",
      description: `New ${service} API key generated`,
    })
  }

  const ApiKeyField = ({
    label,
    value,
    onChange,
    service,
    status = "connected"
  }: {
    label: string
    value: string
    onChange: (value: string) => void
    service: string
    status?: "connected" | "error" | "not-configured"
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={service}>{label}</Label>
        <div className="flex items-center gap-2">
          <Badge variant={status === "connected" ? "default" : status === "error" ? "destructive" : "secondary"}>
            {status === "connected" && <CheckCircle className="w-3 h-3 mr-1" />}
            {status === "error" && <AlertTriangle className="w-3 h-3 mr-1" />}
            {status}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => testConnection(service)}
            disabled={testingConnection === service}
            className="h-6 px-2"
          >
            {testingConnection === service ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <TestTube className="w-3 h-3 mr-1" />
            )}
            Test
          </Button>
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          id={service}
          type={showKeys[service] ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter your ${label} API key`}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => toggleKeyVisibility(service)}
          className="px-2"
        >
          {showKeys[service] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => copyApiKey(service)}
          className="px-2"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
              <p className="text-slate-600">Configure your RealtorsPal AI system</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={importSettings}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" onClick={exportSettings}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Settings</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all settings to their default values. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetToDefaults}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Tabs defaultValue="api-keys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="email-sms">Email & SMS</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="api-keys">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI & Language Models
                  </CardTitle>
                  <CardDescription>
                    Configure API keys for AI language models and processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ApiKeyField
                    label="OpenAI API Key"
                    value={apiKeys.openai}
                    onChange={(value) => setApiKeys(prev => ({ ...prev, openai: value }))}
                    service="openai"
                    status={connectionStatus.openai}
                  />
                  <div className="text-xs text-slate-600">
                    Used for AI agent conversations, lead qualification, and natural language processing.
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Communication Services
                  </CardTitle>
                  <CardDescription>
                    Configure SMS and calling service providers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ApiKeyField
                    label="Twilio Account SID"
                    value={apiKeys.twilio}
                    onChange={(value) => setApiKeys(prev => ({ ...prev, twilio: value }))}
                    service="twilio"
                    status={connectionStatus.twilio}
                  />
                  <ApiKeyField
                    label="Twilio Auth Token"
                    value={apiKeys.twilioAuthToken}
                    onChange={(value) => setApiKeys(prev => ({ ...prev, twilioAuthToken: value }))}
                    service="twilioAuthToken"
                    status={connectionStatus.twilioAuthToken}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="twilioPhoneNumber">My Twilio Phone Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="twilioPhoneNumber"
                        type="tel"
                        value={apiKeys.twilioPhoneNumber}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, twilioPhoneNumber: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConnection("twilioPhoneNumber")}
                        disabled={testingConnection === "twilioPhoneNumber"}
                        className="px-2"
                      >
                        {testingConnection === "twilioPhoneNumber" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600">
                    Complete Twilio configuration for SMS messaging, voice calls, and WhatsApp integration.
                  </div>

                  {/* Test All Twilio Configuration */}
                  <div className="pt-4 border-t border-slate-200">
                    <Button
                      variant="outline"
                      onClick={() => testConnection("twilio-complete")}
                      disabled={testingConnection === "twilio-complete"}
                      className="w-full"
                    >
                      {testingConnection === "twilio-complete" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testing Complete Twilio Setup...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4 mr-2" />
                          Test Complete Twilio Configuration
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Lead Generation
                  </CardTitle>
                  <CardDescription>
                    Social media and advertising platform access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ApiKeyField
                    label="Meta (Facebook) Access Token"
                    value={apiKeys.meta}
                    onChange={(value) => setApiKeys(prev => ({ ...prev, meta: value }))}
                    service="meta"
                    status={connectionStatus.meta}
                  />
                  <ApiKeyField
                    label="Google Ads API Key"
                    value={apiKeys.google}
                    onChange={(value) => setApiKeys(prev => ({ ...prev, google: value }))}
                    service="google"
                    status={connectionStatus.google}
                  />
                  <div className="text-xs text-slate-600">
                    For automated lead scraping and social media monitoring.
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Services
                  </CardTitle>
                  <CardDescription>
                    Email delivery and marketing platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ApiKeyField
                    label="SendGrid API Key"
                    value={apiKeys.sendgrid}
                    onChange={(value) => setApiKeys(prev => ({ ...prev, sendgrid: value }))}
                    service="sendgrid"
                    status={connectionStatus.sendgrid}
                  />
                  <ApiKeyField
                    label="Mailgun API Key"
                    value={apiKeys.mailgun}
                    onChange={(value) => setApiKeys(prev => ({ ...prev, mailgun: value }))}
                    service="mailgun"
                    status={connectionStatus.mailgun}
                  />
                  <div className="text-xs text-slate-600">
                    For transactional emails, marketing campaigns, and notifications.
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-6">
              <Button onClick={saveSettings} className="px-6">
                <Save className="w-4 h-4 mr-2" />
                Save API Keys
              </Button>
            </div>
          </TabsContent>

          {/* Email & SMS Tab */}
          <TabsContent value="email-sms">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                  <CardDescription>Configure email sending preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Provider</Label>
                    <Select value={emailSettings.provider} onValueChange={(value) => setEmailSettings(prev => ({ ...prev, provider: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="smtp">Custom SMTP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>From Name</Label>
                      <Input
                        value={emailSettings.fromName}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>From Email</Label>
                      <Input
                        value={emailSettings.fromEmail}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                      />
                    </div>
                  </div>

                  {emailSettings.provider === "smtp" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>SMTP Host</Label>
                        <Input
                          value={emailSettings.smtpHost}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SMTP Port</Label>
                        <Input
                          value={emailSettings.smtpPort}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => testConnection("email")}>
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Email
                    </Button>
                    <Button variant="outline" onClick={() => toast({
                      title: "Template Editor",
                      description: "Opening email template editor...",
                    })}>
                      <Mail className="w-4 h-4 mr-2" />
                      Edit Templates
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle>SMS Configuration</CardTitle>
                  <CardDescription>Configure SMS and messaging settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>SMS Provider</Label>
                    <Select value={smsSettings.provider} onValueChange={(value) => setSmsSettings(prev => ({ ...prev, provider: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="vonage">Vonage</SelectItem>
                        <SelectItem value="aws">AWS SNS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>From Phone Number</Label>
                    <Input
                      value={smsSettings.fromNumber}
                      onChange={(e) => setSmsSettings(prev => ({ ...prev, fromNumber: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      value={smsSettings.webhookUrl}
                      onChange={(e) => setSmsSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => testConnection("sms")}>
                      <TestTube className="w-4 h-4 mr-2" />
                      Test SMS
                    </Button>
                    <Button variant="outline" onClick={() => toast({
                      title: "SMS Templates",
                      description: "Opening SMS template editor...",
                    })}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      SMS Templates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-6">
              <Button onClick={saveSettings} className="px-6">
                <Save className="w-4 h-4 mr-2" />
                Save Communication Settings
              </Button>
            </div>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Webhook className="w-5 h-5" />
                      Webhook Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure webhooks for external integrations
                    </CardDescription>
                  </div>
                  <Button onClick={() => toast({
                    title: "Add Webhook",
                    description: "Opening webhook creation form...",
                  })}>
                    <Zap className="w-4 h-4 mr-2" />
                    Add Webhook
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <div key={webhook.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{webhook.name}</h3>
                          <p className="text-sm text-slate-600">{webhook.url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={webhook.status === "active" ? "default" : "secondary"}>
                            {webhook.status}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => testConnection(`webhook-${webhook.id}`)}>
                            <TestTube className="w-4 h-4 mr-1" />
                            Test
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Copy className="w-4 h-4 mr-1" />
                          Copy URL
                        </Button>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <p className="text-xs text-slate-600 mt-1">
                          {key === 'newLeads' && 'Get notified when new leads are generated'}
                          {key === 'agentAlerts' && 'Receive alerts about AI agent status changes'}
                          {key === 'appointments' && 'Notifications for scheduled appointments'}
                          {key === 'documents' && 'Alerts when documents are signed or need attention'}
                          {key === 'systemHealth' && 'System performance and health monitoring'}
                          {key === 'emailReports' && 'Daily and weekly performance reports'}
                        </p>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) =>
                          setNotifications(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => toast({
                    title: "Test Notification",
                    description: "Sending test notification to verify settings...",
                  })}>
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Notifications
                  </Button>
                  <Button variant="outline" onClick={() => toast({
                    title: "Notification History",
                    description: "Opening notification history and logs...",
                  })}>
                    <Bell className="w-4 h-4 mr-2" />
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-6">
              <Button onClick={saveSettings} className="px-6">
                <Save className="w-4 h-4 mr-2" />
                Save Notification Settings
              </Button>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Access Control</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                          <p className="text-xs text-slate-600">Secure your account with 2FA</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Session Timeout</Label>
                          <p className="text-xs text-slate-600">Auto-logout after inactivity</p>
                        </div>
                        <Select defaultValue="30">
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15m</SelectItem>
                            <SelectItem value="30">30m</SelectItem>
                            <SelectItem value="60">1h</SelectItem>
                            <SelectItem value="120">2h</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline">
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                      <Button variant="outline">
                        <Key className="w-4 h-4 mr-2" />
                        API Keys Audit
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Data Protection</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Data Encryption</Label>
                          <p className="text-xs text-slate-600">Encrypt sensitive data at rest</p>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-700">
                          <Lock className="w-3 h-3 mr-1" />
                          Enabled
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Backup Frequency</Label>
                          <p className="text-xs text-slate-600">Automated data backups</p>
                        </div>
                        <Select defaultValue="daily">
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </Button>
                      <Button variant="outline">
                        <Shield className="w-4 h-4 mr-2" />
                        Security Scan
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  User Preferences
                </CardTitle>
                <CardDescription>
                  Customize your RealtorsPal AI experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Interface</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Dark Mode</Label>
                          <p className="text-xs text-slate-600">Switch to dark theme</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select defaultValue="en">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Time Zone</Label>
                        <Select defaultValue="utc">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="utc">UTC</SelectItem>
                            <SelectItem value="est">Eastern Time</SelectItem>
                            <SelectItem value="pst">Pacific Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Dashboard</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Auto-refresh Data</Label>
                          <p className="text-xs text-slate-600">Automatically update dashboard</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="space-y-2">
                        <Label>Default Tab</Label>
                        <Select defaultValue="overview">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="overview">Dashboard</SelectItem>
                            <SelectItem value="leads">Leads</SelectItem>
                            <SelectItem value="agents">AI Agents</SelectItem>
                            <SelectItem value="analytics">Analytics</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => toast({
                    title: "Preferences Saved",
                    description: "Your interface preferences have been updated",
                  })}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                  <Button variant="outline" onClick={() => toast({
                    title: "Reset Preferences",
                    description: "Interface preferences reset to defaults",
                  })}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
