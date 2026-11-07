import React from 'react';
import { Check, Circle } from 'lucide-react';
import { useTranslation } from '../i18n';
import type { PasswordRules } from '../types/auth';

interface PasswordRequirementsProps {
  rules: PasswordRules;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ rules }) => {
  const { t } = useTranslation();

  const requirements = [
    { label: t('auth.pwReqLength'), satisfied: rules.minLength },
    { label: t('auth.pwReqUpper'), satisfied: rules.hasUpper },
    { label: t('auth.pwReqLower'), satisfied: rules.hasLower },
    { label: t('auth.pwReqNumber'), satisfied: rules.hasNumber },
    { label: t('auth.pwReqSpecial'), satisfied: rules.hasSpecial },
  ];

  return (
    <div className="mt-2 space-y-1.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs">
      <p className="font-semibold text-[#16324F] mb-1">{t('auth.pwReqTitle')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {requirements.map((req, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 transition-colors duration-200 ${
              req.satisfied ? 'text-[#0F8B8D] font-medium' : 'text-slate-500'
            }`}
          >
            {req.satisfied ? (
              <span className="w-4 h-4 rounded-full bg-[#0F8B8D]/15 flex items-center justify-center text-[#0F8B8D] shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                <Circle className="w-2.5 h-2.5 fill-current" />
              </span>
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function evaluatePasswordRules(password: string): PasswordRules {
  return {
    minLength: password.length >= 9,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password),
  };
}
