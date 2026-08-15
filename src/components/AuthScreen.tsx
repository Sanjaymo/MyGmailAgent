import React from 'react';
import { Mail, Sparkles, Shield, Inbox, CheckCircle, Zap } from 'lucide-react';

interface AuthScreenProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSignIn, isLoading, error }) => {
  return (
    <div id="auth-screen-container" className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div id="auth-card" className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

        {/* Header Icon */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 mb-6 text-white">
          <Mail className="w-10 h-10" />
          <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 p-1.5 rounded-full border-2 border-white">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <h1 id="auth-heading" className="text-2xl font-bold tracking-tight text-slate-900">
          MyGmailAgent
        </h1>
        <p id="auth-subheading" className="mt-2 text-sm text-slate-600 leading-relaxed">
          Your autonomous AI email copilot. Triage inboxes in seconds, synthesize threads, craft smart replies, and achieve Inbox Zero effortlessly.
        </p>

        {error && (
          <div id="auth-error-box" className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-left">
            {error}
          </div>
        )}

        {/* Value Highlights */}
        <div className="mt-6 text-left space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span><strong>Instant AI Inbox Triage</strong> with urgency scoring</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
            <span><strong>Executive Summaries</strong> with action item checklists</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Inbox className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>Tone-Adaptive Smart Replies</strong> & 1-click answers</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
            <span><strong>Secure Workspace Access</strong> with user confirmations</span>
          </div>
        </div>

        {/* Google Sign-in Button */}
        <div className="mt-8">
          <button
            id="gsi-sign-in-button"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-300 shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Connecting to Google Workspace...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="text-sm font-semibold group-hover:text-slate-900">Sign in with Google</span>
              </>
            )}
          </button>
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          Uses Google Workspace OAuth to safely read, organize, draft, and send emails with your explicit permission.
        </p>
      </div>
    </div>
  );
};
