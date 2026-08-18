'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'icon' | 'full' | 'combined' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  subtitle?: string;
  href?: string;
  priority?: boolean;
}

const sizeMap = {
  xs: { icon: 28, fullH: 26, fullW: 50 },
  sm: { icon: 34, fullH: 32, fullW: 62 },
  md: { icon: 42, fullH: 38, fullW: 74 },
  lg: { icon: 52, fullH: 46, fullW: 90 },
  xl: { icon: 64, fullH: 56, fullW: 110 },
  '2xl': { icon: 84, fullH: 72, fullW: 140 },
  custom: { icon: 40, fullH: 40, fullW: 78 },
};

export function Logo({
  variant = 'combined',
  size = 'md',
  className,
  imageClassName,
  showText = true,
  subtitle,
  href,
  priority = false,
}: LogoProps) {
  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 select-none transition-all group', className)}>
      {variant === 'full' ? (
        <div className="relative flex items-center shrink-0">
          <Image
            src="/images/logo/logo-full.png"
            alt="CampusCart Logo"
            width={1368}
            height={711}
            priority={priority}
            className={cn(
              'h-auto w-auto max-h-12 object-contain filter drop-shadow-xs transition-transform group-hover:scale-[1.02]',
              size === 'xs' && 'max-h-7',
              size === 'sm' && 'max-h-9',
              size === 'md' && 'max-h-11',
              size === 'lg' && 'max-h-14',
              size === 'xl' && 'max-h-20',
              size === '2xl' && 'max-h-28',
              imageClassName
            )}
          />
        </div>
      ) : variant === 'badge' ? (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-card to-secondary/80 border border-border/80 shadow-md p-1.5 overflow-hidden group-hover:scale-105 group-hover:border-primary/40 transition-all duration-300',
              imageClassName
            )}
            style={{ width: currentSize.icon + 10, height: currentSize.icon + 10 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-amber-500/10 pointer-events-none" />
            <Image
              src="/images/logo/logo-icon.png"
              alt="CampusCart Logo"
              width={currentSize.icon}
              height={currentSize.icon}
              priority={priority}
              className="object-contain w-full h-full filter drop-shadow-sm transition-transform"
            />
          </div>
          {showText && (
            <div className="flex flex-col">
              <span className="font-display font-black tracking-tight text-foreground text-lg leading-tight group-hover:text-primary transition-colors">
                Campus<span className="text-amber-500 dark:text-amber-400">Cart</span>
              </span>
              {subtitle && (
                <span className="text-[11px] font-semibold text-muted-foreground leading-none mt-0.5">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>
      ) : variant === 'icon' ? (
        <div className="relative flex items-center justify-center shrink-0">
          <Image
            src="/images/logo/logo-icon.png"
            alt="CampusCart"
            width={currentSize.icon}
            height={currentSize.icon}
            priority={priority}
            className={cn(
              'object-contain transition-transform group-hover:scale-105 filter drop-shadow-xs',
              imageClassName
            )}
            style={{ width: currentSize.icon, height: currentSize.icon }}
          />
        </div>
      ) : (
        /* combined: 3D logo icon + stylized typography */
        <div className="flex items-center gap-2.5">
          <div
            className="relative flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{ width: currentSize.icon, height: currentSize.icon }}
          >
            <Image
              src="/images/logo/logo-icon.png"
              alt="CampusCart"
              width={currentSize.icon}
              height={currentSize.icon}
              priority={priority}
              className={cn('object-contain filter drop-shadow-sm', imageClassName)}
            />
          </div>
          {showText && (
            <div className="flex flex-col justify-center">
              <span
                className={cn(
                  'font-display font-black tracking-tight text-foreground leading-none group-hover:text-primary transition-colors',
                  size === 'xs' && 'text-base',
                  size === 'sm' && 'text-lg',
                  size === 'md' && 'text-xl sm:text-2xl',
                  size === 'lg' && 'text-2xl sm:text-3xl',
                  size === 'xl' && 'text-3xl sm:text-4xl',
                  size === '2xl' && 'text-4xl sm:text-5xl'
                )}
              >
                Campus<span className="text-amber-500 dark:text-amber-400">Cart</span>
              </span>
              {subtitle && (
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground tracking-wider uppercase leading-none mt-1">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
