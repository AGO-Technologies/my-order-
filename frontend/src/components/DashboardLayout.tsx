import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Phase1Modal } from './Phase1Modal';
import { Clock, Menu } from 'lucide-react';
import { TypographicLogo } from './TypographicLogo';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F7F5EF] overflow-hidden">
      {/* Phase 1 Completion Dismissible Popup */}
      <Phase1Modal />

      {/* Desktop Static Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden transition-opacity"
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
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-[#16324F] hover:bg-slate-100 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="md:hidden">
              <TypographicLogo size="sm" showSubtitle={false} />
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-semibold text-[#16324F]">
                University Café Pre-Order System
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#16324F]/5 text-[#16324F] font-mono font-medium">
                Phase 1
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Inactivity Guard: <strong className="text-slate-800">3 min</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0F8B8D]" />
              <span className="font-semibold text-[#16324F] max-w-[120px] sm:max-w-none truncate">
                {user?.full_name}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#F7F5EF]">
          {children}
        </main>
      </div>
    </div>
  );
};
