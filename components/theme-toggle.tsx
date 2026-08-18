'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * Animated 1-click or dropdown Theme Toggle Button (Sun / Moon)
 */
export function ThemeToggle({
  variant = 'button',
  className,
  size = 'icon',
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={cn('relative h-10 w-10 rounded-full text-muted-foreground opacity-60', className)}
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={cn(
          'relative h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/70 active:scale-95 transition-all overflow-hidden',
          className
        )}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Current: ${theme === 'system' ? 'System' : isDark ? 'Dark' : 'Light'} (click to toggle)`}
      >
        <Sun
          className={cn(
            'h-5 w-5 transition-all duration-300 absolute',
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100 text-amber-500'
          )}
        />
        <Moon
          className={cn(
            'h-5 w-5 transition-all duration-300 absolute',
            isDark ? 'rotate-0 scale-100 opacity-100 text-sky-400' : '-rotate-90 scale-0 opacity-0'
          )}
        />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={cn('relative h-10 w-10 rounded-full text-muted-foreground hover:text-foreground', className)}
          aria-label="Select theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sky-400" />
          <span className="sr-only">Select theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl border-border/80 bg-popover/95 backdrop-blur-xl">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn('gap-2.5 font-medium cursor-pointer rounded-xl', theme === 'light' && 'bg-secondary font-bold text-primary')}
        >
          <Sun className="h-4 w-4 text-amber-500" />
          <span>Light Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn('gap-2.5 font-medium cursor-pointer rounded-xl', theme === 'dark' && 'bg-secondary font-bold text-primary')}
        >
          <Moon className="h-4 w-4 text-sky-400" />
          <span>Dark Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={cn('gap-2.5 font-medium cursor-pointer rounded-xl', theme === 'system' && 'bg-secondary font-bold text-primary')}
        >
          <Laptop className="h-4 w-4 text-muted-foreground" />
          <span>System Default</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ThemeSegmentedToggleProps {
  className?: string;
}

/**
 * 3-way Segmented Theme Switcher (Light | Dark | System)
 */
export function ThemeSegmentedToggle({ className }: ThemeSegmentedToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('grid grid-cols-3 p-1 rounded-2xl bg-secondary/50 border border-border/60 h-10', className)}>
        <div className="h-full rounded-xl bg-transparent" />
        <div className="h-full rounded-xl bg-transparent" />
        <div className="h-full rounded-xl bg-transparent" />
      </div>
    );
  }

  const options = [
    { value: 'light', label: 'Light', icon: Sun, iconColor: 'text-amber-500' },
    { value: 'dark', label: 'Dark', icon: Moon, iconColor: 'text-sky-400' },
    { value: 'system', label: 'System', icon: Laptop, iconColor: 'text-muted-foreground' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme preference selector"
      className={cn('grid grid-cols-3 p-1 rounded-2xl bg-secondary/60 border border-border/60 gap-1', className)}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 select-none active:scale-95',
              active
                ? 'bg-card text-foreground shadow-xs font-bold border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
            )}
          >
            <Icon className={cn('h-3.5 w-3.5', active ? opt.iconColor : 'text-muted-foreground')} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
