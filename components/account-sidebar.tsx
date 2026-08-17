'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Settings, Store, Heart,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Student Hub', icon: LayoutDashboard },
  { href: '/account', label: 'Overview', icon: LayoutDashboard },
  { href: '/account/orders', label: 'My Orders', icon: Package },
  { href: '/account/settings', label: 'Profile & Settings', icon: Settings },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/cart', label: 'Cart', icon: ShoppingBag },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'CC';

  return (
    <>
      {/* Mobile Horizontal Navigation Tabs */}
      <div className="lg:hidden mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium shrink-0 transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          {profile?.is_seller && (
            <Link
              href="/seller/dashboard"
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold shrink-0 transition-colors bg-primary/10 text-primary border border-primary/20"
            >
              <Store className="h-3.5 w-3.5 shrink-0" />
              Seller Mode
            </Link>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block space-y-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {profile?.display_name || 'Student'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.email || 'Not signed in'}
              </p>
            </div>
          </div>
          {profile?.is_seller && (
            <Button variant="outline" size="sm" className="w-full mt-4" asChild>
              <Link href="/seller/dashboard">
                <Store className="h-4 w-4 mr-2" />
                Seller Dashboard
              </Link>
            </Button>
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
