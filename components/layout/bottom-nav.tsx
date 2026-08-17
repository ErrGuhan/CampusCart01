'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, ShoppingBag, Sparkles, Tag, User, Store,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useCart } from '@/components/cart-provider';
import { useSwipe } from '@/components/layout/swipe-context';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { totalItems } = useCart();
  const swipe = useSwipe();

  // Dynamic route: Authenticated users -> Seller Studio Dashboard; Visitors -> Public Creator Directory
  const studioHref = user ? '/seller/dashboard' : '/studio';

  // Strict order: [Market, Freelance, Home, Requests, Studio]
  const items = [
    {
      href: '/marketplace',
      label: 'Market',
      icon: ShoppingBag,
      panelIndex: 0,
    },
    {
      href: '/services',
      label: 'Freelance',
      icon: Sparkles,
      panelIndex: 1,
    },
    {
      href: '/',
      label: 'Home',
      icon: Home,
      panelIndex: 2,
    },
    {
      href: '/requests',
      label: 'Requests',
      icon: Tag,
      panelIndex: 3,
    },
    {
      href: studioHref,
      label: 'Studio',
      icon: profile?.is_seller ? Store : User,
      panelIndex: 4,
    },
  ];

  const isSwipeActive = swipe?.isSwipeActive && pathname === '/';

  const handleNavClick = (e: React.MouseEvent, panelIndex: number) => {
    if (isSwipeActive && window.innerWidth <= 768) {
      e.preventDefault();
      swipe?.scrollToPanel(panelIndex, true);
    }
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-2xl border-t border-border/80 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom,0.25rem)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1.5">
        {items.map((item) => {
          const isStudioActive = item.label === 'Studio' && (pathname.startsWith('/seller') || pathname === '/studio');
          const isActive = isSwipeActive
            ? swipe?.activeIndex === item.panelIndex
            : item.href === '/'
            ? pathname === '/'
            : isStudioActive || pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.panelIndex)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-1 rounded-2xl transition-all relative select-none active:scale-90',
                isActive
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    'h-5.5 w-5.5 transition-transform duration-200',
                    isActive && 'scale-110 text-primary'
                  )}
                />
                {item.label === 'Market' && totalItems > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 px-0.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] tracking-tight leading-none',
                  isActive ? 'font-bold text-primary' : 'font-medium'
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 h-1 w-5 rounded-full bg-primary animate-scale-in" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

