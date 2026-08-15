import React from 'react';
import { AlertTriangle, Send, Trash2, Archive, CheckCircle2, X } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  actionType?: 'delete' | 'send' | 'archive' | 'modify' | 'default';
  itemCount?: number;
  details?: string[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  actionType = 'default',
  itemCount,
  details,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (actionType) {
      case 'delete':
        return <Trash2 className="w-6 h-6 text-red-600" />;
      case 'send':
        return <Send className="w-6 h-6 text-blue-600" />;
      case 'archive':
        return <Archive className="w-6 h-6 text-amber-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
    }
  };

  const getButtonColor = () => {
    switch (actionType) {
      case 'delete':
        return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      case 'send':
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
      case 'archive':
        return 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500';
      default:
        return 'bg-gray-900 hover:bg-black text-white focus:ring-gray-400';
    }
  };

  return (
    <div id="confirmation-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div 
        id="confirmation-modal-card" 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
                {getIcon()}
              </div>
              <div>
                <h3 id="confirmation-modal-title" className="text-lg font-semibold text-gray-900 leading-snug">
                  {title}
                </h3>
                {itemCount && itemCount > 1 && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                    {itemCount} items affected
                  </span>
                )}
              </div>
            </div>
            <button
              id="confirmation-modal-close-btn"
              onClick={onCancel}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p id="confirmation-modal-message" className="mt-4 text-sm text-gray-600 leading-relaxed">
            {message}
          </p>

          {details && details.length > 0 && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-36 overflow-y-auto text-xs text-gray-700 space-y-1">
              {details.map((detail, idx) => (
                <div key={idx} className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                  <span className="truncate">{detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            id="confirmation-modal-cancel-btn"
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            id="confirmation-modal-confirm-btn"
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-sm font-medium rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${getButtonColor()}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
