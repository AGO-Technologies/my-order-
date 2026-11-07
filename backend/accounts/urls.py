from django.urls import path
from .views import (
    CSRFTokenView,
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    RefreshTokenView,
    ForgotPasswordView,
    VerifyOTPView,
    ResetPasswordView,
    CustomerDashboardView,
    CafeOwnerDashboardView,
    CafeWorkerDashboardView,
    AdminDashboardView,
)

urlpatterns = [
    # Auth endpoints
    path('auth/csrf/', CSRFTokenView.as_view(), name='auth-csrf'),
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),

    # Role-protected Phase 1 endpoints
    path('customer/dashboard/', CustomerDashboardView.as_view(), name='customer-dashboard'),
    path('cafe-owner/dashboard/', CafeOwnerDashboardView.as_view(), name='cafe-owner-dashboard'),
    path('cafe-worker/dashboard/', CafeWorkerDashboardView.as_view(), name='cafe-worker-dashboard'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
]
