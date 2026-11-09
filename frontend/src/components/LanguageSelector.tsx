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
  const { language, setLanguage, t } = useTranslation();

  if (variant === 'sidebar') {
    return (
      <div className={`px-3 py-1.5 ${className}`}>
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#F7F8FC] dark:bg-[#151D2D] border border-[#E1E6EF] dark:border-[#34435A] text-xs">
          <div className="flex items-center gap-1.5 text-[#64748B] dark:text-[#B8C4D8]">
            <Languages className="w-3.5 h-3.5 text-[#2458A6] dark:text-[#6F93CD]" />
            <span className="text-[11px] font-medium">{t('common.language')}:</span>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent text-[#20252D] dark:text-[#F7F8FC] font-medium text-xs focus:outline-none cursor-pointer pr-1 py-0.5"
            aria-label="Select interface language"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option
                key={lang.code}
                value={lang.code}
                className="bg-white dark:bg-[#202C40] text-[#20252D] dark:text-[#F7F8FC]"
              >
                {lang.nativeName}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Auth variant: clean, professional, light & dark mode compatible
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#202C40] border border-[#E1E6EF] dark:border-[#34435A] shadow-2xs backdrop-blur-xs text-xs ${className}`}
    >
      <Languages className="w-4 h-4 text-[#2458A6] dark:text-[#6F93CD] shrink-0" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="bg-transparent font-medium text-[#20252D] dark:text-[#F7F8FC] text-xs focus:outline-none cursor-pointer pr-1 py-0.5"
        aria-label="Select interface language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option
            key={lang.code}
            value={lang.code}
            className="bg-white dark:bg-[#202C40] text-[#20252D] dark:text-[#F7F8FC]"
          >
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};
