import React, { useState } from 'react';

interface SystemLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const SystemLogo: React.FC<SystemLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: {
      img: 'h-8 max-w-[120px]',
      badge: 'w-8 h-8 text-sm font-bold',
      title: 'text-base font-bold',
      sub: 'text-[10px]',
    },
    md: {
      img: 'h-10 max-w-[160px]',
      badge: 'w-10 h-10 text-lg font-extrabold',
      title: 'text-lg font-bold',
      sub: 'text-xs',
    },
    lg: {
      img: 'h-14 max-w-[200px]',
      badge: 'w-14 h-14 text-2xl font-black',
      title: 'text-2xl font-extrabold',
      sub: 'text-sm',
    },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {!imageError ? (
        <img
          src="/assets/logo.png"
          alt="እኔና ጀለሴ Pre-order System Logo"
          className={`${sizeClasses.img} object-contain shrink-0`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={`${sizeClasses.badge} flex items-center justify-center rounded-xl bg-[#2458A6] dark:bg-[#202C40] border border-[#2458A6]/20 dark:border-[#34435A] shadow-xs shrink-0`}
        >
          <span className="text-[#F5D34A] font-serif">እ</span>
          <span className="text-white dark:text-[#6F93CD] -ml-0.5">ጀ</span>
        </div>
      )}

      {showSubtitle && (
        <div className="flex flex-col">
          <span
            className={`${sizeClasses.title} leading-tight font-serif tracking-tight text-[#20252D] dark:text-[#F7F8FC]`}
          >
            እኔና ጀለሴ
          </span>
          <span
            className={`${sizeClasses.sub} font-medium tracking-wide uppercase text-[#64748B] dark:text-[#B8C4D8]`}
          >
            Pre-order System
          </span>
        </div>
      )}
    </div>
  );
};
