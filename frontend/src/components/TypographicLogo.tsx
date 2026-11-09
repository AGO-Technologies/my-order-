import React from 'react';

interface TypographicLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  variant?: 'light' | 'dark';
}

export const TypographicLogo: React.FC<TypographicLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  variant = 'light',
}) => {
  const sizeClasses = {
    sm: {
      badge: 'w-8 h-8 text-sm font-bold tracking-tighter',
      title: 'text-base font-bold',
      sub: 'text-xs',
    },
    md: {
      badge: 'w-10 h-10 text-lg font-extrabold tracking-tighter',
      title: 'text-lg font-bold',
      sub: 'text-xs',
    },
    lg: {
      badge: 'w-14 h-14 text-2xl font-black tracking-tighter',
      title: 'text-2xl font-extrabold',
      sub: 'text-sm',
    },
  }[size];

  const isDark = variant === 'dark';

  return (
    <div className="flex items-center gap-3 select-none">
      <div
        className={`${sizeClasses.badge} flex items-center justify-center rounded-xl ${
          isDark
            ? 'bg-[#202C40] border border-[#34435A] shadow-xs'
            : 'bg-[#2458A6] border border-[#2458A6]/20 shadow-xs'
        }`}
      >
        <span className="text-[#F5D34A] font-serif">እ</span>
        <span className="text-white dark:text-[#6F93CD] -ml-0.5">ጀ</span>
      </div>
      {showSubtitle && (
        <div className="flex flex-col">
          <span
            className={`${sizeClasses.title} leading-tight font-serif tracking-tight ${
              isDark ? 'text-[#F7F8FC]' : 'text-[#20252D]'
            }`}
          >
            እኔና ጀለሴ
          </span>
          <span
            className={`${sizeClasses.sub} font-medium tracking-wide uppercase ${
              isDark ? 'text-[#B8C4D8]' : 'text-[#64748B]'
            }`}
          >
            Pre-order System
          </span>
        </div>
      )}
    </div>
  );
};
