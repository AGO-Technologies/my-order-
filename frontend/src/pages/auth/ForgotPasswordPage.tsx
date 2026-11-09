import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, KeyRound, Lock, Eye, EyeOff, CheckCircle, ArrowRight, ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { SystemLogo } from '../../components/SystemLogo';
import { LanguageSelector } from '../../components/LanguageSelector';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useTranslation } from '../../i18n';
import { PasswordRequirements, evaluatePasswordRules } from '../../components/PasswordRequirements';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Step 1: Student ID, Step 2: OTP, Step 3: New Password
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [studentId, setStudentId] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // 5-minute countdown timer for OTP expiration
  const [otpTimerSeconds, setOtpTimerSeconds] = useState<number>(300);

  useEffect(() => {
    if (step !== 2 || otpTimerSeconds <= 0) return;

    const interval = window.setInterval(() => {
      setOtpTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, otpTimerSeconds]);

  const passwordRules = useMemo(() => {
    return evaluatePasswordRules(newPassword);
  }, [newPassword]);

  // Step 1: Send OTP using Student ID
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedId = studentId.trim();
    if (!formattedId) {
      setErrorMsg('Please enter your Student ID.');
      return;
    }

    if (!/^[Rr][Uu]\d{4}\/\d{2}$/.test(formattedId)) {
      setErrorMsg('Student ID must follow format RU followed by 4 digits, slash, and 2 digits (e.g. RU1122/19).');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await apiRequest<{ message: string }>('/api/auth/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({ student_id: formattedId }),
      });

      setSuccessInfo(res.message);
      setOtpTimerSeconds(300); // 5 minutes
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP. Please check your configuration and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setErrorMsg('Please enter a 6-digit OTP code.');
      return;
    }

    if (otpTimerSeconds <= 0) {
      setErrorMsg('OTP code has expired. Please request a new code.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await apiRequest<{ reset_token: string; message: string }>('/api/auth/verify-otp/', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId.trim(),
          otp: otp.trim(),
        }),
      });

      setResetToken(res.reset_token);
      setSuccessInfo(res.message);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP. Please verify the code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const allRulesSatisfied = Object.values(passwordRules).every(Boolean);
    if (!allRulesSatisfied) {
      setErrorMsg('New password does not satisfy all complexity requirements.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      await apiRequest('/api/auth/reset-password/', {
        method: 'POST',
        body: JSON.stringify({
          reset_token: resetToken,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      navigate('/login', {
        state: { message: t('forgot.resetSuccessMsg') },
        replace: true,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. Please restart the recovery flow.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#151D2D] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-150">
      {/* Top Bar with Theme Switcher & Language Selector */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-10 flex items-center gap-2">
        <ThemeToggle variant="auth" />
        <LanguageSelector variant="auth" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <SystemLogo size="lg" showSubtitle={true} />
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-[#20252D] dark:text-[#F7F8FC] font-serif">
          {step === 1 && t('forgot.step1Title')}
          {step === 2 && t('forgot.step2Title')}
          {step === 3 && t('forgot.step3Title')}
        </h2>
        <p className="mt-1 text-center text-sm text-[#64748B] dark:text-[#B8C4D8]">
          {step === 1 && t('forgot.step1Subtitle')}
          {step === 2 && t('forgot.step2Subtitle')}
          {step === 3 && t('forgot.step3Subtitle')}
        </p>

        {/* Wizard Step Indicator */}
        <div className="mt-6 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-[#2458A6] dark:bg-[#6F93CD]'
                  : s < step
                  ? 'w-4 bg-[#2458A6]/60 dark:bg-[#6F93CD]/60'
                  : 'w-4 bg-[#E1E6EF] dark:bg-[#34435A]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#202C40] py-8 px-6 shadow-sm border border-[#E1E6EF] dark:border-[#34435A] rounded-2xl sm:px-10 transition-colors duration-150">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successInfo && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#2458A6]/10 dark:bg-[#6F93CD]/15 border border-[#2458A6]/30 dark:border-[#6F93CD]/30 text-[#2458A6] dark:text-[#6F93CD] text-xs font-medium flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-[#2458A6] dark:text-[#6F93CD] shrink-0 mt-0.5" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* STEP 1: Enter Student ID */}
          {step === 1 && (
            <form className="space-y-5" onSubmit={handleRequestOtp}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#20252D] dark:text-[#F7F8FC]">
                  {t('forgot.enterStudentId')}
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B] dark:text-[#B8C4D8]">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="RU1122/19"
                    className="block w-full pl-10 pr-3 py-2.5 text-sm bg-[#F7F8FC] dark:bg-[#151D2D] border border-[#E1E6EF] dark:border-[#34435A] rounded-lg text-[#20252D] dark:text-[#F7F8FC] placeholder-[#64748B]/60 dark:placeholder-[#B8C4D8]/50 focus:outline-none focus:ring-2 focus:ring-[#2458A6] dark:focus:ring-[#6F93CD] focus:border-transparent transition"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#64748B] dark:text-[#B8C4D8]">
                  {t('auth.studentIdHint')}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#2458A6] hover:bg-[#1d4888] active:bg-[#163a6f] dark:bg-[#6F93CD] dark:hover:bg-[#5a80be] dark:active:bg-[#4b6fa9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2458A6] dark:focus:ring-[#6F93CD] disabled:opacity-50 transition-all duration-150 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('forgot.sendingOtp')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('forgot.sendOtp')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {step === 2 && (
            <form className="space-y-5" onSubmit={handleVerifyOtp}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#20252D] dark:text-[#F7F8FC]">
                  {t('forgot.otpLabel')}
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B] dark:text-[#B8C4D8]">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('forgot.otpPlaceholder')}
                    className="block w-full pl-10 pr-3 py-2.5 text-center tracking-widest text-lg font-mono bg-[#F7F8FC] dark:bg-[#151D2D] border border-[#E1E6EF] dark:border-[#34435A] rounded-lg text-[#20252D] dark:text-[#F7F8FC] placeholder-[#64748B]/60 dark:placeholder-[#B8C4D8]/50 focus:outline-none focus:ring-2 focus:ring-[#2458A6] dark:focus:ring-[#6F93CD] focus:border-transparent transition"
                  />
                </div>
                
                {/* 5-minute Countdown Timer Display */}
                <div className="mt-2 flex items-center justify-between text-xs text-[#64748B] dark:text-[#B8C4D8]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#B58A00] dark:text-[#F5D34A]" />
                    <span>{t('forgot.codeExpiresIn')}</span>
                  </div>
                  <span
                    className={`font-mono font-bold ${
                      otpTimerSeconds < 60 ? 'text-red-600 dark:text-red-400' : 'text-[#20252D] dark:text-[#F7F8FC]'
                    }`}
                  >
                    {formatTimer(otpTimerSeconds)}
                  </span>
                </div>
              </div>

              {otpTimerSeconds <= 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-700 dark:text-red-300">
                  {t('forgot.codeExpired')}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setErrorMsg(null);
                    }}
                    className="font-bold underline cursor-pointer ml-1 text-[#2458A6] dark:text-[#6F93CD]"
                  >
                    {t('forgot.requestNewCode')}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg(null);
                  }}
                  className="flex items-center justify-center p-2.5 rounded-xl border border-[#E1E6EF] dark:border-[#34435A] text-[#64748B] dark:text-[#B8C4D8] hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otpTimerSeconds <= 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#2458A6] hover:bg-[#1d4888] active:bg-[#163a6f] dark:bg-[#6F93CD] dark:hover:bg-[#5a80be] dark:active:bg-[#4b6fa9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2458A6] dark:focus:ring-[#6F93CD] disabled:opacity-50 transition-all duration-150 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t('forgot.verifying')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('forgot.verifyOtp')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {step === 3 && (
            <form className="space-y-5" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#20252D] dark:text-[#F7F8FC]">
                  {t('forgot.newPasswordLabel')}
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B] dark:text-[#B8C4D8]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 text-sm bg-[#F7F8FC] dark:bg-[#151D2D] border border-[#E1E6EF] dark:border-[#34435A] rounded-lg text-[#20252D] dark:text-[#F7F8FC] placeholder-[#64748B]/60 dark:placeholder-[#B8C4D8]/50 focus:outline-none focus:ring-2 focus:ring-[#2458A6] dark:focus:ring-[#6F93CD] focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] dark:text-[#B8C4D8] hover:text-[#20252D] dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#20252D] dark:text-[#F7F8FC]">
                  {t('forgot.confirmNewPasswordLabel')}
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B] dark:text-[#B8C4D8]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 text-sm bg-[#F7F8FC] dark:bg-[#151D2D] border border-[#E1E6EF] dark:border-[#34435A] rounded-lg text-[#20252D] dark:text-[#F7F8FC] placeholder-[#64748B]/60 dark:placeholder-[#B8C4D8]/50 focus:outline-none focus:ring-2 focus:ring-[#2458A6] dark:focus:ring-[#6F93CD] focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] dark:text-[#B8C4D8] hover:text-[#20252D] dark:hover:text-white cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <PasswordRequirements rules={passwordRules} />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#2458A6] hover:bg-[#1d4888] active:bg-[#163a6f] dark:bg-[#6F93CD] dark:hover:bg-[#5a80be] dark:active:bg-[#4b6fa9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2458A6] dark:focus:ring-[#6F93CD] disabled:opacity-50 transition-all duration-150 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('forgot.updatingPassword')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('forgot.resetPasswordBtn')}</span>
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-[#E1E6EF] dark:border-[#34435A] pt-5 text-center">
            <Link to="/login" className="text-xs font-semibold text-[#2458A6] dark:text-[#6F93CD] hover:underline">
              {t('forgot.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
