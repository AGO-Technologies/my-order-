import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading, getDashboardPath } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F7F8FC] dark:bg-[#151D2D] transition-colors duration-150">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#E1E6EF] dark:border-[#34435A] border-t-[#2458A6] dark:border-t-[#6F93CD] rounded-full animate-spin" />
          <p className="text-sm text-[#64748B] dark:text-[#B8C4D8] font-medium">{t('common.verifyingAuth')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized role attempt to the user's authorized home dashboard
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
};
