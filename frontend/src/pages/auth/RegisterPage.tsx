import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  User, 
  CreditCard, 
  Mail, 
  Phone, 
  Hash, 
  MapPin, 
  Building, 
  DoorOpen, 
  Lock, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { TypographicLogo } from '../../components/TypographicLogo';
import { PasswordRequirements, evaluatePasswordRules } from '../../components/PasswordRequirements';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    student_id: '',
    email: '',
    phone_number: '',
    fan: '',
    zone: '1',
    block: '',
    room: '',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const passwordRules = useMemo(() => {
    return evaluatePasswordRules(formData.password);
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    // Client-side quick checks
    const errors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Full Name is required and cannot be whitespace only.';
    }

    // Accepts both uppercase RU and lowercase ru prefix (RU1122/19 or ru1122/19)
    if (!/^[Rr][Uu]\d{4}\/\d{2}$/.test(formData.student_id.trim())) {
      errors.student_id = 'Student ID format must be RU followed by 4 digits, slash, and 2 digits (e.g. RU1122/19).';
    }

    if (!formData.email.trim().toLowerCase().endsWith('@gmail.com')) {
      errors.email = 'Only Gmail addresses (@gmail.com) are accepted.';
    }

    if (!/^(09|07)\d{8}$/.test(formData.phone_number.trim())) {
      errors.phone_number = 'Phone number must be exactly 10 digits beginning with 09 or 07.';
    }

    if (!/^\d+$/.test(formData.fan.trim())) {
      errors.fan = 'FAN must contain numeric characters only.';
    }

    if (!/^\d{1,2}$/.test(formData.block.trim())) {
      errors.block = 'Block must be a 1-2 digit number.';
    }

    if (!/^\d{1,2}$/.test(formData.room.trim())) {
      errors.room = 'Room must be a 1-2 digit number.';
    }

    if (formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match.';
    }

    const allRulesSatisfied = Object.values(passwordRules).every(Boolean);
    if (!allRulesSatisfied) {
      errors.password = 'Password does not meet all complexity requirements.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest('/api/auth/register/', {
        method: 'POST',
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          student_id: formData.student_id.trim(),
          email: formData.email.trim().toLowerCase(),
          phone_number: formData.phone_number.trim(),
          fan: formData.fan.trim(),
          zone: parseInt(formData.zone, 10),
          block: formData.block.trim(),
          room: formData.room.trim(),
          password: formData.password,
          confirm_password: formData.confirm_password,
        }),
      });

      navigate('/login', {
        state: { message: 'Registration successful! You can now log in with your credentials.' },
        replace: true,
      });
    } catch (err: any) {
      if (err.data && typeof err.data === 'object') {
        setFieldErrors(err.data);
      } else {
        setGeneralError(err.message || 'Registration failed. Please check your information and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (fieldName: string): string | null => {
    const err = fieldErrors[fieldName];
    if (!err) return null;
    if (Array.isArray(err)) return err.join(' ');
    return String(err);
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl flex flex-col items-center">
        <TypographicLogo size="lg" showSubtitle={true} />
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-[#16324F] font-serif">
          Customer Registration
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Create your account for the University Café Pre-Order System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-10">
          {generalError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Section 1: Personal Info */}
            <div className="border-b border-slate-100 pb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#16324F]/70 mb-4">
                Personal Identification
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      name="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Abba Jifar Jimma"
                      className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                    />
                  </div>
                  {getFieldError('full_name') && (
                    <p className="mt-1 text-xs text-red-600">{getFieldError('full_name')}</p>
                  )}
                </div>

                {/* Student ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <input
                      name="student_id"
                      type="text"
                      required
                      value={formData.student_id}
                      onChange={handleChange}
                      placeholder="RU1122/19"
                      className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Format: RU followed by 4 digits, slash, 2 digits</p>
                  {getFieldError('student_id') && (
                    <p className="mt-1 text-xs text-red-600">{getFieldError('student_id')}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gmail Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="yourname@gmail.com"
                      className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Only @gmail.com addresses accepted</p>
                  {getFieldError('email') && (
                    <p className="mt-1 text-xs text-red-600">{getFieldError('email')}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      name="phone_number"
                      type="tel"
                      required
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="0911223344"
                      maxLength={10}
                      className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Exactly 10 digits starting with 09 or 07</p>
                  {getFieldError('phone_number') && (
                    <p className="mt-1 text-xs text-red-600">{getFieldError('phone_number')}</p>
                  )}
                </div>

                {/* FAN */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    FAN (Financial Account Number) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Hash className="h-4 w-4" />
                    </div>
                    <input
                      name="fan"
                      type="text"
                      required
                      value={formData.fan}
                      onChange={handleChange}
                      placeholder="e.g. 987654321"
                      className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Numeric characters only</p>
                  {getFieldError('fan') && (
                    <p className="mt-1 text-xs text-red-600">{getFieldError('fan')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Campus Location */}
            <div className="border-b border-slate-100 pb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#16324F]/70 mb-4">
                Campus Residence Location
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Zone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Zone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <select
                      name="zone"
                      required
                      value={formData.zone}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                    >
                      <option value="1">Zone 1</option>
                      <option value="2">Zone 2</option>
                      <option value="3">Zone 3</option>
                      <option value="4">Zone 4</option>
                    </select>
                  </div>
                  {getFieldError('zone') && (
                    <p className="mt-1 text-xs text-red-600">{getFieldError('zone')}</p>
                  )}
                </div>

                {/* Block */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Block <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building className="h-4 w-4" />
                    </div>
                    <input
                      name="block"
                      type="text"
                      required
                      maxLength={2}
                      value={formData.block}
                      onChange={handleChange}
                      placeholder="1-99"
                      className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">1-2 digits</p>
                  {getFieldError('block') && (
                    <p className="mt-1 text-xs text-red-600">{getFieldError('block')}</p>
                  )}
                </div>

                {/* Room */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Room <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <DoorOpen className="h-4 w-4" />
                    </div>
                    <input
                      name="room"
                      type="text"
                      required
                      maxLength={2}
                      value={formData.room}
                      onChange={handleChange}
                      placeholder="1-99"
                      className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">1-2 digits</p>
                  {getFieldError('room') && (
                    <p className="mt-1 text-xs text-red-600">{getFieldError('room')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Password */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#16324F]/70 mb-4">
                Password
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className="block w-full pl-9 pr-10 py-2 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {getFieldError('password') && (
                    <p className="mt-1 text-xs text-red-600">{getFieldError('password')}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      name="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className="block w-full pl-9 pr-10 py-2 text-sm bg-slate-50/70 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {getFieldError('confirm_password') && (
                    <p className="mt-1 text-xs text-red-600">{getFieldError('confirm_password')}</p>
                  )}
                </div>
              </div>

              {/* Live Password Requirements Indicators */}
              <PasswordRequirements rules={passwordRules} />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c6e70] active:bg-[#0a5759] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F8B8D] disabled:opacity-50 transition-all duration-150"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering Customer Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Customer Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#0F8B8D] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
