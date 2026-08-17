'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingBag, Settings,
  Store, TrendingUp, Sparkles, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/seller/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/seller/dashboard/products', label: 'Products', icon: Package },
  { href: '/seller/dashboard/services', label: 'Freelance Gigs', icon: Sparkles },
  { href: '/seller/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/seller/dashboard/settings', label: 'Store Settings', icon: Settings },
];

export function SellerSidebar() {
  const pathname = usePathname();
  const { profile, isAdmin } = useAuth();

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'CC';

  return (
    <>
      {/* Mobile Horizontal Navigation Tabs */}
      <div className="lg:hidden mb-5 w-full overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold shrink-0 transition-colors border border-primary/20',
                pathname.startsWith('/admin')
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-primary/10 text-primary'
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Admin Approvals
            </Link>
          )}
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/seller/dashboard' && pathname.startsWith(item.href));
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
                {profile?.display_name || 'Seller'}
              </p>
              <p className="text-xs text-muted-foreground truncate">@{profile?.username || 'seller'}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              <Store className="h-3 w-3 mr-1" />
              Seller
            </Badge>
            {profile?.is_verified && (
              <Badge className="bg-success/10 text-success hover:bg-success/10">
                Verified
              </Badge>
            )}
          </div>
        </div>

        <nav className="space-y-1">
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors mb-2 border border-primary/20',
                pathname.startsWith('/admin')
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-primary/10 text-primary hover:bg-primary/15'
              )}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Admin Approvals
            </Link>
          )}
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/seller/dashboard' && pathname.startsWith(item.href));
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

        <div className="rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-xs font-semibold">Store Performance</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Keep your products active and respond to orders quickly to maintain a high rating.
          </p>
        </div>
      </div>
    </>
  );
}
