import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertTriangle, 
  ShieldAlert, 
  Monitor 
} from 'lucide-react';
import { apiRequest, getOrCreateDeviceId } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import { SystemLogo } from '../../components/SystemLogo';
import { LanguageSelector } from '../../components/LanguageSelector';
import { ThemeToggle } from '../../components/ThemeToggle';
import type { User } from '../../types/auth';

export const LoginPage: React.FC = () => {
  const { login, getDashboardPath } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | string>>({});
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
  const [deviceLimitError, setDeviceLimitError] = useState<string | null>(null);

  // Check if routed here due to inactivity session timeout or registration success
  const sessionExpiredState = (location.state as any)?.sessionExpired;
  const registrationSuccessMsg = (location.state as any)?.message;
  const [sessionExpired, setSessionExpired] = useState<boolean>(Boolean(sessionExpiredState));
  const [successMsg, setSuccessMsg] = useState<string | null>(registrationSuccessMsg || null);

  const getFieldError = (fieldName: string): string | null => {
    const err = fieldErrors[fieldName];
    if (!err) return null;
    if (Array.isArray(err)) return err.join(' ');
    return String(err);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setFieldErrors({});
    setLockoutSeconds(null);
    setDeviceLimitError(null);
    setSuccessMsg(null);

    const deviceId = getOrCreateDeviceId();
    const deviceName = typeof navigator !== 'undefined' && navigator.userAgent
      ? (navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser')
      : 'Browser';

    try {
      const res = await apiRequest<{ user: User }>('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          device_id: deviceId,
          device_name: deviceName,
        }),
      });
      if (res?.user) {
        login(res.user);
        navigate(getDashboardPath(res.user.role), { replace: true });
      }
    } catch (err: any) {
      if (err.status === 429 && err.data?.lockout_seconds) {
        setLockoutSeconds(err.data.lockout_seconds);
        setErrorMsg(err.data.detail || 'Account temporarily locked.');
      } else if (err.status === 403 && err.data?.code === 'device_limit_reached') {
        setDeviceLimitError(err.data.detail);
      } else if (err.status === 400 && err.data && typeof err.data === 'object') {
        setFieldErrors(err.data);
        if (err.data.non_field_errors) {
          setErrorMsg(Array.isArray(err.data.non_field_errors) ? err.data.non_field_errors.join(' ') : String(err.data.non_field_errors));
        } else if (err.data.detail) {
          setErrorMsg(String(err.data.detail));
        } else {
          setErrorMsg('Please check the highlighted fields and try again.');
        }
      } else if (err.status === 401) {
        setErrorMsg(err.data?.detail || t('auth.invalidCredentials'));
      } else if (!err.status || err.name === 'TypeError') {
        setErrorMsg('Unable to connect to the server. Please check your network connection.');
      } else {
        setErrorMsg(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#151D2D] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-150">
      {/* Top Bar with Language Selector and Theme Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-10 flex items-center gap-2">
        <ThemeToggle variant="auth" />
        <LanguageSelector variant="auth" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <SystemLogo size="lg" showSubtitle={true} />
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-[#20252D] dark:text-[#F7F8FC] font-serif">
          {t('auth.loginTitle')}
        </h2>
        <p className="mt-1 text-center text-sm text-[#64748B] dark:text-[#B8C4D8]">
          {t('auth.loginSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#202C40] py-8 px-6 shadow-sm border border-[#E1E6EF] dark:border-[#34435A] rounded-2xl sm:px-10 transition-colors duration-150">
          {/* Inactivity Session Timeout Alert */}
          {sessionExpired && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('auth.sessionExpiredTitle')}</p>
                <p className="text-xs mt-0.5">
                  {t('auth.sessionExpiredDesc')}
                </p>
              </div>
            </div>
          )}

          {/* Success Message Banner */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#2458A6]/10 dark:bg-[#6F93CD]/15 border border-[#2458A6]/30 dark:border-[#6F93CD]/30 text-[#2458A6] dark:text-[#6F93CD] text-xs font-medium">
              {successMsg}
            </div>
          )}

          {/* Brute-force Lockout Banner */}
          {lockoutSeconds !== null && lockoutSeconds > 0 && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-300 text-sm flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('auth.accountLockedTitle')}</p>
                <p className="text-xs mt-1">
                  {t('auth.accountLockedDesc', { seconds: lockoutSeconds })}
                </p>
              </div>
            </div>
          )}

          {/* Device Limit Error Banner */}
          {deviceLimitError && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-sm flex items-start gap-2.5">
              <Monitor className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('auth.deviceLimitTitle')}</p>
                <p className="text-xs mt-1">{deviceLimitError}</p>
              </div>
            </div>
          )}

          {/* General Error Banner */}
          {errorMsg && !lockoutSeconds && !deviceLimitError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm">
              {errorMsg}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#20252D] dark:text-[#F7F8FC]">
                {t('auth.emailLabel')}
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B] dark:text-[#B8C4D8]">
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
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.email;
                        return next;
                      });
                    }
                  }}
                  placeholder={t('auth.emailPlaceholder')}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-[#F7F8FC] dark:bg-[#151D2D] border border-[#E1E6EF] dark:border-[#34435A] rounded-lg text-[#20252D] dark:text-[#F7F8FC] placeholder-[#64748B]/60 dark:placeholder-[#B8C4D8]/50 focus:outline-none focus:ring-2 focus:ring-[#2458A6] dark:focus:ring-[#6F93CD] focus:border-transparent transition"
                />
              </div>
              {getFieldError('email') && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getFieldError('email')}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-[#20252D] dark:text-[#F7F8FC]">
                  {t('auth.passwordLabel')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#2458A6] dark:text-[#6F93CD] hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="mt-1.5 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B] dark:text-[#B8C4D8]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.password;
                        return next;
                      });
                    }
                  }}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="block w-full pl-10 pr-10 py-2.5 text-sm bg-[#F7F8FC] dark:bg-[#151D2D] border border-[#E1E6EF] dark:border-[#34435A] rounded-lg text-[#20252D] dark:text-[#F7F8FC] placeholder-[#64748B]/60 dark:placeholder-[#B8C4D8]/50 focus:outline-none focus:ring-2 focus:ring-[#2458A6] dark:focus:ring-[#6F93CD] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] dark:text-[#B8C4D8] hover:text-[#20252D] dark:hover:text-white cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {getFieldError('password') && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{getFieldError('password')}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || (lockoutSeconds !== null && lockoutSeconds > 0)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#2458A6] hover:bg-[#1d4888] active:bg-[#163a6f] dark:bg-[#6F93CD] dark:hover:bg-[#5a80be] dark:active:bg-[#4b6fa9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2458A6] dark:focus:ring-[#6F93CD] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
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

          <div className="mt-6 border-t border-[#E1E6EF] dark:border-[#34435A] pt-5 text-center">
            <p className="text-xs text-[#64748B] dark:text-[#B8C4D8]">
              {t('auth.newToCafe')}{' '}
              <Link to="/register" className="font-semibold text-[#2458A6] dark:text-[#6F93CD] hover:underline">
                {t('auth.createCustomerAccount')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
