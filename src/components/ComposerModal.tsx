import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Paperclip, 
  Sliders, 
  Trash2, 
  Maximize2, 
  Minimize2,
  FileText,
  Check
} from 'lucide-react';
import { ComposeDraftPayload } from '../types';
import { agentApi } from '../services/agentApi';

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (payload: ComposeDraftPayload) => Promise<void>;
  userEmail?: string;
}

export const ComposerModal: React.FC<ComposerModalProps> = ({
  isOpen,
  onClose,
  onSend,
  userEmail,
}) => {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // AI Assistant in Composer
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState<'professional' | 'friendly' | 'concise' | 'assertive' | 'formal'>('professional');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  if (!isOpen) return null;

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() && !subject.trim() && !bodyText.trim()) return;

    setIsGeneratingAi(true);
    try {
      const draft = await agentApi.draftReply({
        originalSubject: subject || 'New Message',
        originalSender: to || 'Recipient',
        originalBody: bodyText || '',
        tone: selectedTone,
        customPrompt: aiPrompt.trim() || 'Draft a clean, well-structured email for this topic',
        userEmail
      });

      if (draft.subject && (!subject || subject === 'New Message')) {
        setSubject(draft.subject);
      }
      if (draft.bodyText) {
        setBodyText(draft.bodyText);
      }
    } catch (err) {
      console.error('AI generate draft error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !bodyText.trim()) return;

    setIsSending(true);
    try {
      await onSend({
        to: to.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        subject: subject.trim() || '(No Subject)',
        bodyText: bodyText.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Send mail error:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div id="composer-modal-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-2xs p-2 sm:p-4 animate-fade-in">
      <div 
        id="composer-modal-card" 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">New Message</span>
            <span className="text-[10px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30 font-medium">
              Gmail Agent
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAiHelper(!showAiHelper)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                showAiHelper ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Copilot</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Helper Banner */}
        {showAiHelper && (
          <div className="bg-linear-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                AI Smart Drafter
              </span>
              <div className="flex items-center gap-1">
                {(['professional', 'friendly', 'concise', 'assertive', 'formal'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTone(t)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium capitalize cursor-pointer ${
                      selectedTone === t 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="What would you like to say? (e.g., 'Request project update by Friday', 'Introduce myself to client')..."
                className="flex-1 text-xs px-3 py-2 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={isGeneratingAi}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAi ? 'Drafting...' : 'Draft'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Composer Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-5 space-y-3 overflow-y-auto">
          {/* To Field */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-medium text-slate-500 w-12 shrink-0">To:</span>
            <input
              id="composer-to-input"
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              required
              className="flex-1 text-xs text-slate-800 focus:outline-none"
            />
            {!showCcBcc && (
              <button
                type="button"
                onClick={() => setShowCcBcc(true)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Cc / Bcc
              </button>
            )}
          </div>

          {showCcBcc && (
            <>
              <div className="flex items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-medium text-slate-500 w-12 shrink-0">Cc:</span>
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  className="flex-1 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-medium text-slate-500 w-12 shrink-0">Bcc:</span>
                <input
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                  className="flex-1 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Subject Field */}
          <div className="flex items-center border-b border-slate-100 pb-2">
            <span className="text-xs font-medium text-slate-500 w-12 shrink-0">Subject:</span>
            <input
              id="composer-subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="flex-1 text-xs font-medium text-slate-900 focus:outline-none"
            />
          </div>

          {/* Body Area */}
          <div className="flex-1 min-h-[220px]">
            <textarea
              id="composer-body-textarea"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Write your email here, or use the AI Copilot above to generate one..."
              required
              rows={10}
              className="w-full h-full text-xs text-slate-800 leading-relaxed focus:outline-none resize-none"
            />
          </div>

          {/* Footer Action Bar */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Transmits directly via Gmail</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Discard
              </button>

              <button
                id="composer-send-btn"
                type="submit"
                disabled={isSending || !to.trim() || !bodyText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
