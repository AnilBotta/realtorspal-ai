import React from "react";
import { NavLink } from "react-router-dom";
import { CircleCheck, Bell, User2 } from "lucide-react";
import GlobalSearch from "./GlobalSearch";
import FilterTemplates from "./FilterTemplates";

export default function Layout({ children, user, onLogout }) {
  const tabs = [
    { to: "/", label: "Dashboard", color: "bg-blue-500 hover:bg-blue-600 text-white" },
    { to: "/leads", label: "Leads", color: "bg-green-500 hover:bg-green-600 text-white" },
    { to: "/agents", label: "AI Agents", color: "bg-purple-500 hover:bg-purple-600 text-white" },
    { to: "/analytics", label: "Analytics", color: "bg-orange-500 hover:bg-orange-600 text-white" },
    { to: "/data", label: "Data", color: "bg-teal-500 hover:bg-teal-600 text-white" },
    { to: "/agent-config", label: "Agent Config", color: "bg-indigo-500 hover:bg-indigo-600 text-white" },
    { to: "/settings", label: "Settings", color: "bg-gray-500 hover:bg-gray-600 text-white" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-emerald-600 font-semibold text-xl">RealtorsPal AI</div>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              Live Data
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-md border bg-white text-slate-600 hover:bg-slate-50 text-sm flex items-center gap-1"><Search size={16}/> Search</button>
              <button className="px-3 py-1.5 rounded-md border bg-white text-slate-600 hover:bg-slate-50 text-sm flex items-center gap-1"><Filter size={16}/> Filters</button>
              <button className="px-3 py-1.5 rounded-md border bg-white text-slate-600 hover:bg-slate-50 text-sm flex items-center gap-1"><Bell size={16}/> Alerts</button>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><User2 size={18}/></div>
              <div className="text-sm text-slate-700">{user?.email || "Admin"}</div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-3 overflow-x-auto">
            {tabs.map(t => (
              <NavLink 
                key={t.to} 
                to={t.to} 
                end 
                className={({isActive}) => 
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm whitespace-nowrap ${
                    isActive 
                      ? `${t.color} shadow-md transform scale-105` 
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-xs text-slate-400">Built for real estate teams • <CircleCheck className="inline -mt-1" size={14}/> Stable MVP</div>
    </div>
  );
}