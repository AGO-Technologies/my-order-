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
            ? 'bg-[#0f2236] border border-[#0F8B8D]/40 shadow-sm'
            : 'bg-[#16324F] border border-[#16324F] shadow-sm'
        }`}
      >
        <span className="text-[#F4A261] font-serif">A</span>
        <span className="text-[#0F8B8D] -ml-1">G</span>
      </div>
      {showSubtitle && (
        <div className="flex flex-col">
          <span
            className={`${sizeClasses.title} leading-tight font-serif tracking-tight ${
              isDark ? 'text-white' : 'text-[#16324F]'
            }`}
          >
            University Café
          </span>
          <span
            className={`${sizeClasses.sub} font-medium tracking-wide uppercase ${
              isDark ? 'text-[#F7F5EF]/70' : 'text-slate-500'
            }`}
          >
            Pre-Order System
          </span>
        </div>
      )}
    </div>
  );
};
