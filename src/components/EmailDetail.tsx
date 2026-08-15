import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  Trash2, 
  Star, 
  Mail, 
  MailOpen, 
  Reply, 
  ReplyAll, 
  Forward, 
  Sparkles, 
  Paperclip, 
  Send, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Tag, 
  CornerUpLeft,
  X,
  Zap,
  Sliders,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { ParsedEmail, ParsedThread, EmailSummary, ComposeDraftPayload, GmailLabel } from '../types';
import { agentApi } from '../services/agentApi';

interface EmailDetailProps {
  email: ParsedEmail | null;
  thread: ParsedThread | null;
  labels: GmailLabel[];
  onArchive: (email: ParsedEmail) => void;
  onTrash: (email: ParsedEmail) => void;
  onToggleStar: (email: ParsedEmail) => void;
  onMarkUnread: (email: ParsedEmail) => void;
  onApplyLabel: (email: ParsedEmail, labelId: string) => void;
  onSendReply: (payload: ComposeDraftPayload) => Promise<void>;
  userEmail?: string;
  onClose?: () => void;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  email,
  thread,
  labels,
  onArchive,
  onTrash,
  onToggleStar,
  onMarkUnread,
  onApplyLabel,
  onSendReply,
  userEmail,
  onClose,
}) => {
  const [summary, setSummary] = useState<EmailSummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<{ [key: number]: boolean }>({});

  // Reply Composer State
  const [isReplying, setIsReplying] = useState(false);
  const [replyType, setReplyType] = useState<'reply' | 'reply_all'>('reply');
  const [replyTo, setReplyTo] = useState('');
  const [replyCc, setReplyCc] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [isDraftingAi, setIsDraftingAi] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'professional' | 'friendly' | 'concise' | 'assertive' | 'formal'>('professional');
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [showAiDraftControls, setShowAiDraftControls] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Label Menu State
  const [showLabelMenu, setShowLabelMenu] = useState(false);

  // Expanded messages state for thread
  const [expandedMessageIds, setExpandedMessageIds] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    if (email) {
      // Reset state for new email
      setSummary(null);
      setCheckedTasks({});
      setIsReplying(false);
      setShowAiDraftControls(false);
      setCustomAiPrompt('');

      // Auto expand latest message by default
      if (thread?.messages) {
        const expanded: { [id: string]: boolean } = {};
        thread.messages.forEach((m, idx) => {
          expanded[m.id] = idx === thread.messages.length - 1; // latest expanded
        });
        setExpandedMessageIds(expanded);
      } else {
        setExpandedMessageIds({ [email.id]: true });
      }

      // Prepare reply fields
      const subjectPrefix = email.subject.toLowerCase().startsWith('re:') ? '' : 'Re: ';
      setReplySubject(`${subjectPrefix}${email.subject}`);
      setReplyTo(email.from.email);
      setReplyCc(email.cc?.join(', ') || '');
      setReplyBody('');
    }
  }, [email?.id, thread?.id]);

  if (!email) {
    return (
      <div id="email-detail-empty" className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-slate-50/50 p-8 text-center text-slate-400">
        <Mail className="w-16 h-16 text-slate-300 stroke-[1.2] mb-3" />
        <h3 className="text-base font-semibold text-slate-700">Select an email to view</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Choose a message from the list to read, summarize with AI, or draft instant smart replies.
        </p>
      </div>
    );
  }

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const result = await agentApi.summarizeEmail({
        subject: email.subject,
        from: email.from.raw || email.from.name,
        date: email.dateStr,
        bodyText: email.bodyText || email.snippet,
      });
      setSummary(result);
    } catch (err) {
      console.error('Failed to summarize:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleApplyQuickReply = (quickReplyText: string) => {
    setIsReplying(true);
    setReplyBody(quickReplyText + '\n\nBest regards,\n');
  };

  const handleAiDraftGenerate = async () => {
    setIsDraftingAi(true);
    try {
      const result = await agentApi.draftReply({
        originalSubject: email.subject,
        originalSender: email.from.raw,
        originalBody: email.bodyText || email.snippet,
        tone: selectedTone,
        customPrompt: customAiPrompt.trim() || undefined,
        userEmail
      });
      if (result.bodyText) {
        setReplyBody(result.bodyText);
        setIsReplying(true);
      }
    } catch (err) {
      console.error('Failed to draft reply:', err);
    } finally {
      setIsDraftingAi(false);
    }
  };

  const handleSendReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTo.trim() || !replyBody.trim()) return;

    setIsSending(true);
    try {
      await onSendReply({
        to: replyTo,
        cc: replyCc || undefined,
        subject: replySubject,
        bodyText: replyBody,
        threadId: email.threadId,
        inReplyTo: email.id,
      });
      setIsReplying(false);
      setReplyBody('');
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  const toggleMessageExpand = (id: string) => {
    setExpandedMessageIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const messagesToDisplay = thread?.messages && thread.messages.length > 0 ? thread.messages : [email];

  return (
    <div id="email-detail-container" className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Top Action Header */}
      <div className="h-14 border-b border-slate-200 px-6 flex items-center justify-between gap-4 bg-white shrink-0">
        <div className="flex items-center gap-1.5">
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg mr-1 cursor-pointer"
            >
              <CornerUpLeft className="w-4 h-4" />
            </button>
          )}

          <button
            id="detail-archive-btn"
            onClick={() => onArchive(email)}
            title="Archive"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            id="detail-trash-btn"
            onClick={() => onTrash(email)}
            title="Move to Trash"
            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            id="detail-unread-btn"
            onClick={() => onMarkUnread(email)}
            title="Mark as Unread"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4" />
          </button>

          <button
            id="detail-star-btn"
            onClick={() => onToggleStar(email)}
            title={email.isStarred ? 'Unstar' : 'Star'}
            className="p-2 text-slate-600 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
          >
            <Star className={`w-4 h-4 ${email.isStarred ? 'text-amber-500 fill-amber-500' : ''}`} />
          </button>

          {/* Labels Dropdown */}
          <div className="relative">
            <button
              id="detail-labels-dropdown-btn"
              onClick={() => setShowLabelMenu(!showLabelMenu)}
              title="Apply Label"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <Tag className="w-4 h-4" />
            </button>

            {showLabelMenu && (
              <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in">
                <div className="px-2 py-1 text-[11px] font-bold uppercase text-slate-400">Labels</div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {labels.filter(l => l.type === 'user').map(lbl => (
                    <button
                      key={lbl.id}
                      onClick={() => {
                        onApplyLabel(email, lbl.id);
                        setShowLabelMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg truncate flex items-center justify-between"
                    >
                      <span>{lbl.name}</span>
                      {email.labelIds.includes(lbl.id) && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Action Trigger in Header */}
        <div className="flex items-center gap-2">
          <button
            id="detail-summarize-btn"
            onClick={handleGenerateSummary}
            disabled={isSummarizing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-60 shadow-2xs"
          >
            <Sparkles className={`w-3.5 h-3.5 text-blue-600 ${isSummarizing ? 'animate-spin' : ''}`} />
            <span>{isSummarizing ? 'Analyzing...' : summary ? 'Re-Summarize' : 'AI Executive Summary'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div id="email-detail-scroll-area" className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Subject Header */}
        <div>
          <h1 id="detail-email-subject" className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
            {email.subject}
          </h1>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {email.labelIds.map(labelId => {
              const matched = labels.find(l => l.id === labelId);
              if (!matched || labelId === 'UNREAD' || labelId === 'INBOX') return null;
              return (
                <span 
                  key={labelId} 
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {matched.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* AI Executive Brief Card */}
        {summary ? (
          <div id="ai-executive-brief-card" className="bg-linear-to-br from-indigo-50/70 via-blue-50/50 to-purple-50/40 rounded-2xl border border-indigo-100/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                  AI Executive Brief
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  summary.urgency >= 7 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  ⚡ Urgency: {summary.urgency}/10
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 capitalize">
                  Tone: {summary.sentiment}
                </span>
              </div>
            </div>

            {/* TL;DR */}
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-indigo-100 text-xs text-slate-800 leading-relaxed font-medium">
              <strong>TL;DR:</strong> {summary.tl_dr}
            </div>

            {/* Action Items */}
            {summary.actionItems && summary.actionItems.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Action Items & Follow-ups
                </p>
                <div className="space-y-1">
                  {summary.actionItems.map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setCheckedTasks(prev => ({ ...prev, [idx]: !prev[idx] }))}
                      className={`flex items-start gap-2.5 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        checkedTasks[idx] ? 'bg-indigo-100/50 text-slate-400 line-through' : 'bg-white text-slate-800 border border-slate-100'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={!!checkedTasks[idx]} 
                        onChange={() => {}} 
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span>{item.task}</span>
                        {item.deadline && item.deadline !== 'None' && (
                          <span className="ml-2 text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            Due: {item.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Reply Chips */}
            {summary.quickReplies && summary.quickReplies.length > 0 && (
              <div className="pt-2 border-t border-indigo-100/60">
                <p className="text-[11px] font-bold text-indigo-900/70 mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>1-Click Smart Replies:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {summary.quickReplies.map((qr, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApplyQuickReply(qr)}
                      className="px-3 py-1.5 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-200 rounded-xl text-xs font-medium shadow-2xs transition-all cursor-pointer text-left"
                    >
                      "{qr}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Message Thread History */}
        <div className="space-y-4">
          {messagesToDisplay.map((msg, idx) => {
            const isExpanded = expandedMessageIds[msg.id] ?? (idx === messagesToDisplay.length - 1);
            const isLatest = idx === messagesToDisplay.length - 1;

            return (
              <div 
                key={msg.id} 
                id={`thread-message-${msg.id}`}
                className={`rounded-2xl border transition-all ${
                  isLatest ? 'border-slate-300 shadow-xs bg-white' : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                {/* Message Header Bar */}
                <div 
                  onClick={() => toggleMessageExpand(msg.id)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/80 rounded-2xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {msg.from.name ? msg.from.name.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {msg.from.name || msg.from.email}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          &lt;{msg.from.email}&gt;
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        To: {msg.to.join(', ')}
                        {msg.cc && msg.cc.length > 0 && ` • Cc: ${msg.cc.join(', ')}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400">{msg.dateStr}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Message Body */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                    {/* HTML / Plain text content */}
                    {msg.bodyHtml ? (
                      <div 
                        className="prose prose-sm max-w-none text-slate-800 leading-relaxed overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: msg.bodyHtml }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed font-sans">
                        {msg.bodyText || msg.snippet || '(No content)'}
                      </div>
                    )}

                    {/* Attachments */}
                    {msg.attachments.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                          <span>Attachments ({msg.attachments.length})</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.attachments.map(att => (
                            <div 
                              key={att.id} 
                              className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                            >
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-800 truncate">{att.filename}</p>
                                <p className="text-[10px] text-slate-400">
                                  {Math.round((att.size || 0) / 1024)} KB • {att.mimeType}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reply Action Trigger or Inline Composer */}
        {!isReplying ? (
          <div className="flex items-center gap-2 pt-2">
            <button
              id="detail-inline-reply-btn"
              onClick={() => {
                setReplyType('reply');
                setReplyTo(email.from.email);
                setIsReplying(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Reply className="w-4 h-4" />
              <span>Reply</span>
            </button>

            <button
              id="detail-inline-replyall-btn"
              onClick={() => {
                setReplyType('reply_all');
                const allRecipients = [email.from.email, ...(email.to || [])].filter(e => e && e !== userEmail);
                setReplyTo(allRecipients.join(', '));
                setReplyCc(email.cc?.join(', ') || '');
                setIsReplying(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <ReplyAll className="w-4 h-4" />
              <span>Reply All</span>
            </button>
          </div>
        ) : (
          /* Inline Composer Card */
          <div id="inline-reply-composer" className="bg-slate-50 border border-slate-300 rounded-2xl p-5 shadow-md space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  {replyType === 'reply_all' ? 'Replying to All' : 'Replying to sender'}
                </span>
                <span className="text-xs text-slate-500">&lt;{replyTo}&gt;</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiDraftControls(!showAiDraftControls)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    showAiDraftControls ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Draft Assistant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsReplying(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AI Assistant Settings Panel */}
            {showAiDraftControls && (
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1.5">
                    Tone Preset:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['professional', 'friendly', 'concise', 'assertive', 'formal'] as const).map(tone => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setSelectedTone(tone)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize cursor-pointer transition-colors ${
                          selectedTone === tone
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                    Custom Goal or Reply Instructions:
                  </label>
                  <input
                    type="text"
                    value={customAiPrompt}
                    onChange={(e) => setCustomAiPrompt(e.target.value)}
                    placeholder="e.g. 'Accept invitation and suggest Thursday 3pm' or 'Politely ask for breakdown of costs'"
                    className="w-full text-xs px-3 py-2 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAiDraftGenerate}
                    disabled={isDraftingAi}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isDraftingAi ? 'animate-spin' : ''}`} />
                    <span>{isDraftingAi ? 'Crafting response...' : 'Generate AI Response'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Composer Form */}
            <form onSubmit={handleSendReplySubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write your reply or use the AI Assistant to generate one..."
                  rows={6}
                  autoFocus
                  required
                  className="w-full text-xs px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Press Send to confirm & transmit via Gmail</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReplying(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    id="reply-send-submit-btn"
                    type="submit"
                    disabled={isSending || !replyBody.trim()}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
