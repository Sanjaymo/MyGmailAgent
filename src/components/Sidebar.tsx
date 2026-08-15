import React, { useState } from 'react';
import { 
  Inbox, 
  Star, 
  Send, 
  FileText, 
  Trash2, 
  AlertOctagon, 
  Archive,
  Zap,
  Newspaper,
  Receipt,
  Briefcase,
  User,
  Tag,
  Plus,
  ChevronRight,
  FolderPlus,
  Layers
} from 'lucide-react';
import { GmailLabel } from '../types';

export type ViewType = 
  | 'INBOX' 
  | 'STARRED' 
  | 'SENT' 
  | 'DRAFT' 
  | 'TRASH' 
  | 'SPAM'
  | 'AI_URGENT'
  | 'AI_NEWSLETTERS'
  | 'AI_RECEIPTS'
  | 'AI_WORK'
  | 'AI_PERSONAL'
  | 'CAT_PRIMARY'
  | 'CAT_PROMOTIONS'
  | 'CAT_UPDATES'
  | 'CAT_SOCIAL';

interface SidebarProps {
  currentView: string;
  selectedLabelId: string | null;
  onSelectView: (view: ViewType) => void;
  onSelectCustomLabel: (labelId: string) => void;
  unreadInboxCount: number;
  starredCount: number;
  urgentCount: number;
  labels: GmailLabel[];
  onCreateLabel: (name: string) => Promise<void>;
  onOpenCompose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  selectedLabelId,
  onSelectView,
  onSelectCustomLabel,
  unreadInboxCount,
  starredCount,
  urgentCount,
  labels,
  onCreateLabel,
  onOpenCompose,
}) => {
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);

  const handleCreateLabelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    setIsCreatingLabel(true);
    try {
      await onCreateLabel(newLabelName.trim());
      setNewLabelName('');
      setShowCreateLabel(false);
    } catch (err) {
      console.error('Create label error:', err);
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const userCustomLabels = labels.filter(l => l.type === 'user');

  return (
    <aside id="main-sidebar" className="w-64 bg-slate-50/70 border-r border-slate-200 h-[calc(100vh-4rem)] overflow-y-auto flex flex-col justify-between p-3 select-none shrink-0">
      <div className="space-y-6">
        {/* Big Compose Action Button */}
        <div>
          <button
            id="sidebar-compose-btn"
            onClick={onOpenCompose}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Message</span>
          </button>
        </div>

        {/* AI Smart Views */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-900/60 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-indigo-600" />
              <span>AI Smart Filters</span>
            </span>
          </div>

          <nav className="space-y-0.5">
            <button
              id="sidebar-view-ai-urgent"
              onClick={() => onSelectView('AI_URGENT')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'AI_URGENT'
                  ? 'bg-purple-100 text-purple-950 font-semibold shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>Urgent & Action Needed</span>
              </div>
              {urgentCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded-full">
                  {urgentCount}
                </span>
              )}
            </button>

            <button
              id="sidebar-view-ai-receipts"
              onClick={() => onSelectView('AI_RECEIPTS')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'AI_RECEIPTS'
                  ? 'bg-emerald-100 text-emerald-950 font-semibold shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Receipts & Invoices</span>
              </div>
            </button>

            <button
              id="sidebar-view-ai-newsletters"
              onClick={() => onSelectView('AI_NEWSLETTERS')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'AI_NEWSLETTERS'
                  ? 'bg-amber-100 text-amber-950 font-semibold shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Newspaper className="w-4 h-4 text-amber-600" />
                <span>Newsletters & Digests</span>
              </div>
            </button>

            <button
              id="sidebar-view-ai-work"
              onClick={() => onSelectView('AI_WORK')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'AI_WORK'
                  ? 'bg-blue-100 text-blue-950 font-semibold shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Work & Projects</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Standard Mail Folders */}
        <div>
          <div className="px-2 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Folders
            </span>
          </div>

          <nav className="space-y-0.5">
            <button
              id="sidebar-view-inbox"
              onClick={() => onSelectView('INBOX')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'INBOX' && !selectedLabelId
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4 text-slate-600" />
                <span>Inbox</span>
              </div>
              {unreadInboxCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                  {unreadInboxCount}
                </span>
              )}
            </button>

            <button
              id="sidebar-view-starred"
              onClick={() => onSelectView('STARRED')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'STARRED' && !selectedLabelId
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Starred</span>
              </div>
              {starredCount > 0 && (
                <span className="text-[10px] font-semibold text-slate-500">
                  {starredCount}
                </span>
              )}
            </button>

            <button
              id="sidebar-view-sent"
              onClick={() => onSelectView('SENT')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'SENT' && !selectedLabelId
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-slate-600" />
                <span>Sent</span>
              </div>
            </button>

            <button
              id="sidebar-view-drafts"
              onClick={() => onSelectView('DRAFT')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'DRAFT' && !selectedLabelId
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Drafts</span>
              </div>
            </button>

            <button
              id="sidebar-view-trash"
              onClick={() => onSelectView('TRASH')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'TRASH' && !selectedLabelId
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-slate-500" />
                <span>Trash</span>
              </div>
            </button>

            <button
              id="sidebar-view-spam"
              onClick={() => onSelectView('SPAM')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'SPAM' && !selectedLabelId
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="w-4 h-4 text-slate-500" />
                <span>Spam</span>
              </div>
            </button>
          </nav>
        </div>

        {/* User Custom Labels */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Labels
            </span>
            <button
              onClick={() => setShowCreateLabel(true)}
              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Create new label"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {showCreateLabel && (
            <form onSubmit={handleCreateLabelSubmit} className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs mb-2">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Label name..."
                autoFocus
                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateLabel(false)}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingLabel || !newLabelName.trim()}
                  className="px-2 py-1 text-[11px] bg-blue-600 text-white rounded font-medium disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          <nav className="space-y-0.5">
            {userCustomLabels.length === 0 ? (
              <p className="px-3 py-1 text-[11px] text-slate-400 italic">No custom labels</p>
            ) : (
              userCustomLabels.map((lbl) => (
                <button
                  key={lbl.id}
                  onClick={() => onSelectCustomLabel(lbl.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    selectedLabelId === lbl.id
                      ? 'bg-blue-100 text-blue-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{lbl.name}</span>
                  </div>
                  {lbl.messagesUnread && lbl.messagesUnread > 0 ? (
                    <span className="text-[10px] font-semibold text-slate-500">
                      {lbl.messagesUnread}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </nav>
        </div>
      </div>

      {/* Footer info */}
      <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 px-2 flex items-center justify-between">
        <span>Workspace Agent · MyGmailAgent</span>
        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      </div>
    </aside>
  );
};
