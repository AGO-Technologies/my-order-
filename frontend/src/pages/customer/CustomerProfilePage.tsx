import React from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Phase1PlaceholderCard } from '../../components/Phase1PlaceholderCard';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, CreditCard, Hash, MapPin, Monitor } from 'lucide-react';

export const CustomerProfilePage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <Phase1PlaceholderCard pageTitle="Profile" />

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h3 className="text-base font-bold text-[#16324F] border-b border-slate-100 pb-3 mb-4">
            Account Registration Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <User className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>Full Name</span>
              </div>
              <p className="font-semibold text-[#16324F]">{user.full_name}</p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <CreditCard className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>Student ID</span>
              </div>
              <p className="font-mono font-semibold text-[#16324F]">{user.student_id || 'N/A'}</p>
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
                <Phone className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>Phone Number</span>
              </div>
              <p className="font-mono font-semibold text-[#16324F]">{user.phone_number || 'N/A'}</p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Hash className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>FAN</span>
              </div>
              <p className="font-mono font-semibold text-[#16324F]">{user.fan || 'N/A'}</p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <MapPin className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>Campus Location</span>
              </div>
              <p className="font-semibold text-[#16324F]">
                Zone {user.zone || '1'}, Block {user.block || '-'}, Room {user.room || '-'}
              </p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Monitor className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>Device Limit</span>
              </div>
              <p className="font-semibold text-[#16324F]">{user.allowed_devices} Active Device(s)</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
