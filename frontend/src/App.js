import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
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
        console.log('Starting demo login...');
        console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL);
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Demo login timeout after 10 seconds')), 10000)
        );
        
        const loginPromise = demoLogin();
        const { data } = await Promise.race([loginPromise, timeoutPromise]);
        
        console.log('Demo login successful:', data);
        setSession(data);
      }catch(err){
        console.error('Demo login error:', err);
        const errorMsg = err?.response?.data?.detail || err?.message || "Failed to initialize demo session";
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