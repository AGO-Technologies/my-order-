import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';

interface ThemeToggleProps {
  variant?: 'sidebar' | 'auth';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'sidebar',
  className = '',
}) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  if (variant === 'sidebar') {
    return (
      <div className={`px-3 py-1.5 ${className}`}>
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#F7F8FC] dark:bg-[#151D2D] border border-[#E1E6EF] dark:border-[#34435A] text-xs">
          <span className="text-[11px] font-medium text-[#64748B] dark:text-[#B8C4D8]">
            {t('common.theme')}:
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium text-[#20252D] dark:text-[#F7F8FC] hover:bg-[#E1E6EF] dark:hover:bg-[#202C40] transition-colors cursor-pointer"
            title={t('common.toggleTheme')}
            aria-label={t('common.toggleTheme')}
          >
            {theme === 'light' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#B58A00]" />
                <span>{t('common.lightMode')}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#F5D34A]" />
                <span>{t('common.darkMode')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Auth / top-bar variant
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center p-2 rounded-xl bg-white dark:bg-[#202C40] border border-[#E1E6EF] dark:border-[#34435A] text-[#20252D] dark:text-[#F7F8FC] shadow-2xs hover:bg-[#F7F8FC] dark:hover:bg-[#151D2D] transition-colors cursor-pointer ${className}`}
      title={theme === 'light' ? t('common.darkMode') : t('common.lightMode')}
      aria-label={t('common.toggleTheme')}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 text-[#2458A6]" />
      ) : (
        <Sun className="w-4 h-4 text-[#F5D34A]" />
      )}
    </button>
  );
};
