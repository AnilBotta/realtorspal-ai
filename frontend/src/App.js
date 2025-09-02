import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Analytics from "./pages/Analytics";
import DataPage from "./pages/Data";
import AgentConfig from "./pages/AgentConfig";
import Settings from "./pages/Settings";
import { login as apiLogin } from "./api";

function Login({ onLoggedIn }) {
  const [email, setEmail] = useState("demo@realtorspal.ai");
  const [password, setPassword] = useState("Demo123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await apiLogin(email, password);
      onLoggedIn(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border p-6 w-full max-w-md shadow-sm">
        <div className="text-emerald-600 font-semibold text-2xl mb-1 text-center">RealtorsPal AI</div>
        <div className="text-center text-slate-500 text-sm mb-6">Sign in to continue</div>
        <form onSubmit={submit} className="grid gap-3">
          <label className="text-sm text-slate-600">Email</label>
          <input className="px-3 py-2 rounded-lg border" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="demo@realtorspal.ai" />
          <label className="text-sm text-slate-600">Password</label>
          <input className="px-3 py-2 rounded-lg border" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Demo123!" />
          <button className="mt-2 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700" disabled={loading}>{loading?"Signing in...":"Sign In"}</button>
          {error && <div className="text-rose-600 text-sm">{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default function App(){
  const [session, setSession] = useState(null);

  if (!session) return <Login onLoggedIn={setSession} />;

  return (
    <BrowserRouter>
      <Layout user={session.user}>
        <Routes>
          <Route path="/" element={<Dashboard user={session.user} />} />
          <Route path="/leads" element={<Leads user={session.user} />} />
          <Route path="/agents" element={<div className="text-slate-600">Agents page coming soon</div>} />
          <Route path="/analytics" element={<Analytics user={session.user} />} />
          <Route path="/data" element={<DataPage user={session.user} />} />
          <Route path="/agent-config" element={<AgentConfig user={session.user} />} />
          <Route path="/settings" element={<Settings user={session.user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}