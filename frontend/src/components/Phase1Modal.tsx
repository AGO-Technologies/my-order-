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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="phase1-modal-title"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#202C40] rounded-2xl shadow-xl border border-[#E1E6EF] dark:border-[#34435A] overflow-hidden transform transition-all p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#64748B] hover:text-[#20252D] dark:text-[#B8C4D8] dark:hover:text-[#F7F8FC] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div className="p-2.5 rounded-xl bg-[#2458A6]/10 dark:bg-[#6F93CD]/20 text-[#2458A6] dark:text-[#6F93CD] shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 stroke-[2.25]" />
          </div>
          <div>
            <h3
              id="phase1-modal-title"
              className="text-lg font-bold text-[#20252D] dark:text-[#F7F8FC] font-serif leading-snug"
            >
              {t('modal.phase1CompletedTitle')}
            </h3>
            <p className="text-xs font-medium text-[#64748B] dark:text-[#B8C4D8] mt-0.5">
              {t('common.systemTitle')}
            </p>
          </div>
        </div>

        <p className="text-sm text-[#20252D]/80 dark:text-[#B8C4D8] leading-relaxed mb-6">
          {t('modal.phase1CompletedMsg')}
        </p>

        <div className="flex justify-end">
          <button
            onClick={handleDismiss}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-[#2458A6] hover:bg-[#1d4888] dark:bg-[#6F93CD] dark:hover:bg-[#5a80be] shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#2458A6] dark:focus:ring-[#6F93CD] focus:ring-offset-2 cursor-pointer"
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  );
};
