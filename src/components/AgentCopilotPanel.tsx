import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Archive, 
  Mail, 
  Trash2, 
  X, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import { AgentChatMessage, ParsedEmail, InboxHealthMetrics } from '../types';
import { agentApi } from '../services/agentApi';

interface AgentCopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  emails: ParsedEmail[];
  selectedEmail: ParsedEmail | null;
  userEmail?: string;
  onExecuteSearch: (query: string, naturalText?: string) => void;
  onRunTriage: () => void;
  isTriaging: boolean;
  onOpenComposeWithDraft: (draft: { to?: string; subject?: string; body?: string }) => void;
  urgentCount: number;
}

export const AgentCopilotPanel: React.FC<AgentCopilotPanelProps> = ({
  isOpen,
  onClose,
  emails,
  selectedEmail,
  userEmail,
  onExecuteSearch,
  onRunTriage,
  isTriaging,
  onOpenComposeWithDraft,
  urgentCount,
}) => {
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'agent',
      text: "Hello! I am your **Gmail Mail Agent**. I continuously monitor and organize your inbox, summarize threads, highlight urgent action items, and draft responses. How can I help you right now?",
      timestamp: new Date(),
      actionSuggestions: [
        { label: '⚡ Triage unread emails', actionType: 'triage', payload: {} },
        { label: '🧾 Find recent receipts & invoices', actionType: 'search', payload: { query: 'filename:pdf OR subject:(receipt OR invoice OR bill)' } },
        { label: '📰 Identify old newsletters to clean', actionType: 'clean', payload: { query: 'category:promotions older_than:7d' } },
      ]
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const unreadCount = emails.filter(e => e.isUnread).length;
  const newsletterCount = emails.filter(e => e.snippet?.toLowerCase().includes('unsubscribe') || e.bodyText?.toLowerCase().includes('unsubscribe')).length;

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputVal).trim();
    if (!messageText || isSending) return;

    const userMsg: AgentChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsSending(true);

    try {
      const recentSummary = emails.slice(0, 8).map(e => ({
        from: e.from.name || e.from.email,
        subject: e.subject,
        snippet: e.snippet,
        date: e.dateStr,
        isUnread: e.isUnread,
      }));

      const res = await agentApi.chatWithAgent({
        message: messageText,
        inboxContext: {
          userEmail,
          recentEmails: recentSummary,
          selectedEmail: selectedEmail ? {
            from: selectedEmail.from.raw,
            subject: selectedEmail.subject,
            bodyText: selectedEmail.bodyText.slice(0, 1500),
            date: selectedEmail.dateStr,
          } : undefined
        }
      });

      const agentMsg: AgentChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: res.reply,
        timestamp: new Date(),
        actionSuggestions: res.suggestions,
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (err: any) {
      console.error('Copilot message error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `agent-err-${Date.now()}`,
          sender: 'agent',
          text: "I encountered an issue processing your request. Please try again.",
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestionClick = (sugg: { label: string; actionType: string; payload: any }) => {
    if (sugg.actionType === 'triage') {
      onRunTriage();
    } else if (sugg.actionType === 'search' || sugg.actionType === 'clean') {
      onExecuteSearch(sugg.payload.query || sugg.label);
    } else if (sugg.actionType === 'draft') {
      onOpenComposeWithDraft(sugg.payload || {});
    }
  };

  return (
    <aside id="agent-copilot-panel" className="w-80 sm:w-96 bg-white border-l border-slate-200 h-[calc(100vh-4rem)] flex flex-col justify-between shrink-0 shadow-lg z-20 animate-fade-in">
      {/* Header */}
      <div className="h-14 px-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-600 rounded-lg shadow-2xs">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-tight">Agent Copilot</h3>
            <p className="text-[10px] text-slate-400">Autonomous Mail Intelligence</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inbox Health Bar */}
      <div className="p-3.5 bg-indigo-50/50 border-b border-indigo-100 shrink-0">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-indigo-950 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Inbox Health & Triage
          </span>
          <span className="text-[10px] font-semibold bg-indigo-200/60 text-indigo-900 px-2 py-0.5 rounded-full">
            {unreadCount === 0 ? 'Inbox Zero 🎉' : `${unreadCount} unread`}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white p-2 rounded-xl border border-indigo-100 shadow-2xs">
            <p className="text-[10px] text-slate-500 font-medium">Urgent</p>
            <p className="text-sm font-bold text-red-600">{urgentCount}</p>
          </div>
          <div className="bg-white p-2 rounded-xl border border-indigo-100 shadow-2xs">
            <p className="text-[10px] text-slate-500 font-medium">Unread</p>
            <p className="text-sm font-bold text-blue-600">{unreadCount}</p>
          </div>
          <div className="bg-white p-2 rounded-xl border border-indigo-100 shadow-2xs">
            <p className="text-[10px] text-slate-500 font-medium">Newsletters</p>
            <p className="text-sm font-bold text-slate-700">{newsletterCount}</p>
          </div>
        </div>

        <button
          onClick={onRunTriage}
          disabled={isTriaging}
          className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isTriaging ? 'animate-spin' : ''}`} />
          <span>{isTriaging ? 'Analyzing mailbox...' : 'Run Autonomous Inbox Triage'}</span>
        </button>
      </div>

      {/* Chat Messages Log */}
      <div id="copilot-messages-area" className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>

            {/* Suggestions Chips from Agent */}
            {msg.actionSuggestions && msg.actionSuggestions.length > 0 && (
              <div className="mt-2 space-y-1.5 w-full">
                {msg.actionSuggestions.map((sugg, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(sugg)}
                    className="w-full text-left px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-medium transition-colors flex items-center justify-between shadow-2xs cursor-pointer group"
                  >
                    <span className="truncate">{sugg.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {isSending && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Agent is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 border-t border-slate-200 bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="copilot-chat-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask agent about your emails..."
            disabled={isSending}
            className="flex-1 text-xs px-3.5 py-2.5 bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800"
          />
          <button
            id="copilot-chat-send-btn"
            type="submit"
            disabled={isSending || !inputVal.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
};
