import React, { useEffect, useState } from "react";
import { getSettings, saveSettings } from "../api";
import { Copy, Check, Globe, Share2, Zap, Bot } from "lucide-react";

export default function Settings({ user }){
  const [form, setForm] = useState({ 
    openai_api_key: "", 
    anthropic_api_key: "", 
    gemini_api_key: "",
    webhook_enabled: false,
    facebook_webhook_verify_token: "",
    generic_webhook_enabled: false 
  });
  const [copiedWebhook, setCopiedWebhook] = useState(null);

  // Generate webhook URLs
  const baseUrl = process.env.REACT_APP_BACKEND_URL || 'https://realtor-lead-hub.preview.emergentagent.com';
  const facebookWebhookUrl = `${baseUrl}/api/webhooks/facebook-leads/${user?.id}`;
  const genericWebhookUrl = `${baseUrl}/api/webhooks/generic-leads/${user?.id}`;

  useEffect(() => {
    async function load(){
      const { data } = await getSettings(user.id);
      setForm({
        openai_api_key: data.openai_api_key || "",
        anthropic_api_key: data.anthropic_api_key || "",
        gemini_api_key: data.gemini_api_key || "",
        webhook_enabled: data.webhook_enabled || false,
        facebook_webhook_verify_token: data.facebook_webhook_verify_token || generateVerifyToken(),
        generic_webhook_enabled: data.generic_webhook_enabled || false,
      });
    }
    load();
  }, [user.id]);

  const generateVerifyToken = () => {
    return 'verify_' + Math.random().toString(36).substring(2) + '_' + Date.now();
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

      {/* Save Button */}
      <div className="flex items-center justify-end">
        <button onClick={save} className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium">
          Save Settings
        </button>
      </div>
    </div>
  );
}