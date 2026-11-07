import React from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Phase1PlaceholderCard } from '../../components/Phase1PlaceholderCard';
import { ExternalLink } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <Phase1PlaceholderCard pageTitle="Dashboard" />

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#16324F]">
              Django Administration
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Authorized administrators can manage user roles and device limits via Django Admin.
            </p>
          </div>
          <a
            href="http://127.0.0.1:8000/admin/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#16324F] hover:bg-[#0f2236] text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <span>Open Django Admin</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
};
