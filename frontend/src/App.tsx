import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useTranslation } from './i18n';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Customer Pages
import { CustomerHomePage } from './pages/customer/CustomerHomePage';
import { CustomerOrdersPage } from './pages/customer/CustomerOrdersPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';

// Owner Pages
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { OwnerManagePage } from './pages/owner/OwnerManagePage';
import { OwnerCafePage } from './pages/owner/OwnerCafePage';

// Worker Pages
import { WorkerOrdersPage } from './pages/worker/WorkerOrdersPage';
import { WorkerRecentPage } from './pages/worker/WorkerRecentPage';
import { WorkerProfilePage } from './pages/worker/WorkerProfilePage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminRegisterCafePage } from './pages/admin/AdminRegisterCafePage';

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading, getDashboardPath } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">{t('common.loadingSession')}</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Customer Protected Routes */}
          <Route
            path="/customer/home"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Café Owner Protected Routes */}
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CAFE_OWNER']}>
                <OwnerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/manage"
            element={
              <ProtectedRoute allowedRoles={['CAFE_OWNER']}>
                <OwnerManagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/cafe"
            element={
              <ProtectedRoute allowedRoles={['CAFE_OWNER']}>
                <OwnerCafePage />
              </ProtectedRoute>
            }
          />

          {/* Café Worker Protected Routes */}
          <Route
            path="/worker/orders"
            element={
              <ProtectedRoute allowedRoles={['CAFE_WORKER']}>
                <WorkerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/recent"
            element={
              <ProtectedRoute allowedRoles={['CAFE_WORKER']}>
                <WorkerRecentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/profile"
            element={
              <ProtectedRoute allowedRoles={['CAFE_WORKER']}>
                <WorkerProfilePage />
              </ProtectedRoute>
            }
          />

          {/* System Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/register-cafe"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminRegisterCafePage />
              </ProtectedRoute>
            }
          />

          {/* Root and Catch-all */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
