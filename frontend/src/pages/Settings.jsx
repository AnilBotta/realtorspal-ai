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
      <div className="bg-white rounded-xl border p-4">
        <div className="text-lg font-semibold">Settings</div>
        <div className="text-sm text-slate-500">Manage global configuration and provider keys</div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm text-slate-600">OpenAI API Key</label>
            <input className="w-full px-3 py-2 rounded-lg border" value={form.openai_api_key} onChange={(e)=>setForm({...form, openai_api_key:e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-slate-600">Anthropic API Key</label>
            <input className="w-full px-3 py-2 rounded-lg border" value={form.anthropic_api_key} onChange={(e)=>setForm({...form, anthropic_api_key:e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-slate-600">Gemini API Key</label>
            <input className="w-full px-3 py-2 rounded-lg border" value={form.gemini_api_key} onChange={(e)=>setForm({...form, gemini_api_key:e.target.value})} />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end">
          <button onClick={save} className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm">Save</button>
        </div>
      </div>
    </div>
  );
}