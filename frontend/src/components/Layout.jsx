import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { CircleCheck, Bell, User2, Menu, X } from "lucide-react";
import GlobalSearch from "./GlobalSearch";
import SavedFilterTemplatesDropdown from "./SavedFilterTemplatesDropdown";
import ThemeToggle from "./ThemeToggle";

export default function Layout({ children, user, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);
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
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 border-b bg-white dark:bg-gray-800 dark:border-gray-700 relative" ref={mobileMenuRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Left side - Logo and Live Data */}
          <div className="flex items-center gap-3">
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg sm:text-xl">RealtorsPal AI</div>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-600/30">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              Live Data
            </span>
          </div>

          {/* Right side - Actions and User */}
          <div className="flex items-center gap-2">
            {/* Desktop Navigation Items */}
            <div className="hidden md:flex items-center gap-2">
              <GlobalSearch user={user} />
              <SavedFilterTemplatesDropdown onApplyFilter={(filters) => {
                console.log('Apply filters from header:', filters);
                // Dispatch event for pages to listen to
                window.dispatchEvent(new CustomEvent('applyGlobalFilters', { 
                  detail: { filters } 
                }));
              }} />
              <button className="px-3 py-1.5 rounded-md border bg-white dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 text-sm flex items-center gap-1 transition-colors">
                <Bell size={16}/> 
                <span className="hidden lg:inline">Alerts</span>
              </button>
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => {
                console.log('Mobile menu button clicked, current state:', isMobileMenuOpen);
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-300 dark:border-gray-600">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-slate-600 dark:text-gray-300">
                <User2 size={16} className="sm:w-5 sm:h-5"/>
              </div>
              <div className="hidden sm:block text-sm text-slate-700 dark:text-gray-300">{user?.email || "Admin"}</div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden absolute left-0 right-0 top-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'block opacity-100 translate-y-0' : 'hidden opacity-0 -translate-y-2'
        }`}>
          <div className="px-4 py-3 space-y-3 max-w-7xl mx-auto">
            <div className="w-full">
              <GlobalSearch user={user} />
            </div>
            <div className="w-full">
              <SavedFilterTemplatesDropdown onApplyFilter={(filters) => {
                console.log('Apply filters from header:', filters);
                window.dispatchEvent(new CustomEvent('applyGlobalFilters', { 
                  detail: { filters } 
                }));
                setIsMobileMenuOpen(false);
              }} />
            </div>
            <div className="flex items-center justify-between pt-2">
              <button className="px-3 py-1.5 rounded-md border bg-white dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 text-sm flex items-center gap-1 transition-colors">
                <Bell size={16}/> Alerts
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
            {tabs.map(t => (
              <NavLink 
                key={t.to} 
                to={t.to} 
                end 
                className={({isActive}) => 
                  `px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm whitespace-nowrap ${
                    isActive 
                      ? `${t.color} shadow-md transform scale-105` 
                      : 'bg-white dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-600 border border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </div>

      {/* Footer */}
      <div className="py-4 sm:py-6 text-center text-xs text-slate-400 dark:text-gray-500">
        Built for real estate teams • <CircleCheck className="inline -mt-1" size={14}/> Stable MVP
      </div>
    </div>
  );
}