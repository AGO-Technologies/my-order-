import React from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Phase1PlaceholderCard } from '../../components/Phase1PlaceholderCard';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, ShieldCheck, Monitor } from 'lucide-react';

export const WorkerProfilePage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <Phase1PlaceholderCard pageTitle="Profile" />

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h3 className="text-base font-bold text-[#16324F] border-b border-slate-100 pb-3 mb-4">
            Worker Account Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <User className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>Full Name</span>
              </div>
              <p className="font-semibold text-[#16324F]">{user.full_name}</p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Mail className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>Email Address</span>
              </div>
              <p className="font-semibold text-[#16324F] truncate">{user.email}</p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>Assigned Role</span>
              </div>
              <p className="font-semibold text-[#0F8B8D]">Café Worker</p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Monitor className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>Allowed Devices</span>
              </div>
              <p className="font-semibold text-[#16324F]">{user.allowed_devices} Device Limit</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
