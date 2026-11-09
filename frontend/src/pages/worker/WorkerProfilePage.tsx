import React from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Phase1PlaceholderCard } from '../../components/Phase1PlaceholderCard';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import { User, Mail, ShieldCheck, Monitor } from 'lucide-react';

export const WorkerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <Phase1PlaceholderCard pageTitle="Profile" />

        <div className="bg-white dark:bg-[#202C40] rounded-2xl border border-[#E1E6EF] dark:border-[#34435A] p-6 sm:p-8 shadow-xs transition-colors duration-150">
          <h3 className="text-base font-bold text-[#20252D] dark:text-[#F7F8FC] border-b border-[#E1E6EF] dark:border-[#34435A] pb-3 mb-4">
            {t('profile.workerAccountInfo')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-[#F7F8FC] dark:bg-[#151D2D] rounded-xl border border-[#E1E6EF] dark:border-[#34435A]">
              <div className="flex items-center gap-2 text-[#64748B] dark:text-[#B8C4D8] text-xs font-semibold mb-1">
                <User className="w-3.5 h-3.5 text-[#2458A6] dark:text-[#6F93CD]" />
                <span>{t('auth.fullNameLabel')}</span>
              </div>
              <p className="font-semibold text-[#20252D] dark:text-[#F7F8FC]">{user.full_name}</p>
            </div>

            <div className="p-3 bg-[#F7F8FC] dark:bg-[#151D2D] rounded-xl border border-[#E1E6EF] dark:border-[#34435A]">
              <div className="flex items-center gap-2 text-[#64748B] dark:text-[#B8C4D8] text-xs font-semibold mb-1">
                <Mail className="w-3.5 h-3.5 text-[#2458A6] dark:text-[#6F93CD]" />
                <span>{t('auth.emailLabel')}</span>
              </div>
              <p className="font-semibold text-[#20252D] dark:text-[#F7F8FC] truncate">{user.email}</p>
            </div>

            <div className="p-3 bg-[#F7F8FC] dark:bg-[#151D2D] rounded-xl border border-[#E1E6EF] dark:border-[#34435A]">
              <div className="flex items-center gap-2 text-[#64748B] dark:text-[#B8C4D8] text-xs font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2458A6] dark:text-[#6F93CD]" />
                <span>{t('profile.assignedRole')}</span>
              </div>
              <p className="font-semibold text-[#2458A6] dark:text-[#6F93CD]">{t('roles.cafeWorker')}</p>
            </div>

            <div className="p-3 bg-[#F7F8FC] dark:bg-[#151D2D] rounded-xl border border-[#E1E6EF] dark:border-[#34435A]">
              <div className="flex items-center gap-2 text-[#64748B] dark:text-[#B8C4D8] text-xs font-semibold mb-1">
                <Monitor className="w-3.5 h-3.5 text-[#2458A6] dark:text-[#6F93CD]" />
                <span>{t('profile.allowedDevices')}</span>
              </div>
              <p className="font-semibold text-[#20252D] dark:text-[#F7F8FC]">
                {t('profile.devicesLimitDesc', { count: user.allowed_devices })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
