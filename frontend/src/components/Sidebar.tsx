import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  ShoppingBag, 
  User as UserIcon, 
  LayoutDashboard, 
  Store, 
  SlidersHorizontal, 
  ClipboardList, 
  Clock, 
  PlusCircle,
  ShieldCheck,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import { TypographicLogo } from './TypographicLogo';
import { LanguageSelector } from './LanguageSelector';
import type { UserRole } from '../types/auth';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  onItemClick?: () => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onItemClick, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  if (!user) return null;

  const roleNavItems: Record<UserRole, NavItem[]> = {
    CUSTOMER: [
      { label: t('nav.home'), path: '/customer/home', icon: <Home className="w-4 h-4" /> },
      { label: t('nav.myOrders'), path: '/customer/orders', icon: <ShoppingBag className="w-4 h-4" /> },
      { label: t('nav.profile'), path: '/customer/profile', icon: <UserIcon className="w-4 h-4" /> },
    ],
    CAFE_OWNER: [
      { label: t('nav.dashboard'), path: '/owner/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: t('nav.manage'), path: '/owner/manage', icon: <SlidersHorizontal className="w-4 h-4" /> },
      { label: t('nav.myCafe'), path: '/owner/cafe', icon: <Store className="w-4 h-4" /> },
    ],
    CAFE_WORKER: [
      { label: t('nav.manageOrder'), path: '/worker/orders', icon: <ClipboardList className="w-4 h-4" /> },
      { label: t('nav.recentOrder'), path: '/worker/recent', icon: <Clock className="w-4 h-4" /> },
      { label: t('nav.profile'), path: '/worker/profile', icon: <UserIcon className="w-4 h-4" /> },
    ],
    ADMIN: [
      { label: t('nav.dashboard'), path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: t('nav.registerCafe'), path: '/admin/register-cafe', icon: <PlusCircle className="w-4 h-4" /> },
    ],
  };

  const navItems = roleNavItems[user.role] || [];

  const roleTitleMap: Record<UserRole, string> = {
    CUSTOMER: t('roles.customer'),
    CAFE_OWNER: t('roles.cafeOwner'),
    CAFE_WORKER: t('roles.cafeWorker'),
    ADMIN: t('roles.admin'),
  };

  const roleTitle = roleTitleMap[user.role] || user.role;

  return (
    <aside className="w-64 bg-[#16324F] text-[#F7F5EF] flex flex-col h-full select-none shrink-0 shadow-lg md:shadow-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <TypographicLogo size="sm" showSubtitle={true} variant="dark" />
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Identity Badge */}
      <div className="px-5 pt-4 pb-2">
        <div className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0f2236] text-[#F7F5EF] border border-[#0F8B8D]/40 flex items-center gap-2 w-full">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B8D] shrink-0" />
          <span className="truncate">{t('common.role')}: {roleTitle}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
          {t('common.menu')}
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onItemClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#0F8B8D] text-white shadow-xs font-semibold'
                  : 'text-white/80 hover:bg-[#0f2236] hover:text-white'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Language Selector */}
      <LanguageSelector variant="sidebar" />

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-white/10 bg-[#0f2236]/70">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#0F8B8D] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
            <p className="text-[11px] text-white/60 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout(false)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white/90 bg-white/5 hover:bg-red-500/20 hover:text-red-200 border border-white/10 rounded-lg transition-colors duration-150"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('common.signOut')}</span>
        </button>
      </div>
    </aside>
  );
};
