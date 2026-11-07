import React from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

interface Phase1PlaceholderCardProps {
  pageTitle: string;
}

export const Phase1PlaceholderCard: React.FC<Phase1PlaceholderCardProps> = ({ pageTitle }) => {
  const { user } = useAuth();
  if (!user) return null;

  const roleDisplayNames: Record<UserRole, string> = {
    CUSTOMER: 'Customer',
    CAFE_OWNER: 'Café Owner',
    CAFE_WORKER: 'Café Worker',
    ADMIN: 'Admin',
  };

  const roleName = roleDisplayNames[user.role] || user.role;

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#16324F] font-serif tracking-tight">
          Hello, {user.full_name}
        </h1>
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-600">
          <p>
            <span className="text-slate-500">Your role:</span>{' '}
            <strong className="text-[#16324F] font-semibold">{roleName}</strong>
          </p>
          <span className="hidden sm:inline text-slate-300">|</span>
          <p>
            <span className="text-slate-500">You are on:</span>{' '}
            <strong className="text-[#0F8B8D] font-semibold">{pageTitle}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
