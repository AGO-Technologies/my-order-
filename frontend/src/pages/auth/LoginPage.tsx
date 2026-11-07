import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertTriangle, ShieldAlert, Monitor, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import { apiRequest, getOrCreateDeviceId } from '../../services/api';
import { TypographicLogo } from '../../components/TypographicLogo';
import { LanguageSelector } from '../../components/LanguageSelector';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, getDashboardPath, sessionExpired, setSessionExpired } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Brute-force lockout state
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // Device limit notification
  const [deviceLimitError, setDeviceLimitError] = useState<string | null>(null);

  // Success message passed from registration or reset
  const successMsg = location.state?.message;

  // Countdown timer for brute force lockout
  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return;

    const interval = window.setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds && lockoutSeconds > 0) return;

    setErrorMsg(null);
    setDeviceLimitError(null);
    setIsLoading(true);

    try {
      const deviceId = getOrCreateDeviceId();
      const res = await apiRequest<{ user: any; message: string }>('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          device_id: deviceId,
          device_name: navigator.userAgent.slice(0, 100),
        }),
      });

      if (res && res.user) {
        login(res.user);
        navigate(getDashboardPath(res.user.role), { replace: true });
      }
    } catch (err: any) {
      if (err.status === 429 && err.data?.lockout_seconds) {
        setLockoutSeconds(err.data.lockout_seconds);
        setErrorMsg(err.data.detail);
      } else if (err.status === 403 && err.data?.code === 'device_limit_reached') {
        setDeviceLimitError(err.data.detail);
      } else {
        setErrorMsg(err.message || t('auth.invalidCredentials'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Top Bar with Language Selector */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-10">
        <LanguageSelector variant="auth" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <TypographicLogo size="lg" showSubtitle={true} />
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-[#16324F] font-serif">
          {t('auth.loginTitle')}
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          {t('auth.loginSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-10">
          {/* Inactivity Session Timeout Alert */}
          {sessionExpired && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">{t('auth.sessionExpiredTitle')}</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  {t('auth.sessionExpiredDesc')}
                </p>
              </div>
            </div>
          )}

          {/* Success Message Banner */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#0F8B8D]/10 border border-[#0F8B8D]/30 text-[#0F8B8D] text-xs font-medium">
              {successMsg}
            </div>
          )}

          {/* Brute-force Lockout Banner */}
          {lockoutSeconds !== null && lockoutSeconds > 0 && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-950">{t('auth.accountLockedTitle')}</p>
                <p className="text-xs text-red-800 mt-1">
                  {t('auth.accountLockedDesc', { seconds: lockoutSeconds })}
                </p>
              </div>
            </div>
          )}

          {/* Device Limit Error Banner */}
          {deviceLimitError && (
            <div className="mb-5 p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-sm flex items-start gap-2.5">
              <Monitor className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-950">{t('auth.deviceLimitTitle')}</p>
                <p className="text-xs text-orange-800 mt-1">{deviceLimitError}</p>
              </div>
            </div>
          )}

          {/* General Error Banner */}
          {errorMsg && !lockoutSeconds && !deviceLimitError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {errorMsg}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#16324F]/80">
                {t('auth.emailLabel')}
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (sessionExpired) setSessionExpired(false);
                  }}
                  placeholder={t('auth.emailPlaceholder')}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-[#16324F]/80">
                  {t('auth.passwordLabel')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#0F8B8D] hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="mt-1.5 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || (lockoutSeconds !== null && lockoutSeconds > 0)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c6e70] active:bg-[#0a5759] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F8B8D] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('auth.verifyingCredentials')}</span>
                </>
              ) : lockoutSeconds && lockoutSeconds > 0 ? (
                <span>{t('auth.lockedFor', { seconds: lockoutSeconds })}</span>
              ) : (
                <>
                  <span>{t('auth.signInBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center">
            <p className="text-xs text-slate-600">
              {t('auth.newToCafe')}{' '}
              <Link to="/register" className="font-semibold text-[#0F8B8D] hover:underline">
                {t('auth.createCustomerAccount')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
