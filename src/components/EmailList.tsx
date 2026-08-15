import React from 'react';
import { 
  Star, 
  Paperclip, 
  Archive, 
  Trash2, 
  Mail, 
  MailOpen, 
  Sparkles, 
  Zap, 
  CheckSquare, 
  Square,
  AlertCircle,
  Tag,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ParsedEmail, EmailTriageInfo } from '../types';

interface EmailListProps {
  emails: ParsedEmail[];
  selectedEmailId: string | null;
  onSelectEmail: (email: ParsedEmail) => void;
  selectedIds: string[];
  onToggleSelectId: (id: string, e: React.MouseEvent) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onToggleStar: (email: ParsedEmail, e: React.MouseEvent) => void;
  onArchiveSelected: () => void;
  onTrashSelected: () => void;
  onMarkReadSelected: (unread: boolean) => void;
  onTriageSelected: () => void;
  triageMap: Map<string, EmailTriageInfo>;
  isLoading: boolean;
  filterMode: 'all' | 'unread' | 'starred' | 'needs_reply';
  onFilterModeChange: (mode: 'all' | 'unread' | 'starred' | 'needs_reply') => void;
  title: string;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  selectedIds,
  onToggleSelectId,
  onSelectAll,
  onClearSelection,
  onToggleStar,
  onArchiveSelected,
  onTrashSelected,
  onMarkReadSelected,
  onTriageSelected,
  triageMap,
  isLoading,
  filterMode,
  onFilterModeChange,
  title,
}) => {
  const allSelected = emails.length > 0 && selectedIds.length === emails.length;
  const isAnySelected = selectedIds.length > 0;

  // Filter emails based on filterMode
  const filteredEmails = emails.filter(email => {
    if (filterMode === 'unread') return email.isUnread;
    if (filterMode === 'starred') return email.isStarred;
    if (filterMode === 'needs_reply') {
      const triage = triageMap.get(email.id);
      return triage?.needsReply || (email.isUnread && !email.isSent);
    }
    return true;
  });

  const getUrgencyBadge = (emailId: string) => {
    const triage = triageMap.get(emailId);
    if (!triage) return null;

    if (triage.urgencyScore >= 8) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 shrink-0">
          <Zap className="w-2.5 h-2.5 fill-red-600 text-red-600" />
          Urgent {triage.urgencyScore}/10
        </span>
      );
    } else if (triage.urgencyScore >= 6 || triage.needsReply) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
          <Clock className="w-2.5 h-2.5 text-amber-600" />
          Needs Reply
        </span>
      );
    } else if (triage.category === 'newsletter') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
          Newsletter
        </span>
      );
    } else if (triage.category === 'receipt_finance') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 shrink-0">
          Receipt
        </span>
      );
    }
    return null;
  };

  const getSenderInitial = (name: string, email: string) => {
    const target = name || email || 'U';
    return target.charAt(0).toUpperCase();
  };

  const getAvatarBg = (str: string) => {
    const colors = [
      'bg-blue-600 text-white',
      'bg-indigo-600 text-white',
      'bg-purple-600 text-white',
      'bg-rose-600 text-white',
      'bg-amber-600 text-white',
      'bg-emerald-600 text-white',
      'bg-teal-600 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatShortDate = (date: Date) => {
    const now = new Date();
    const isToday = 
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div id="email-list-container" className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-white border-r border-slate-200 min-w-80 md:min-w-96 max-w-xl lg:max-w-md xl:max-w-lg overflow-hidden">
      {/* Top Header & View Filter Tabs */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-2">
          <h2 id="email-list-title" className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-normal text-slate-400">({filteredEmails.length})</span>
          </h2>

          {isAnySelected ? (
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-slate-600 mr-1.5">{selectedIds.length} selected</span>
              <button
                onClick={onArchiveSelected}
                title="Archive selected"
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => onMarkReadSelected(false)}
                title="Mark as Read"
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
              >
                <MailOpen className="w-4 h-4" />
              </button>
              <button
                onClick={onTrashSelected}
                title="Move to Trash"
                className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={onSelectAll}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-200/60"
              >
                Select all
              </button>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => onFilterModeChange('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onFilterModeChange('unread')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              filterMode === 'unread'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => onFilterModeChange('needs_reply')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
              filterMode === 'needs_reply'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Needs Reply</span>
          </button>
          <button
            onClick={() => onFilterModeChange('starred')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              filterMode === 'starred'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Starred
          </button>
        </div>
      </div>

      {/* Email Feed Items */}
      <div id="email-items-scroll-area" className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Fetching emails from Workspace...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center space-y-2">
            <Mail className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-700">No emails found</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Your inbox is all clear or no messages match the selected filter.
            </p>
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isSelected = selectedEmailId === email.id;
            const isChecked = selectedIds.includes(email.id);
            const urgencyBadge = getUrgencyBadge(email.id);

            return (
              <div
                key={email.id}
                id={`email-item-${email.id}`}
                onClick={() => onSelectEmail(email)}
                className={`group px-3.5 py-3 flex items-start gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/80 border-l-4 border-blue-600'
                    : email.isUnread
                    ? 'bg-white font-medium hover:bg-slate-50'
                    : 'bg-slate-50/30 text-slate-600 hover:bg-slate-100/60'
                }`}
              >
                {/* Selection Checkbox & Star */}
                <div className="flex flex-col items-center gap-1.5 pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => onToggleSelectId(email.id, e)}
                    className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                    )}
                  </button>

                  <button
                    onClick={(e) => onToggleStar(email, e)}
                    className="text-slate-300 hover:text-amber-500 p-0.5 rounded cursor-pointer"
                    title={email.isStarred ? 'Unstar' : 'Star'}
                  >
                    <Star
                      className={`w-4 h-4 transition-colors ${
                        email.isStarred ? 'text-amber-500 fill-amber-500' : 'hover:fill-amber-200'
                      }`}
                    />
                  </button>
                </div>

                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarBg(email.from.name || email.from.email)}`}>
                  {getSenderInitial(email.from.name, email.from.email)}
                </div>

                {/* Main Content Preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      {email.isUnread && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                      <span className={`text-xs truncate ${email.isUnread ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                        {email.from.name || email.from.email}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 whitespace-nowrap">
                      {formatShortDate(email.date)}
                    </span>
                  </div>

                  <p className={`text-xs truncate mb-1 ${email.isUnread ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>
                    {email.subject}
                  </p>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {email.snippet || email.bodyText.slice(0, 100) || '(No preview)'}
                  </p>

                  {/* Badges footer */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {urgencyBadge}

                    {email.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        <Paperclip className="w-2.5 h-2.5" />
                        {email.attachments.length} file{email.attachments.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
