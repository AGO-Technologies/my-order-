import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import { Phase1Modal } from './Phase1Modal';
import { Clock, Menu } from 'lucide-react';
import { SystemLogo } from './SystemLogo';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F7F8FC] dark:bg-[#151D2D] overflow-hidden transition-colors duration-150">
      {/* Phase 1 Completion Dismissible Popup */}
      <Phase1Modal />

      {/* Desktop Static Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed top-0 bottom-0 left-0 z-50 transform md:hidden transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          onClose={() => setMobileOpen(false)}
          onItemClick={() => setMobileOpen(false)}
        />
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#202C40] border-b border-[#E1E6EF] dark:border-[#34435A] px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-2xs transition-colors duration-150">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-[#20252D] dark:text-[#F7F8FC] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="md:hidden">
              <SystemLogo size="sm" showSubtitle={false} />
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-semibold text-[#20252D] dark:text-[#F7F8FC]">
                {t('common.systemTitle')}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#2458A6]/10 dark:bg-[#6F93CD]/20 text-[#2458A6] dark:text-[#6F93CD] font-mono font-medium">
                {t('common.phase1')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F8FC] dark:bg-[#151D2D] border border-[#E1E6EF] dark:border-[#34435A] text-[#64748B] dark:text-[#B8C4D8]">
              <Clock className="w-3.5 h-3.5 text-[#64748B] dark:text-[#B8C4D8]" />
              <span>{t('common.inactivityGuard', { minutes: 3 })}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2458A6] dark:bg-[#6F93CD]" />
              <span className="font-semibold text-[#20252D] dark:text-[#F7F8FC] max-w-[120px] sm:max-w-none truncate">
                {user?.full_name}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#F7F8FC] dark:bg-[#151D2D] transition-colors duration-150">
          {children}
        </main>
      </div>
    </div>
  );
};
