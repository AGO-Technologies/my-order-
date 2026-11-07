import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import type { UserRole } from '../types/auth';

interface Phase1PlaceholderCardProps {
  pageTitle: string;
}

export const Phase1PlaceholderCard: React.FC<Phase1PlaceholderCardProps> = ({ pageTitle }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  if (!user) return null;

  const roleDisplayNames: Record<UserRole, string> = {
    CUSTOMER: t('roles.customer'),
    CAFE_OWNER: t('roles.cafeOwner'),
    CAFE_WORKER: t('roles.cafeWorker'),
    ADMIN: t('roles.admin'),
  };

  const roleName = roleDisplayNames[user.role] || user.role;

  const pageTitleKeyMap: Record<string, string> = {
    'Home': 'nav.home',
    'My Orders': 'nav.myOrders',
    'Profile': 'nav.profile',
    'Dashboard': 'nav.dashboard',
    'Manage': 'nav.manage',
    'My Cafe': 'nav.myCafe',
    'Manage Order': 'nav.manageOrder',
    'Recent Order': 'nav.recentOrder',
    'Register Cafe': 'nav.registerCafe',
  };

  const translatedPageTitle = pageTitleKeyMap[pageTitle] ? t(pageTitleKeyMap[pageTitle]) : pageTitle;

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#16324F] font-serif tracking-tight">
          {t('dashboard.greeting', { name: user.full_name })}
        </h1>
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-600">
          <p>
            <span className="text-slate-500">{t('dashboard.yourRole')}</span>{' '}
            <strong className="text-[#16324F] font-semibold">{roleName}</strong>
          </p>
          <span className="hidden sm:inline text-slate-300">|</span>
          <p>
            <span className="text-slate-500">{t('dashboard.youAreOn')}</span>{' '}
            <strong className="text-[#0F8B8D] font-semibold">{translatedPageTitle}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
