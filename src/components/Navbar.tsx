import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Plus, 
  Bot, 
  LogOut, 
  Mail, 
  RotateCw, 
  SlidersHorizontal,
  ChevronDown,
  X
} from 'lucide-react';
interface GoogleUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

interface NavbarProps {
  user: GoogleUser | null;
  userEmail?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExecuteSearch: (query: string, naturalText?: string) => void;
  onClearSearch: () => void;
  onOpenCompose: () => void;
  onToggleCopilot: () => void;
  isCopilotOpen: boolean;
  onRunTriage: () => void;
  isTriaging: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  onSignOut: () => void;
  urgentCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  userEmail,
  searchQuery,
  onSearchChange,
  onExecuteSearch,
  onClearSearch,
  onOpenCompose,
  onToggleCopilot,
  isCopilotOpen,
  onRunTriage,
  isTriaging,
  onRefresh,
  isRefreshing,
  onSignOut,
  urgentCount,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isTranslatingSearch, setIsTranslatingSearch] = useState(false);
  const [appliedExplanation, setAppliedExplanation] = useState<string | null>(null);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if query looks like natural language (contains words like "from", "unread", "last", "with", etc.)
    const isNatural = /\b(show|find|unread|urgent|receipt|newsletter|from|last|yesterday|attachment|pdf|starred)\b/i.test(searchQuery);

    if (isNatural && !searchQuery.includes(':')) {
      setIsTranslatingSearch(true);
      try {
        const res = await fetch('/api/agent/natural-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ naturalQuery: searchQuery }),
        });
        const data = await res.json();
        if (data.gmailQuery) {
          setAppliedExplanation(data.explanation || null);
          onExecuteSearch(data.gmailQuery, searchQuery);
          return;
        }
      } catch (err) {
        console.error('Natural search error:', err);
      } finally {
        setIsTranslatingSearch(false);
      }
    }

    onExecuteSearch(searchQuery);
  };

  return (
    <header id="main-navbar" className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-4 z-30 shrink-0 sticky top-0">
      {/* Left: Brand & Refresh */}
      <div className="flex items-center gap-3 min-w-56">
        <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight text-sm">MyGmailAgent</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-2.5 h-2.5" /> AI
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-44">
            {userEmail || user?.email || 'Connected'}
          </p>
        </div>

        <button
          id="navbar-refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Mailbox"
          className="ml-1 p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Center: AI Smart Search Bar */}
      <div className="flex-1 max-w-2xl relative">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <div className="absolute left-3.5 text-slate-400 flex items-center gap-1 pointer-events-none">
            {isTranslatingSearch ? (
              <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            id="navbar-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search mail or ask AI (e.g. 'unread receipts from last week', 'has:attachment')..."
            className="w-full pl-10 pr-24 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          />

          <div className="absolute right-2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onClearSearch();
                  setAppliedExplanation(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Search</span>
            </button>
          </div>
        </form>

        {appliedExplanation && (
          <div className="absolute top-11 left-0 right-0 bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center justify-between z-20 animate-fade-in">
            <span className="truncate"><strong>AI Filter:</strong> {appliedExplanation}</span>
            <button 
              onClick={() => setAppliedExplanation(null)}
              className="text-blue-500 hover:text-blue-700 ml-2"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-2.5">
        {/* Compose Button */}
        <button
          id="navbar-compose-btn"
          onClick={onOpenCompose}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Compose</span>
        </button>

        {/* AI Triage Button */}
        <button
          id="navbar-triage-btn"
          onClick={onRunTriage}
          disabled={isTriaging}
          title="Run Autonomous AI Inbox Triage"
          className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-medium rounded-xl transition-all cursor-pointer disabled:opacity-60"
        >
          <Sparkles className={`w-3.5 h-3.5 text-purple-600 ${isTriaging ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{isTriaging ? 'Triaging...' : 'AI Triage'}</span>
          {urgentCount > 0 && (
            <span className="px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-bold rounded-full">
              {urgentCount}
            </span>
          )}
        </button>

        {/* Agent Copilot Drawer Toggle */}
        <button
          id="navbar-copilot-toggle-btn"
          onClick={onToggleCopilot}
          className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
            isCopilotOpen 
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
          title="Toggle AI Mail Agent Chat & Insights"
        >
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="hidden lg:inline">Agent Copilot</span>
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            id="navbar-user-menu-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          >
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User'} 
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-slate-200" 
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center">
                {(userEmail || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showProfileMenu && (
            <div 
              id="navbar-profile-dropdown"
              className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-fade-in"
            >
              <div className="px-3 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user?.displayName || 'Gmail User'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {userEmail || user?.email}
                </p>
              </div>

              <div className="p-1 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
