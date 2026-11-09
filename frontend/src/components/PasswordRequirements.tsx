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
    <div className="mt-2 space-y-1.5 p-3 rounded-xl bg-[#F7F8FC] dark:bg-[#151D2D] border border-[#E1E6EF] dark:border-[#34435A] text-xs transition-colors duration-150">
      <p className="font-semibold text-[#20252D] dark:text-[#F7F8FC] mb-1">{t('auth.pwReqTitle')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {requirements.map((req, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 transition-colors duration-200 ${
              req.satisfied
                ? 'text-[#2458A6] dark:text-[#6F93CD] font-medium'
                : 'text-[#64748B] dark:text-[#B8C4D8]'
            }`}
          >
            {req.satisfied ? (
              <span className="w-4 h-4 rounded-full bg-[#2458A6]/15 dark:bg-[#6F93CD]/20 flex items-center justify-center text-[#2458A6] dark:text-[#6F93CD] shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-[#E1E6EF] dark:bg-[#34435A] flex items-center justify-center text-[#64748B] dark:text-[#B8C4D8] shrink-0">
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
