import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import PartialLeads from "./pages/PartialLeads";
import Analytics from "./pages/Analytics";
import DataPage from "./pages/Data";
import AIAgents from "./pages/AIAgents";
import AgentConfig from "./pages/AgentConfig";
import Settings from "./pages/Settings";
import { demoLogin } from "./api";
import { ThemeProvider } from "./contexts/ThemeContext";

export default function App(){
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function bootstrap(){
      try{
        // 1) If marketing handed us tokens via the URL fragment, adopt them.
        if (typeof window !== "undefined" && window.location.hash && window.location.hash.length > 1) {
          const params = new URLSearchParams(window.location.hash.slice(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");
          const userRaw = params.get("user");
          if (accessToken && refreshToken && userRaw) {
            try {
              const user = JSON.parse(decodeURIComponent(userRaw));
              localStorage.setItem("access_token", accessToken);
              localStorage.setItem("refresh_token", refreshToken);
              localStorage.setItem("user", JSON.stringify(user));
              // Strip the fragment so tokens don't linger in the address bar / history.
              window.history.replaceState(null, "", window.location.pathname + window.location.search);
            } catch (e) {
              console.warn("Failed to parse user from fragment:", e);
            }
          }
        }

        // 2) If we already have a valid session in localStorage, use it — no demo login.
        const storedToken = localStorage.getItem("access_token");
        const storedUser = localStorage.getItem("user");
        if (storedToken && storedUser) {
          setSession({
            access_token: storedToken,
            refresh_token: localStorage.getItem("refresh_token"),
            user: JSON.parse(storedUser),
          });
          return;
        }

        // 3) Fallback: demo login (unauthenticated visitors).
        console.log('Starting demo login...');
        console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Demo login timeout after 10 seconds')), 10000)
        );
        const { data } = await Promise.race([demoLogin(), timeoutPromise]);
        if (data?.access_token) {
          localStorage.setItem("access_token", data.access_token);
          if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
          if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        }
        setSession(data);
      }catch(err){
        console.error('Bootstrap error:', err);
        const errorMsg = err?.response?.data?.detail || err?.message || "Failed to initialize session";
        setError(errorMsg);
      }finally{
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-emerald-600 text-lg font-medium">Loading workspace...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border p-6 w-full max-w-lg shadow-sm text-center">
        <div className="text-emerald-600 font-semibold text-2xl mb-2">RealtorsPal AI</div>
        <div className="text-slate-600 mb-4">{error}</div>
        <div className="text-slate-500 text-sm">Please refresh the page to retry.</div>
      </div>
    </div>
  );

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout user={session.user}>
          <Routes>
            <Route path="/" element={<Dashboard user={session.user} />} />
            <Route path="/leads" element={<Leads user={session.user} />} />
            <Route path="/partial-leads" element={<PartialLeads user={session.user} />} />
            <Route path="/agents" element={<AIAgents user={session.user} />} />
            <Route path="/analytics" element={<Analytics user={session.user} />} />
            <Route path="/data" element={<DataPage user={session.user} />} />
            <Route path="/agent-config" element={<AgentConfig user={session.user} />} />
            <Route path="/settings" element={<Settings user={session.user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}