import React, { useEffect, useState } from "react";
import { getSettings, saveSettings } from "../api";

export default function Settings({ user }){
  const [form, setForm] = useState({ openai_api_key: "", anthropic_api_key: "", gemini_api_key: "" });

  useEffect(() => {
    async function load(){
      const { data } = await getSettings(user.id);
      setForm({
        openai_api_key: data.openai_api_key || "",
        anthropic_api_key: data.anthropic_api_key || "",
        gemini_api_key: data.gemini_api_key || "",
      });
    }
    load();
  }, [user.id]);

  const save = async () => {
    await saveSettings({ user_id: user.id, ...form });
    alert("Settings saved");
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