import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n';

export const Phase1Modal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('phase1_completion_dismissed');
    if (!hasSeenPopup) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('phase1_completion_dismissed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="phase1-modal-title"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div className="p-2.5 rounded-xl bg-[#0F8B8D]/10 text-[#0F8B8D] shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 stroke-[2.25]" />
          </div>
          <div>
            <h3
              id="phase1-modal-title"
              className="text-lg font-bold text-[#16324F] font-serif leading-snug"
            >
              {t('modal.phase1CompletedTitle')}
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {t('common.systemTitle')}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          {t('modal.phase1CompletedMsg')}
        </p>

        <div className="flex justify-end">
          <button
            onClick={handleDismiss}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-[#0F8B8D] hover:bg-[#0c6e70] active:bg-[#0a5759] shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:ring-offset-2"
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  );
};
