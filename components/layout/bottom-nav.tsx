'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Sparkles, ShoppingCart, User, Store } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useCart } from '@/components/cart-provider';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { totalItems } = useCart();

  const items = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/marketplace', label: 'Market', icon: ShoppingBag },
    { href: '/services', label: 'Services', icon: Sparkles },
    { href: '/cart', label: 'Cart', icon: ShoppingCart, badge: totalItems },
    {
      href: user ? (profile?.is_seller ? '/seller/dashboard' : '/account') : '/login',
      label: user ? (profile?.is_seller ? 'Studio' : 'Profile') : 'Sign In',
      icon: profile?.is_seller ? Store : User,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0)]">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-all py-1 rounded-xl relative select-none active:scale-95',
                isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative flex items-center justify-center">
                <item.icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground animate-in zoom-in">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] tracking-tight', isActive ? 'font-bold' : 'font-medium')}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 h-1 w-5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
