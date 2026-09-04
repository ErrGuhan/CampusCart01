'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, ShoppingCart, Heart, Menu, Store, User,
  LayoutDashboard, Package, LogOut, Settings, ShieldCheck, Shield,
  MessageSquare, Bell, Sparkles, HelpCircle, ArrowRight, Plus,
  ShoppingBag, Tag, Recycle, Zap, X, ChevronDown, Download, Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { useCart } from '@/components/cart-provider';
import { usePWAContext } from '@/components/pwa-provider';
import { ThemeToggle, ThemeSegmentedToggle } from '@/components/theme-toggle';
import { SearchCommand } from '@/components/search-command';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getNotifications } from '@/lib/firebase-queries';

const navItems = [
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/used', label: 'Used', icon: Recycle, badge: 'Save' },
  { href: '/services', label: 'Freelance', icon: Sparkles, badge: 'Earn' },
  { href: '/requests', label: 'Requests', icon: Tag, badge: 'Live' },
  { href: '/deals', label: 'Deals', icon: Zap, badge: 'Hot' },
  { href: '/community', label: 'Community', icon: MessageSquare },
];


import { useRealtimeSync } from '@/components/realtime-provider';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCommandOpen, setSearchCommandOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const { totalItems } = useCart();
  const { isInstallable, isInstalled, isIOS, promptInstall, openInstallDialog } = usePWAContext();
  const { isConnected, unreadCount } = useRealtimeSync();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Real-time unread notifications sync
  useEffect(() => {
    if (!user) {
      setUnreadNotifs(0);
      return;
    }
    const syncNotifs = async () => {
      try {
        const notifs = await getNotifications(user.uid);
        setUnreadNotifs(notifs.filter((n) => !n.isRead).length);
      } catch {}
    };
    syncNotifs();

    let unsubscribe = () => {};
    try {
      const q = query(
        collection(db, 'users', user.uid, 'notifications'),
        orderBy('createdAt', 'desc')
      );
      unsubscribe = onSnapshot(q, (snap) => {
        let count = 0;
        snap.forEach((d) => {
          if (!d.data().isRead) count++;
        });
        setUnreadNotifs(count);
      }, () => {});
    } catch {}

    window.addEventListener('campuscart_notification_updated', syncNotifs);
    window.addEventListener('storage', syncNotifs);
    return () => {
      unsubscribe();
      window.removeEventListener('campuscart_notification_updated', syncNotifs);
      window.removeEventListener('storage', syncNotifs);
    };
  }, [user]);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      router.push('/marketplace');
      return;
    }
    router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
  }

  const initials = profile?.display_name
    ? profile.display_name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CC';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-200',
        'border-b border-border/70 bg-card/85 dark:bg-card/75 backdrop-blur-xl shadow-xs'
      )}
    >
      <div className="px-3 sm:px-4 lg:px-6 mx-auto max-w-7xl w-full min-w-0">
        {/* Auto-Adjusting Responsive Header Bar for Every Screen */}
        <div className="flex h-16 items-center justify-between w-full gap-2 sm:gap-3 min-w-0">
          {/* Left: Mobile Menu + Blue Squircle Logo + Bold CampusCart text */}
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 shrink-0 min-w-0">
            {/* Mobile Sheet Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="md:hidden flex items-center justify-center h-9 w-9 xs:h-9.5 xs:w-9.5 rounded-xl text-foreground hover:bg-secondary active:scale-95 transition-all shrink-0"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5 xs:h-5.5 xs:w-5.5 stroke-[2.2]" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[88vw] max-w-sm p-0 flex flex-col bg-card/95 dark:bg-card/95 backdrop-blur-xl border-r border-border/80">
                <div className="p-5 border-b border-border/80 bg-card/90">
                  <div className="flex items-center justify-between">
                    <Link
                      href="/"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 group"
                    >
                      <div className="relative flex h-10 w-10 items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Image
                          src="/images/logo/logo-icon.png"
                          alt="CampusCart"
                          width={40}
                          height={40}
                          priority
                          className="object-contain w-full h-full filter drop-shadow-xs"
                        />
                      </div>
                      <div>
                        <span className="font-display text-xl font-black tracking-tight text-foreground block leading-tight">
                          Campus<span className="text-amber-500 dark:text-amber-400">Cart</span>
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground block leading-none mt-0.5">
                          SVCET Student Hub
                        </span>
                      </div>
                    </Link>
                  </div>

                  {user && profile ? (
                    <div className="mt-4 flex items-center gap-3.5 pt-3.5 border-t border-border/60">
                      <Avatar className="h-11 w-11 ring-2 ring-primary/20 shrink-0">
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                        <AvatarFallback className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="font-extrabold text-sm truncate text-foreground leading-tight">{profile.display_name}</p>
                          {isAdmin ? (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-primary/15 text-primary shrink-0">
                              Admin
                            </span>
                          ) : profile?.is_seller ? (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
                              Seller
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{profile.email}</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Search in Mobile Menu */}
                  <form
                    onSubmit={(e) => {
                      setMobileOpen(false);
                      handleSearchSubmit(e);
                    }}
                    className="relative"
                  >
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search books, kits, skills..."
                      className="pl-10 pr-3 h-11 rounded-xl bg-secondary/60 text-sm border-border/60"
                    />
                  </form>

                  {/* Core Navigation */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                      Campus Marketplace
                    </div>
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all touch-target',
                            active
                              ? 'bg-primary text-primary-foreground shadow-xs'
                              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-3.5">
                            <Icon className="h-4.5 w-4.5 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={cn(
                                'text-[11px] font-bold px-2 py-0.5 rounded-full',
                                active
                                  ? 'bg-primary-foreground/20 text-primary-foreground'
                                  : 'bg-primary/10 text-primary'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                    {/* PWA Install Trigger in Mobile Sheet */}
                    {!isInstalled && (
                      <div className="pt-1 pb-1">
                        <button
                          type="button"
                          onClick={() => {
                            setMobileOpen(false);
                            if (isIOS) openInstallDialog();
                            else promptInstall();
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-primary/15 to-cyan-500/10 border border-primary/25 text-foreground hover:bg-primary/20 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                              <Download className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold leading-tight flex items-center gap-1.5">
                                Install CampusCart App
                              </p>
                              <p className="text-[10px] text-muted-foreground">Fast, offline mode & native feel</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                            {isIOS ? 'Guide' : 'Install'}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Theme Appearance in Mobile Sheet */}
                    <div className="pt-2 pb-1 space-y-1.5">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                        Appearance
                      </div>
                      <ThemeSegmentedToggle />
                    </div>
                  </div>

                  <div className="h-px bg-border my-2" />

                  {/* Account / User Section */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                      Student Account
                    </div>
                    {user ? (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                        >
                          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                            <LayoutDashboard className="h-4.5 w-4.5" />
                          </div>
                          <span>Student Dashboard</span>
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                        >
                          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Package className="h-4.5 w-4.5" />
                          </div>
                          <span>My Orders & Pickups</span>
                        </Link>
                        <Link
                          href="/messages"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                              <MessageSquare className="h-4.5 w-4.5" />
                            </div>
                            <span>Campus Messages</span>
                          </div>
                        </Link>
                        <Link
                          href="/notifications"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                              <Bell className="h-4.5 w-4.5" />
                            </div>
                            <span>Notifications</span>
                          </div>
                          {unreadNotifs > 0 && (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-2xs">
                              {unreadNotifs}
                            </span>
                          )}
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-bold text-primary bg-primary/10 transition-all"
                          >
                            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0">
                              <ShieldCheck className="h-4.5 w-4.5" />
                            </div>
                            <span>Admin Control Center</span>
                          </Link>
                        )}
                        {profile?.is_seller ? (
                          <Link
                            href="/seller/dashboard"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 transition-all"
                          >
                            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
                              <Store className="h-4.5 w-4.5" />
                            </div>
                            <span>Seller Studio Dashboard</span>
                          </Link>
                        ) : (
                          <Link
                            href="/account/settings"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-bold text-primary bg-primary/10 transition-all"
                          >
                            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0">
                              <Sparkles className="h-4.5 w-4.5" />
                            </div>
                            <span>Become a Student Seller</span>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setMobileOpen(false);
                            handleSignOut();
                          }}
                          className="w-full flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-all text-left"
                        >
                          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
                            <LogOut className="h-4.5 w-4.5" />
                          </div>
                          <span>Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <div className="pt-1 space-y-2.5">
                        <Link
                          href="/login"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center rounded-xl px-4 py-3 text-sm font-bold border border-border bg-card hover:bg-secondary transition-all"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center rounded-xl px-4 py-3 text-sm font-bold bg-primary text-primary-foreground shadow-xs transition-all"
                        >
                          Join CampusCart
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 shrink-0 group min-w-0">
              <div className="relative flex h-8.5 w-8.5 xs:h-9 xs:w-9 sm:h-10 sm:w-10 items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Image
                  src="/images/logo/logo-icon.png"
                  alt="CampusCart Logo"
                  width={40}
                  height={40}
                  priority
                  className="object-contain w-full h-full filter drop-shadow-xs"
                />
              </div>
              <span className="font-display text-base xs:text-lg sm:text-xl md:text-2xl font-black tracking-tight text-foreground leading-none">
                Campus<span className="text-amber-500 dark:text-amber-400">Cart</span>
              </span>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links in a Sleek Floating Island */}
          <nav className="hidden xl:flex items-center p-1 rounded-full bg-secondary/35 dark:bg-secondary/25 border border-border/50 backdrop-blur-md shadow-2xs shrink-0">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative px-3 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 shrink-0 select-none',
                    active
                      ? 'bg-background text-foreground font-bold shadow-xs border border-border/60 dark:border-border/40'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/40 font-medium'
                  )}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    item.badge === 'Live' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 leading-none">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {item.badge}
                      </span>
                    ) : item.badge === 'Hot' ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 leading-none">
                        {item.badge}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary leading-none">
                        {item.badge}
                      </span>
                    )
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Instant Command Search Trigger */}
          <div className="hidden lg:flex items-center w-36 xl:w-48 2xl:w-60 shrink-0">
            <button
              type="button"
              onClick={() => setSearchCommandOpen(true)}
              className="relative flex h-9 w-full items-center justify-between rounded-full bg-secondary/45 hover:bg-secondary/70 px-3 text-xs text-muted-foreground border border-border/50 hover:border-border/80 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                <span className="truncate text-muted-foreground/80 font-medium">Search campus...</span>
              </div>
              <kbd className="hidden xl:inline-flex items-center gap-0.5 rounded-md border border-border/70 bg-background/90 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground/80 shadow-2xs">
                <span>⌘</span>K
              </kbd>
            </button>
          </div>

          {/* Right Action Icons - Structured Modular Architecture */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Mobile Search Toggle */}
            <button
              type="button"
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-full text-foreground hover:bg-secondary active:scale-95 transition-all shrink-0"
              onClick={() => setSearchCommandOpen(true)}
              aria-label="Open campus search"
              title="Search (⌘K)"
            >
              <Search className="h-4.5 w-4.5 stroke-[2]" />
            </button>

            {/* Quick Access: Admin Approval Center (Desktop 2xl) */}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hidden 2xl:inline-flex rounded-full text-xs font-bold border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 h-9 px-3 gap-1.5 shrink-0 shadow-2xs"
              >
                <Link href="/admin">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </Link>
              </Button>
            )}

            {/* Primary Action: Sell Button */}
            {user && (
              <Button
                size="sm"
                asChild
                className="hidden sm:inline-flex rounded-full text-xs font-bold h-9 px-3.5 gap-1.5 btn-gradient-primary text-white shadow-2xs hover:shadow-md hover:brightness-105 active:scale-95 transition-all shrink-0"
              >
                <Link href="/seller/dashboard/products">
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Sell</span>
                </Link>
              </Button>
            )}

            {/* Vertical Divider after Action CTA */}
            {user && <div className="hidden sm:block h-4.5 w-px bg-border/70 mx-1 shrink-0" />}

            {/* Utility Icons Dock */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {/* Desktop Messages shortcut */}
              {user && (
                <Link
                  href="/messages"
                  aria-label="Campus Messages"
                  title="Campus Messages"
                  className="hidden xl:flex relative items-center justify-center h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/70 active:scale-95 transition-all shrink-0"
                >
                  <MessageSquare className="h-4.5 w-4.5 stroke-[1.8]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground ring-2 ring-background shadow-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Desktop Notifications shortcut */}
              {user && (
                <Link
                  href="/notifications"
                  aria-label="Notifications"
                  title="Notifications"
                  className="hidden md:flex relative items-center justify-center h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/70 active:scale-95 transition-all shrink-0"
                >
                  <Bell className="h-4.5 w-4.5 stroke-[1.8]" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-background shadow-xs animate-pulse">
                      {unreadNotifs > 9 ? '9+' : unreadNotifs}
                    </span>
                  )}
                </Link>
              )}

              {/* Wishlist */}
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                title="Saved Wishlist"
                className="hidden 2xl:flex items-center justify-center h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/70 active:scale-95 transition-all shrink-0"
              >
                <Heart className="h-4.5 w-4.5 stroke-[1.8]" />
              </Link>

              {/* Desktop Theme Switcher */}
              <div className="hidden lg:flex items-center shrink-0">
                <ThemeToggle variant="button" className="h-9 w-9" />
              </div>

              {/* Cart Button with Counter - Always Visible */}
              <Link
                href="/cart"
                aria-label="Shopping Cart"
                title="Shopping Cart"
                className="relative flex items-center justify-center h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/70 active:scale-95 transition-all shrink-0"
              >
                <ShoppingCart className="h-4.5 w-4.5 stroke-[1.8]" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-background shadow-xs animate-badge-pulse">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>
            </div>

            {/* Vertical Divider before Profile */}
            <div className="h-4.5 w-px bg-border/70 mx-1 shrink-0" />

            {/* User Account / Profile dropdown or Login buttons - Always Visible */}
            {loading ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse shrink-0" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative flex items-center justify-center h-9 w-9 rounded-full ring-2 ring-border/80 hover:ring-primary/60 focus:ring-primary/60 transition-all duration-200 overflow-hidden shadow-2xs group shrink-0 cursor-pointer"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-full w-full">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} className="h-full w-full object-cover" />
                      )}
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  collisionPadding={12}
                  className="w-[calc(100vw-24px)] max-w-[320px] rounded-2xl sm:rounded-3xl p-2.5 shadow-2xl border border-border/80 bg-popover/98 backdrop-blur-xl animate-in fade-in-50 zoom-in-95"
                >
                  {/* User Profile Header Card - Clicking opens Profile & Settings */}
                  <DropdownMenuItem asChild className="p-0 rounded-2xl mb-1.5 focus:bg-transparent cursor-pointer">
                    <Link
                      href="/account/settings"
                      className="p-3 rounded-2xl bg-secondary/50 hover:bg-secondary/80 border border-border/40 flex items-center gap-3 transition-colors w-full"
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-primary/25 shrink-0">
                        {profile?.avatar_url && (
                          <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                        )}
                        <AvatarFallback className="text-sm font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-sm font-extrabold text-foreground truncate leading-tight">
                            {profile?.display_name || 'Student'}
                          </p>
                          {isAdmin ? (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-primary/15 text-primary shrink-0">
                              Admin
                            </span>
                          ) : profile?.is_seller ? (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
                              Seller
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
                              Student
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                          {profile?.email}
                        </p>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <div className="space-y-0.5">
                    {/* Student Dashboard */}
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-0 focus:bg-transparent">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary active:scale-[0.98] transition-all"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                          <LayoutDashboard className="h-4.5 w-4.5" />
                        </div>
                        <span>Student Dashboard</span>
                      </Link>
                    </DropdownMenuItem>

                    {/* My Orders */}
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-0 focus:bg-transparent">
                      <Link
                        href="/account/orders"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary active:scale-[0.98] transition-all"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Package className="h-4.5 w-4.5" />
                        </div>
                        <span>My Orders</span>
                      </Link>
                    </DropdownMenuItem>

                    {/* Campus Messages */}
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-0 focus:bg-transparent">
                      <Link
                        href="/messages"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary active:scale-[0.98] transition-all"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                          <MessageSquare className="h-4.5 w-4.5" />
                        </div>
                        <span>Campus Messages</span>
                      </Link>
                    </DropdownMenuItem>

                    {/* Product Requests */}
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-0 focus:bg-transparent">
                      <Link
                        href="/requests"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary active:scale-[0.98] transition-all"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                          <Sparkles className="h-4.5 w-4.5" />
                        </div>
                        <span>Product Requests</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="my-1.5" />
                      <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-0 focus:bg-transparent">
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-primary/10 text-primary hover:bg-primary/15 active:scale-[0.98] transition-all"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0">
                            <ShieldCheck className="h-4.5 w-4.5" />
                          </div>
                          <span>Admin Control Center</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {profile?.is_seller ? (
                    <>
                      <DropdownMenuSeparator className="my-1.5" />
                      <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-0 focus:bg-transparent">
                        <Link
                          href="/seller/dashboard"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 active:scale-[0.98] transition-all"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
                            <Store className="h-4.5 w-4.5" />
                          </div>
                          <span>Seller Studio</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuSeparator className="my-1.5" />
                      <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-0 focus:bg-transparent">
                        <Link
                          href="/account/settings"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-primary/10 text-primary hover:bg-primary/15 active:scale-[0.98] transition-all"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0">
                            <Store className="h-4.5 w-4.5" />
                          </div>
                          <span>Become a Seller</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {!isInstalled && (
                    <>
                      <DropdownMenuSeparator className="my-1.5" />
                      <DropdownMenuItem
                        onClick={() => {
                          if (isIOS) openInstallDialog();
                          else promptInstall();
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                          <Download className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex items-center justify-between flex-1">
                          <span>Install CampusCart</span>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                            App
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Theme Selector inside Dropdown */}
                  <DropdownMenuSeparator className="my-1.5" />
                  <div className="px-2 py-1.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                      Theme
                    </p>
                    <ThemeSegmentedToggle />
                  </div>

                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
                      <LogOut className="h-4.5 w-4.5" />
                    </div>
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Mobile User Icon shortcut for guests */}
                <Link
                  href="/login"
                  aria-label="Sign in to your account"
                  className="sm:hidden flex items-center justify-center h-9 w-9 xs:h-9.5 xs:w-9.5 rounded-full text-foreground hover:bg-secondary active:scale-95 transition-all shrink-0"
                >
                  <User className="h-4.5 w-4.5 xs:h-5 xs:w-5 stroke-[1.8]" />
                </Link>
                {/* Desktop Sign In / Join buttons */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" asChild className="rounded-full text-xs h-9 px-3.5 hover:bg-secondary/70">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild className="btn-gradient-primary rounded-full text-xs h-9 px-4 shadow-xs font-bold text-white hover:brightness-105 active:scale-95 transition-all">
                    <Link href="/register">Join Campus</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Search Input */}
        {mobileSearchOpen && (
          <form
            onSubmit={(e) => {
              setMobileSearchOpen(false);
              handleSearchSubmit(e);
            }}
            className="pb-3 pt-1 md:hidden animate-fade-in"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, notes, gigs..."
                className="pl-9 pr-16 h-9 rounded-xl bg-secondary/60 text-xs border-border/60"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2.5 rounded-lg text-xs font-semibold"
              >
                Search
              </Button>
            </div>
          </form>
        )}

      </div>

      {/* Global Instant Command Search Dialog */}
      <SearchCommand open={searchCommandOpen} onOpenChange={setSearchCommandOpen} />
    </header>
  );
}
