import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, KeyRound, Lock, Eye, EyeOff, CheckCircle, ArrowRight, ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { TypographicLogo } from '../../components/TypographicLogo';
import { PasswordRequirements, evaluatePasswordRules } from '../../components/PasswordRequirements';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

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
      setSuccessInfo('OTP verified. Now create your new password.');
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const allRulesSatisfied = Object.values(passwordRules).every(Boolean);
    if (!allRulesSatisfied) {
      setErrorMsg('Password does not meet all complexity requirements.');
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest('/api/auth/reset-password/', {
        method: 'POST',
        body: JSON.stringify({
          reset_token: resetToken,
          password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      navigate('/login', {
        state: { message: 'Your password has been securely reset. You can now log in.' },
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
    <div className="min-h-screen bg-[#F7F5EF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <TypographicLogo size="lg" showSubtitle={true} />
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-[#16324F] font-serif">
          Password Recovery
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          {step === 1 && 'Enter your Student ID'}
          {step === 2 && 'Enter the 5-minute verification code'}
          {step === 3 && 'Set a new password'}
        </p>

        {/* Wizard Step Indicator */}
        <div className="mt-6 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-[#0F8B8D]'
                  : s < step
                  ? 'w-4 bg-[#16324F]'
                  : 'w-4 bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-10">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successInfo && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#0F8B8D]/10 border border-[#0F8B8D]/30 text-[#0F8B8D] text-xs font-medium flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-[#0F8B8D] shrink-0 mt-0.5" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* STEP 1: Enter Student ID */}
          {step === 1 && (
            <form className="space-y-5" onSubmit={handleRequestOtp}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#16324F]/80">
                  Enter your Student ID
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="RU1122/19"
                    className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  A 6-digit OTP will be dispatched to the email registered with this Student ID.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c6e70] active:bg-[#0a5759] focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:ring-offset-2 disabled:opacity-50 transition-all duration-150"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP</span>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#16324F]/80">
                    6-Digit OTP Code
                  </label>
                  <div className={`flex items-center gap-1 text-xs font-mono font-semibold ${
                    otpTimerSeconds > 60 ? 'text-[#16324F]/70' : 'text-red-600 animate-pulse'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimer(otpTimerSeconds)}</span>
                  </div>
                </div>

                <div className="mt-1.5 relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="block w-full pl-10 pr-3 py-2.5 text-center text-lg tracking-[0.3em] font-mono font-bold bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500 text-center">
                  Check your registered Gmail inbox for the verification code.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpTimerSeconds <= 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c6e70] active:bg-[#0a5759] focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:ring-offset-2 disabled:opacity-50 transition-all duration-150"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs font-semibold text-slate-600 hover:text-[#16324F] hover:underline flex items-center justify-center gap-1.5 pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Student ID / Request another code</span>
              </button>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === 3 && (
            <form className="space-y-5" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#16324F]/80">
                  New Password
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#16324F]/80">
                  Confirm New Password
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <PasswordRequirements rules={passwordRules} />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c6e70] active:bg-[#0a5759] focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:ring-offset-2 disabled:opacity-50 transition-all duration-150"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-200 pt-5 text-center">
            <Link to="/login" className="text-xs font-semibold text-[#0F8B8D] hover:underline">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
