import React, { useEffect, useState } from "react";
import { getSettings, saveSettings } from "../api";
import { Copy, Check, Globe, Share2, Zap, Bot, Activity, CheckCircle, AlertCircle, Clock, Code, Key, Database } from "lucide-react";

export default function Settings({ user }){
  const [form, setForm] = useState({ 
    openai_api_key: "", 
    anthropic_api_key: "", 
    gemini_api_key: "",
    webhook_enabled: false,
    facebook_webhook_verify_token: "",
    generic_webhook_enabled: false,
    api_key: ""
  });
  const [copiedWebhook, setCopiedWebhook] = useState(null);
  const [webhookStats, setWebhookStats] = useState({
    generic: { total: 0, last_24h: 0, last_activity: null, status: 'inactive' },
    facebook: { total: 0, last_24h: 0, last_activity: null, status: 'inactive' }
  });

  // Generate webhook URLs
  const baseUrl = process.env.REACT_APP_BACKEND_URL || 'https://realtor-lead-hub.preview.emergentagent.com';
  const facebookWebhookUrl = `${baseUrl}/api/webhooks/facebook-leads/${user?.id}`;
  const genericWebhookUrl = `${baseUrl}/api/webhooks/generic-leads/${user?.id}`;

  useEffect(() => {
    loadSettings();
    loadWebhookStats();
    
    // Poll webhook stats every 30 seconds
    const interval = setInterval(loadWebhookStats, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  const loadSettings = async () => {
    try {
      const { data } = await getSettings(user.id);
      setForm({
        openai_api_key: data.openai_api_key || "",
        anthropic_api_key: data.anthropic_api_key || "",
        gemini_api_key: data.gemini_api_key || "",
        webhook_enabled: data.webhook_enabled || false,
        facebook_webhook_verify_token: data.facebook_webhook_verify_token || generateVerifyToken(),
        generic_webhook_enabled: data.generic_webhook_enabled || false,
        api_key: data.api_key || generateApiKey(),
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const loadWebhookStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/webhooks/stats/${user.id}`);
      if (response.ok) {
        const stats = await response.json();
        setWebhookStats(stats);
      }
    } catch (err) {
      console.error('Failed to load webhook stats:', err);
    }
  };

  const generateVerifyToken = () => {
    return 'verify_' + Math.random().toString(36).substring(2) + '_' + Date.now();
  };

  const generateApiKey = () => {
    return 'crm_' + Math.random().toString(36).substring(2, 18) + '_' + Math.random().toString(36).substring(2, 18);
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWebhook(type);
      setTimeout(() => setCopiedWebhook(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const save = async () => {
    await saveSettings({ user_id: user.id, ...form });
    alert("Settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      {/* AI API Keys Section */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="text-emerald-600" size={20} />
          <div className="text-lg font-semibold">AI Configuration</div>
        </div>
        <div className="text-sm text-slate-500 mb-4">Configure AI provider API keys for intelligent lead processing</div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-600 font-medium">OpenAI API Key</label>
            <input 
              type="password"
              className="w-full px-3 py-2 rounded-lg border mt-1" 
              placeholder="sk-..." 
              value={form.openai_api_key} 
              onChange={(e)=>setForm({...form, openai_api_key:e.target.value})} 
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium">Anthropic API Key</label>
            <input 
              type="password"
              className="w-full px-3 py-2 rounded-lg border mt-1" 
              placeholder="sk-ant-..." 
              value={form.anthropic_api_key} 
              onChange={(e)=>setForm({...form, anthropic_api_key:e.target.value})} 
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium">Gemini API Key</label>
            <input 
              type="password"
              className="w-full px-3 py-2 rounded-lg border mt-1" 
              placeholder="AI..." 
              value={form.gemini_api_key} 
              onChange={(e)=>setForm({...form, gemini_api_key:e.target.value})} 
            />
          </div>
        </div>
      </div>

      {/* Lead Generation Webhooks Section */}  
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Share2 className="text-blue-600" size={20} />
          <div className="text-lg font-semibold">Lead Generation Webhooks</div>
        </div>
        <div className="text-sm text-slate-500 mb-6">Automatically collect leads from social media platforms and other sources</div>

        {/* Facebook/Instagram Lead Ads Webhook */}
        <div className="border rounded-lg p-4 mb-4 bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Share2 className="text-white" size={16} />
              </div>
              <div>
                <div className="font-medium text-blue-900">Facebook & Instagram Lead Ads</div>
                <div className="text-sm text-blue-700">Real-time lead collection from Meta platforms</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.webhook_enabled}
                onChange={(e) => setForm({...form, webhook_enabled: e.target.checked})}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {form.webhook_enabled && (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-600 font-medium">Webhook URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="text" 
                    readOnly 
                    value={facebookWebhookUrl}
                    className="flex-1 px-3 py-2 rounded-lg border bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(facebookWebhookUrl, 'facebook')}
                    className="px-3 py-2 rounded-lg border hover:bg-gray-50 flex items-center gap-1"
                  >
                    {copiedWebhook === 'facebook' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600 font-medium">Verify Token</label>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="text" 
                    value={form.facebook_webhook_verify_token}
                    onChange={(e) => setForm({...form, facebook_webhook_verify_token: e.target.value})}
                    className="flex-1 px-3 py-2 rounded-lg border text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(form.facebook_webhook_verify_token, 'token')}
                    className="px-3 py-2 rounded-lg border hover:bg-gray-50 flex items-center gap-1"
                  >
                    {copiedWebhook === 'token' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="text-xs text-blue-600 mt-1">Use this token in Facebook App webhook configuration</div>
              </div>

              {/* Facebook Webhook Activity Status */}
              <div className="bg-white border rounded-lg p-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Webhook Activity</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {webhookStats.facebook.status === 'active' ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <AlertCircle size={16} className="text-gray-400" />
                    )}
                    <span className={`text-xs font-medium ${
                      webhookStats.facebook.status === 'active' ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {webhookStats.facebook.status === 'active' ? 'Receiving Data' : 'No Recent Activity'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <div className="text-lg font-semibold text-blue-900">{webhookStats.facebook.total}</div>
                    <div className="text-xs text-blue-700">Total Leads</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <div className="text-lg font-semibold text-green-700">{webhookStats.facebook.last_24h}</div>
                    <div className="text-xs text-green-600">Last 24h</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2">
                    <div className="text-lg font-semibold text-emerald-700">
                      {webhookStats.facebook.status === 'active' ? '✓' : '—'}
                    </div>
                    <div className="text-xs text-emerald-600">Status</div>
                  </div>
                </div>

                {webhookStats.facebook.last_activity && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-blue-500">
                    <Clock size={12} />
                    <span>Last activity: {new Date(webhookStats.facebook.last_activity).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Generic Webhook */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                <Globe className="text-white" size={16} />
              </div>
              <div>
                <div className="font-medium text-gray-900">Generic Webhook</div>
                <div className="text-sm text-gray-700">For Zapier, Make.com, or other platforms</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.generic_webhook_enabled}
                onChange={(e) => setForm({...form, generic_webhook_enabled: e.target.checked})}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
            </label>
          </div>

          {form.generic_webhook_enabled && (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-600 font-medium">Webhook URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="text" 
                    readOnly 
                    value={genericWebhookUrl}
                    className="flex-1 px-3 py-2 rounded-lg border bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(genericWebhookUrl, 'generic')}
                    className="px-3 py-2 rounded-lg border hover:bg-gray-50 flex items-center gap-1"
                  >
                    {copiedWebhook === 'generic' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="text-xs text-gray-600 mt-1">Use this endpoint for third-party integrations</div>
              </div>

              {/* Webhook Activity Status */}
              <div className="bg-white border rounded-lg p-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Webhook Activity</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {webhookStats.generic.status === 'active' ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <AlertCircle size={16} className="text-gray-400" />
                    )}
                    <span className={`text-xs font-medium ${
                      webhookStats.generic.status === 'active' ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {webhookStats.generic.status === 'active' ? 'Receiving Data' : 'No Recent Activity'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-lg font-semibold text-gray-900">{webhookStats.generic.total}</div>
                    <div className="text-xs text-gray-600">Total Leads</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <div className="text-lg font-semibold text-blue-700">{webhookStats.generic.last_24h}</div>
                    <div className="text-xs text-blue-600">Last 24h</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <div className="text-lg font-semibold text-green-700">
                      {webhookStats.generic.status === 'active' ? '✓' : '—'}
                    </div>
                    <div className="text-xs text-green-600">Status</div>
                  </div>
                </div>

                {webhookStats.generic.last_activity && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>Last activity: {new Date(webhookStats.generic.last_activity).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Agent Integration Info */}
        <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="text-emerald-600" size={16} />
            <div className="text-sm font-medium text-emerald-900">AI Agent Integration</div>
          </div>
          <div className="text-xs text-emerald-700">
            Webhook leads are automatically processed by AI agents for qualification, response generation, and lead scoring.
          </div>
        </div>
      </div>

      {/* Crew.AI API Integration Section */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Database className="text-purple-600" size={20} />
          <div className="text-lg font-semibold">Crew.AI API Integration</div>
        </div>
        <div className="text-sm text-slate-500 mb-6">External API endpoints for Crew.AI agents to manage leads programmatically</div>

        {/* API Key Section */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Key className="text-purple-600" size={16} />
            <div className="font-medium text-purple-900">API Authentication</div>
          </div>
          <div className="mb-3">
            <label className="text-sm text-slate-600 font-medium">Your API Key</label>
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="password" 
                value={form.api_key}
                onChange={(e) => setForm({...form, api_key: e.target.value})}
                className="flex-1 px-3 py-2 rounded-lg border bg-white text-sm font-mono"
                placeholder="crm_xxxxxxxxxxxxxxxx_xxxxxxxxxxxxxxxx"
              />
              <button
                onClick={() => copyToClipboard(form.api_key, 'api_key')}
                className="px-3 py-2 rounded-lg border hover:bg-gray-50 flex items-center gap-1"
              >
                {copiedWebhook === 'api_key' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
              <button
                onClick={() => setForm({...form, api_key: generateApiKey()})}
                className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm"
              >
                Regenerate
              </button>
            </div>
            <div className="text-xs text-purple-600 mt-1">Use this key in the X-API-Key header for all API requests</div>
          </div>
        </div>

        {/* API Documentation */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Code className="text-slate-600" size={16} />
            <div className="font-medium text-slate-900">API Endpoints</div>
          </div>

          {/* Base URL */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-sm font-medium text-slate-700 mb-1">Base URL:</div>
            <div className="font-mono text-sm text-slate-900">{baseUrl}</div>
          </div>

          {/* Create Lead API */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-slate-900">1. Create Lead</div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-mono">POST</span>
            </div>
            <div className="text-sm text-slate-600 mb-2">Create a new lead in your CRM</div>
            <div className="bg-slate-900 text-green-400 rounded p-3 text-sm font-mono mb-2">
              POST {baseUrl}/api/external/leads
            </div>
            <div className="text-xs text-slate-600 mb-2">Headers: X-API-Key: your_api_key</div>
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-600 hover:text-slate-900">JSON Payload Example</summary>
              <pre className="bg-slate-100 p-2 mt-2 rounded text-xs overflow-x-auto">{`{
  "first_name": "John",
  "last_name": "Doe", 
  "email": "john.doe@example.com",
  "phone": "1234567890",
  "property_type": "Single Family",
  "neighborhood": "Downtown",
  "price_min": 300000,
  "price_max": 500000,
  "priority": "high",
  "source_tags": ["Crew.AI", "Website"],
  "notes": "Interested in modern homes",
  "stage": "New",
  "in_dashboard": true
}`}</pre>
            </details>
          </div>

          {/* Update Lead API */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-slate-900">2. Update Lead</div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-mono">PUT</span>
            </div>
            <div className="text-sm text-slate-600 mb-2">Update an existing lead record</div>
            <div className="bg-slate-900 text-green-400 rounded p-3 text-sm font-mono mb-2">
              PUT {baseUrl}/api/external/leads/{"{lead_id}"}
            </div>
            <div className="text-xs text-slate-600 mb-2">Headers: X-API-Key: your_api_key</div>
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-600 hover:text-slate-900">JSON Payload Example</summary>
              <pre className="bg-slate-100 p-2 mt-2 rounded text-xs overflow-x-auto">{`{
  "email": "updated.email@example.com",
  "phone": "9876543210", 
  "priority": "medium",
  "notes": "Updated contact information"
}`}</pre>
            </details>
          </div>

          {/* Search Leads API */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-slate-900">3. Search Leads</div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-mono">POST</span>
            </div>
            <div className="text-sm text-slate-600 mb-2">Search for leads to check duplicates</div>
            <div className="bg-slate-900 text-green-400 rounded p-3 text-sm font-mono mb-2">
              POST {baseUrl}/api/external/leads/search
            </div>
            <div className="text-xs text-slate-600 mb-2">Headers: X-API-Key: your_api_key</div>
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-600 hover:text-slate-900">JSON Payload Example</summary>
              <pre className="bg-slate-100 p-2 mt-2 rounded text-xs overflow-x-auto">{`{
  "email": "john.doe@example.com",
  "phone": "1234567890",
  "name": "John",
  "stage": "New",
  "limit": 10
}`}</pre>
            </details>
          </div>

          {/* Update Lead Status API */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-slate-900">4. Update Lead Status</div>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-mono">PUT</span>
            </div>
            <div className="text-sm text-slate-600 mb-2">Track lead progress through pipeline</div>
            <div className="bg-slate-900 text-green-400 rounded p-3 text-sm font-mono mb-2">
              PUT {baseUrl}/api/external/leads/{"{lead_id}"}/status
            </div>
            <div className="text-xs text-slate-600 mb-2">Headers: X-API-Key: your_api_key</div>
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-600 hover:text-slate-900">JSON Payload Example</summary>
              <pre className="bg-slate-100 p-2 mt-2 rounded text-xs overflow-x-auto">{`{
  "stage": "Contacted",
  "notes": "Called client, interested in viewing properties"
}`}</pre>
            </details>
          </div>

          {/* Get Lead API */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-slate-900">5. Get Lead</div>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded font-mono">GET</span>
            </div>
            <div className="text-sm text-slate-600 mb-2">Retrieve a specific lead by ID</div>
            <div className="bg-slate-900 text-green-400 rounded p-3 text-sm font-mono mb-2">
              GET {baseUrl}/api/external/leads/{"{lead_id}"}
            </div>
            <div className="text-xs text-slate-600">Headers: X-API-Key: your_api_key</div>
          </div>
        </div>

        {/* Available Stages */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-2">Available Lead Stages:</div>
          <div className="flex flex-wrap gap-2">
            {["New", "Contacted", "Appointment", "Onboarded", "Closed"].map(stage => (
              <span key={stage} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{stage}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end">
        <button onClick={save} className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium">
          Save Settings
        </button>
      </div>
    </div>
  );
}