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
      <div className="bg-white dark:bg-[#202C40] rounded-2xl border border-[#E1E6EF] dark:border-[#34435A] p-6 sm:p-8 shadow-xs transition-colors duration-150">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#20252D] dark:text-[#F7F8FC] font-serif tracking-tight">
          {t('dashboard.greeting', { name: user.full_name })}
        </h1>
        <div className="mt-4 pt-4 border-t border-[#E1E6EF] dark:border-[#34435A] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-[#64748B] dark:text-[#B8C4D8]">
          <p>
            <span className="text-[#64748B] dark:text-[#B8C4D8]">{t('dashboard.yourRole')}</span>{' '}
            <strong className="text-[#20252D] dark:text-[#F7F8FC] font-semibold">{roleName}</strong>
          </p>
          <span className="hidden sm:inline text-[#E1E6EF] dark:text-[#34435A]">|</span>
          <p>
            <span className="text-[#64748B] dark:text-[#B8C4D8]">{t('dashboard.youAreOn')}</span>{' '}
            <strong className="text-[#2458A6] dark:text-[#6F93CD] font-semibold">{translatedPageTitle}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
