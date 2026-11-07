import React from 'react';
import { Languages } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES, type Language } from '../i18n';

interface LanguageSelectorProps {
  variant?: 'sidebar' | 'auth';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'sidebar',
  className = '',
}) => {
  const { language, setLanguage } = useTranslation();

  if (variant === 'sidebar') {
    return (
      <div className={`px-3 py-2 ${className}`}>
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0f2236] border border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-white/70">
            <Languages className="w-3.5 h-3.5 text-[#0F8B8D]" />
            <span className="text-[11px] font-medium text-white/80">Lang:</span>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer pr-1 py-0.5"
            aria-label="Select interface language"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-[#16324F] text-white">
                {lang.nativeName}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Auth variant: clean, professional, light-mode suitable
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200 shadow-2xs backdrop-blur-xs text-xs ${className}`}>
      <Languages className="w-4 h-4 text-[#0F8B8D] shrink-0" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="bg-transparent font-medium text-[#16324F] text-xs focus:outline-none cursor-pointer pr-1 py-0.5"
        aria-label="Select interface language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="text-[#16324F] bg-white">
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};
