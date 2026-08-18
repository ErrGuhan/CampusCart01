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
      if (panelIndex === 2) {
        e.preventDefault();
        swipe?.scrollToPanel(2, true);
      }
    }
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-dock pb-[env(safe-area-inset-bottom,0.25rem)] transition-all"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-2">
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
              prefetch={true}
              onClick={(e) => handleNavClick(e, item.panelIndex)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-2xl transition-all relative select-none active:scale-95',
                isActive
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground/80 hover:text-foreground'
              )}
            >
              <div className={cn(
                'relative flex items-center justify-center p-1 rounded-xl transition-all',
                isActive && 'bg-primary/10 text-primary shadow-2xs'
              )}>
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  )}
                />
                {item.label === 'Market' && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground shadow-xs animate-pulse">
                    {totalItems}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] tracking-tight leading-none font-semibold',
                  isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

