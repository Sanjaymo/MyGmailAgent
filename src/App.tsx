import React, { useState, useEffect, useCallback } from 'react';

interface GoogleUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from './lib/firebase';
import { gmailService } from './services/gmailService';
import { agentApi } from './services/agentApi';
import { 
  ParsedEmail, 
  ParsedThread, 
  GmailLabel, 
  EmailTriageInfo, 
  ComposeDraftPayload 
} from './types';

// Subcomponents
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { Sidebar, ViewType } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailDetail } from './components/EmailDetail';
import { ComposerModal } from './components/ComposerModal';
import { AgentCopilotPanel } from './components/AgentCopilotPanel';
import { ConfirmationModal, ConfirmationModalProps } from './components/ConfirmationModal';

export default function App() {
  // Authentication State
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userEmailAddress, setUserEmailAddress] = useState<string>('');

  // Mail Data State
  const [emails, setEmails] = useState<ParsedEmail[]>([]);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<ParsedEmail | null>(null);
  const [selectedThread, setSelectedThread] = useState<ParsedThread | null>(null);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active View & Filter State
  const [currentView, setCurrentView] = useState<ViewType>('INBOX');
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'starred' | 'needs_reply'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchFilter, setActiveSearchFilter] = useState<string | null>(null);

  // Multi-Selection State
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);

  // AI Triage State
  const [triageMap, setTriageMap] = useState<Map<string, EmailTriageInfo>>(new Map());
  const [isTriaging, setIsTriaging] = useState(false);

  // Composer & Copilot Drawer State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Destructive Action Confirmation Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState<ConfirmationModalProps>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  // 1. Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser, accessToken) => {
        setUser(authenticatedUser);
        setToken(accessToken);
        setNeedsAuth(false);
        setUserEmailAddress(authenticatedUser.email || '');
      },
      () => {
        setNeedsAuth(true);
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Fetch User Profile, Labels, and Emails when Auth is active
  const loadMailboxData = useCallback(async (view: ViewType = currentView, labelId: string | null = selectedLabelId, search: string | null = activeSearchFilter) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setNeedsAuth(true);
      return;
    }

    setIsLoadingEmails(true);
    try {
      // 1. Get profile if not yet populated
      try {
        const profile = await gmailService.getUserProfile();
        if (profile.emailAddress) {
          setUserEmailAddress(profile.emailAddress);
        }
      } catch (e) {
        console.warn('Profile fetch error:', e);
      }

      // 2. Fetch Labels
      const allLabels = await gmailService.listLabels();
      setLabels(allLabels);

      // 3. Build search query or label filter based on View
      let queryParam = search || '';
      let labelIdsParam: string[] | undefined = undefined;

      if (!search) {
        if (labelId) {
          labelIdsParam = [labelId];
        } else {
          switch (view) {
            case 'INBOX':
              labelIdsParam = ['INBOX'];
              break;
            case 'STARRED':
              labelIdsParam = ['STARRED'];
              break;
            case 'SENT':
              labelIdsParam = ['SENT'];
              break;
            case 'DRAFT':
              labelIdsParam = ['DRAFT'];
              break;
            case 'TRASH':
              labelIdsParam = ['TRASH'];
              break;
            case 'SPAM':
              labelIdsParam = ['SPAM'];
              break;
            case 'AI_URGENT':
              queryParam = 'is:unread -category:promotions -category:social';
              break;
            case 'AI_RECEIPTS':
              queryParam = 'filename:pdf OR subject:(receipt OR invoice OR bill OR confirmation OR order)';
              break;
            case 'AI_NEWSLETTERS':
              queryParam = 'category:promotions OR unsubscribe';
              break;
            case 'AI_WORK':
              queryParam = 'category:primary -category:social -category:promotions';
              break;
            default:
              labelIdsParam = ['INBOX'];
          }
        }
      }

      const listResult = await gmailService.listMessages({
        query: queryParam || undefined,
        labelIds: labelIdsParam,
        maxResults: 25,
        includeSpamTrash: view === 'TRASH' || view === 'SPAM',
      });

      if (listResult.messages && listResult.messages.length > 0) {
        const fetchedEmails = await gmailService.getMessagesBatch(listResult.messages.map(m => m.id), 10);
        setEmails(fetchedEmails);

        // If no email is selected or current selected is not in list, select first
        if (fetchedEmails.length > 0) {
          const matched = fetchedEmails.find(e => e.id === selectedEmail?.id);
          if (!matched) {
            handleSelectEmail(fetchedEmails[0]);
          }
        } else {
          setSelectedEmail(null);
          setSelectedThread(null);
        }
      } else {
        setEmails([]);
        setSelectedEmail(null);
        setSelectedThread(null);
      }
    } catch (error: any) {
      console.error('Failed to load emails:', error);
      if (error?.message?.includes('401') || error?.message?.includes('token')) {
        setNeedsAuth(true);
      }
    } finally {
      setIsLoadingEmails(false);
      setIsRefreshing(false);
    }
  }, [currentView, selectedLabelId, activeSearchFilter, selectedEmail?.id]);

  useEffect(() => {
    if (token) {
      loadMailboxData(currentView, selectedLabelId, activeSearchFilter);
    }
  }, [token, currentView, selectedLabelId, activeSearchFilter]);

  // Handle Google Sign-in Click
  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        setUserEmailAddress(result.user.email || '');
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setAuthError(err.message || 'Failed to authenticate with Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setEmails([]);
    setSelectedEmail(null);
  };

  // Handle selecting an email to view full thread
  const handleSelectEmail = async (email: ParsedEmail) => {
    setSelectedEmail(email);
    // Mark as read in UI & API if unread
    if (email.isUnread) {
      try {
        await gmailService.modifyMessage(email.id, [], ['UNREAD']);
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isUnread: false } : e));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }

    // Fetch full thread if message is part of thread
    if (email.threadId) {
      try {
        const threadData = await gmailService.getThread(email.threadId);
        setSelectedThread(threadData);
      } catch (err) {
        console.error('Failed to fetch thread:', err);
        setSelectedThread(null);
      }
    }
  };

  // Run Autonomous AI Inbox Triage
  const handleRunTriage = async () => {
    if (emails.length === 0 || isTriaging) return;
    setIsTriaging(true);
    try {
      const triageInput = emails.slice(0, 20).map(e => ({
        id: e.id,
        subject: e.subject,
        from: e.from.name || e.from.email,
        snippet: e.snippet,
        date: e.dateStr,
      }));

      const results = await agentApi.triageEmails(triageInput);
      const newMap = new Map(triageMap);
      results.forEach(res => {
        newMap.set(res.id, res);
      });
      setTriageMap(newMap);
    } catch (err) {
      console.error('Triage error:', err);
    } finally {
      setIsTriaging(false);
    }
  };

  // Execute Search
  const handleExecuteSearch = (query: string, naturalText?: string) => {
    setActiveSearchFilter(query);
    loadMailboxData(currentView, selectedLabelId, query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchFilter(null);
    loadMailboxData(currentView, selectedLabelId, null);
  };

  // View Navigation
  const handleSelectView = (view: ViewType) => {
    setCurrentView(view);
    setSelectedLabelId(null);
    setActiveSearchFilter(null);
    setSearchQuery('');
    setSelectedEmailIds([]);
  };

  const handleSelectCustomLabel = (labelId: string) => {
    setSelectedLabelId(labelId);
    setActiveSearchFilter(null);
    setSearchQuery('');
    setSelectedEmailIds([]);
  };

  // Star Toggle
  const handleToggleStar = async (email: ParsedEmail, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newStarred = !email.isStarred;
    try {
      if (newStarred) {
        await gmailService.modifyMessage(email.id, ['STARRED'], []);
      } else {
        await gmailService.modifyMessage(email.id, [], ['STARRED']);
      }
      setEmails(prev => prev.map(m => m.id === email.id ? { ...m, isStarred: newStarred } : m));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(prev => prev ? { ...prev, isStarred: newStarred } : null);
      }
    } catch (err) {
      console.error('Failed to star email:', err);
    }
  };

  // Mark Read / Unread
  const handleMarkRead = async (email: ParsedEmail) => {
    const newUnread = !email.isUnread;
    try {
      if (newUnread) {
        await gmailService.modifyMessage(email.id, ['UNREAD'], []);
      } else {
        await gmailService.modifyMessage(email.id, [], ['UNREAD']);
      }
      setEmails(prev => prev.map(m => m.id === email.id ? { ...m, isUnread: newUnread } : m));
    } catch (err) {
      console.error('Failed to mark read/unread:', err);
    }
  };

  // Apply Label
  const handleApplyLabel = async (email: ParsedEmail, labelId: string) => {
    const hasLabel = email.labelIds.includes(labelId);
    try {
      if (hasLabel) {
        await gmailService.modifyMessage(email.id, [], [labelId]);
        setEmails(prev => prev.map(m => m.id === email.id ? { ...m, labelIds: m.labelIds.filter(l => l !== labelId) } : m));
      } else {
        await gmailService.modifyMessage(email.id, [labelId], []);
        setEmails(prev => prev.map(m => m.id === email.id ? { ...m, labelIds: [...m.labelIds, labelId] } : m));
      }
    } catch (err) {
      console.error('Failed to update label:', err);
    }
  };

  // Create Label
  const handleCreateLabel = async (name: string) => {
    try {
      const newLbl = await gmailService.createLabel(name);
      setLabels(prev => [...prev, newLbl]);
    } catch (err) {
      console.error('Create label error:', err);
    }
  };

  // Archive Single
  const handleArchiveEmail = async (email: ParsedEmail) => {
    try {
      await gmailService.modifyMessage(email.id, [], ['INBOX']);
      setEmails(prev => prev.filter(m => m.id !== email.id));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(null);
        setSelectedThread(null);
      }
    } catch (err) {
      console.error('Archive error:', err);
    }
  };

  // Trash Single with Explicit User Confirmation
  const handleTrashEmailPrompt = (email: ParsedEmail) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Move email to Trash?',
      message: `Are you sure you want to move "${email.subject}" to Trash? Items in Trash are deleted automatically after 30 days.`,
      confirmLabel: 'Move to Trash',
      actionType: 'delete',
      onConfirm: async () => {
        try {
          await gmailService.trashMessage(email.id);
          setEmails(prev => prev.filter(m => m.id !== email.id));
          if (selectedEmail?.id === email.id) {
            setSelectedEmail(null);
            setSelectedThread(null);
          }
        } catch (err) {
          console.error('Trash error:', err);
        } finally {
          setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      },
      onCancel: () => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Multi-Selection Actions
  const handleToggleSelectId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmailIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedEmailIds(emails.map(e => e.id));
  };

  const handleClearSelection = () => {
    setSelectedEmailIds([]);
  };

  const handleBatchArchive = () => {
    if (selectedEmailIds.length === 0) return;
    setConfirmModalConfig({
      isOpen: true,
      title: `Archive ${selectedEmailIds.length} email(s)?`,
      message: 'This will remove the selected messages from your Inbox and place them in All Mail.',
      confirmLabel: 'Archive All',
      actionType: 'archive',
      itemCount: selectedEmailIds.length,
      onConfirm: async () => {
        try {
          await gmailService.batchModifyMessages(selectedEmailIds, [], ['INBOX']);
          setEmails(prev => prev.filter(m => !selectedEmailIds.includes(m.id)));
          setSelectedEmailIds([]);
        } catch (err) {
          console.error('Batch archive error:', err);
        } finally {
          setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      },
      onCancel: () => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleBatchTrash = () => {
    if (selectedEmailIds.length === 0) return;
    setConfirmModalConfig({
      isOpen: true,
      title: `Move ${selectedEmailIds.length} email(s) to Trash?`,
      message: 'Are you sure you want to move all selected messages to Trash?',
      confirmLabel: 'Move to Trash',
      actionType: 'delete',
      itemCount: selectedEmailIds.length,
      onConfirm: async () => {
        try {
          await gmailService.batchModifyMessages(selectedEmailIds, ['TRASH'], ['INBOX']);
          setEmails(prev => prev.filter(m => !selectedEmailIds.includes(m.id)));
          setSelectedEmailIds([]);
        } catch (err) {
          console.error('Batch trash error:', err);
        } finally {
          setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      },
      onCancel: () => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleBatchMarkRead = async (unread: boolean) => {
    if (selectedEmailIds.length === 0) return;
    try {
      if (unread) {
        await gmailService.batchModifyMessages(selectedEmailIds, ['UNREAD'], []);
      } else {
        await gmailService.batchModifyMessages(selectedEmailIds, [], ['UNREAD']);
      }
      setEmails(prev => prev.map(m => selectedEmailIds.includes(m.id) ? { ...m, isUnread: unread } : m));
      setSelectedEmailIds([]);
    } catch (err) {
      console.error('Batch mark read error:', err);
    }
  };

  // Send Email with Explicit User Confirmation Dialog (Required by Workspace Skill)
  const handleSendEmailPrompt = (payload: ComposeDraftPayload): Promise<void> => {
    return new Promise((resolve, reject) => {
      setConfirmModalConfig({
        isOpen: true,
        title: 'Send this email message?',
        message: `You are about to transmit this email directly to ${payload.to} with subject "${payload.subject}".`,
        confirmLabel: 'Confirm & Send',
        actionType: 'send',
        details: [
          `To: ${payload.to}`,
          ...(payload.cc ? [`Cc: ${payload.cc}`] : []),
          `Subject: ${payload.subject}`,
          `Preview: ${payload.bodyText.slice(0, 100)}...`
        ],
        onConfirm: async () => {
          try {
            await gmailService.sendEmail(payload);
            setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
            resolve();
          } catch (err) {
            console.error('Send mail error:', err);
            setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
            reject(err);
          }
        },
        onCancel: () => {
          setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
          reject(new Error('Cancelled by user'));
        }
      });
    });
  };

  // Calculate Urgent Count
  const urgentCount = Array.from(triageMap.values()).filter(t => t.urgencyScore >= 8 || t.needsReply).length;
  const unreadInboxCount = emails.filter(e => e.isUnread && e.labelIds.includes('INBOX')).length;
  const starredCount = emails.filter(e => e.isStarred).length;

  const getViewTitle = () => {
    if (activeSearchFilter) return `Search: "${activeSearchFilter}"`;
    if (selectedLabelId) {
      const lbl = labels.find(l => l.id === selectedLabelId);
      return lbl ? `Label: ${lbl.name}` : 'Custom Label';
    }
    switch (currentView) {
      case 'INBOX': return 'Inbox';
      case 'STARRED': return 'Starred Messages';
      case 'SENT': return 'Sent Mail';
      case 'DRAFT': return 'Drafts';
      case 'TRASH': return 'Trash';
      case 'SPAM': return 'Spam';
      case 'AI_URGENT': return '⚡ AI Urgent & Action Needed';
      case 'AI_RECEIPTS': return '🧾 AI Receipts & Invoices';
      case 'AI_NEWSLETTERS': return '📰 AI Newsletters & Digests';
      case 'AI_WORK': return '💼 AI Work & Projects';
      default: return 'Inbox';
    }
  };

  // If user is not authenticated or needs sign in, render official AuthScreen
  if (needsAuth || !token) {
    return <AuthScreen onSignIn={handleSignIn} isLoading={isLoggingIn} error={authError} />;
  }

  return (
    <div id="gmail-app-root" className="min-h-screen bg-white flex flex-col font-sans antialiased text-slate-900 overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        user={user}
        userEmail={userEmailAddress}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExecuteSearch={handleExecuteSearch}
        onClearSearch={handleClearSearch}
        onOpenCompose={() => setIsComposerOpen(true)}
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        isCopilotOpen={isCopilotOpen}
        onRunTriage={handleRunTriage}
        isTriaging={isTriaging}
        onRefresh={() => {
          setIsRefreshing(true);
          loadMailboxData(currentView, selectedLabelId, activeSearchFilter);
        }}
        isRefreshing={isRefreshing}
        onSignOut={handleSignOut}
        urgentCount={urgentCount}
      />

      {/* Main 3-Column Layout: Sidebar | Email Feed | Thread Detail & Actions */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          selectedLabelId={selectedLabelId}
          onSelectView={handleSelectView}
          onSelectCustomLabel={handleSelectCustomLabel}
          unreadInboxCount={unreadInboxCount}
          starredCount={starredCount}
          urgentCount={urgentCount}
          labels={labels}
          onCreateLabel={handleCreateLabel}
          onOpenCompose={() => setIsComposerOpen(true)}
        />

        {/* Center Email List */}
        <EmailList
          emails={emails}
          selectedEmailId={selectedEmail?.id || null}
          onSelectEmail={handleSelectEmail}
          selectedIds={selectedEmailIds}
          onToggleSelectId={handleToggleSelectId}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onToggleStar={handleToggleStar}
          onArchiveSelected={handleBatchArchive}
          onTrashSelected={handleBatchTrash}
          onMarkReadSelected={handleBatchMarkRead}
          onTriageSelected={handleRunTriage}
          triageMap={triageMap}
          isLoading={isLoadingEmails}
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
          title={getViewTitle()}
        />

        {/* Right Email Detail & AI Action Center */}
        <EmailDetail
          email={selectedEmail}
          thread={selectedThread}
          labels={labels}
          onArchive={handleArchiveEmail}
          onTrash={handleTrashEmailPrompt}
          onToggleStar={handleToggleStar}
          onMarkUnread={handleMarkRead}
          onApplyLabel={handleApplyLabel}
          onSendReply={handleSendEmailPrompt}
          userEmail={userEmailAddress}
        />

        {/* Slide-over Agent Copilot Panel */}
        <AgentCopilotPanel
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          emails={emails}
          selectedEmail={selectedEmail}
          userEmail={userEmailAddress}
          onExecuteSearch={handleExecuteSearch}
          onRunTriage={handleRunTriage}
          isTriaging={isTriaging}
          onOpenComposeWithDraft={(draft) => {
            setIsComposerOpen(true);
          }}
          urgentCount={urgentCount}
        />
      </div>

      {/* Modal: New Message Composer */}
      <ComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSend={handleSendEmailPrompt}
        userEmail={userEmailAddress}
      />

      {/* Mandatory Destructive Operation Confirmation Dialog */}
      <ConfirmationModal {...confirmModalConfig} />
    </div>
  );
}
