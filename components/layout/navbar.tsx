'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, ShoppingCart, Heart, Menu, Store, User,
  LayoutDashboard, Package, LogOut, Settings, ShieldCheck, Shield,
  MessageSquare, Bell, Sparkles, HelpCircle, ArrowRight, Plus,
  ShoppingBag, Tag, Recycle, Zap, X, ChevronDown,
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

const navItems = [
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/used', label: 'Used Items', icon: Recycle, badge: 'Save' },
  { href: '/services', label: 'Freelance & Gigs', icon: Sparkles, badge: 'Earn' },
  { href: '/requests', label: 'Campus Requests', icon: Tag, badge: 'Live' },
  { href: '/deals', label: 'Deals', icon: Zap, badge: 'Hot' },
  { href: '/community', label: 'Community', icon: MessageSquare },
];


export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const { totalItems } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        'border-b border-border/60 bg-background/95 backdrop-blur-md'
      )}
    >
      <div className="px-3.5 sm:px-6 lg:px-8 mx-auto max-w-7xl w-full min-w-0">
        {/* Auto-Adjusting Responsive Header Bar for Every Screen */}
        <div className="flex h-16 sm:h-18 items-center justify-between w-full">
          {/* Left: Mobile Menu + Blue Squircle Logo + Bold CampusCart text */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl text-foreground hover:bg-secondary active:scale-95 transition-all shrink-0"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-6 w-6 stroke-[2.2]" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[88vw] max-w-sm p-0 flex flex-col bg-background">
                <div className="p-5 border-b border-border bg-card">
                  <div className="flex items-center justify-between">
                    <Link
                      href="/"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#0ea5e9] text-white font-bold shadow-2xs">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-display text-xl font-black tracking-tight text-foreground block leading-tight">
                          CampusCart
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
                          className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                        >
                          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                            <MessageSquare className="h-4.5 w-4.5" />
                          </div>
                          <span>Campus Messages</span>
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
            <Link href="/" className="flex items-center gap-2 xs:gap-2.5 shrink-0 group">
              <div className="flex h-9.5 w-9.5 xs:h-10 xs:w-10 sm:h-11 sm:w-11 items-center justify-center rounded-[12px] xs:rounded-[14px] bg-[#0ea5e9] text-white font-bold shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <Store className="h-5 w-5 xs:h-5.5 xs:w-5.5 sm:h-6 sm:w-6" />
              </div>
              <span className="font-display text-lg xs:text-xl sm:text-2xl font-black tracking-tight text-foreground leading-none">
                CampusCart
              </span>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5',
                    active
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  )}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-primary/15 text-primary text-[9px] font-extrabold px-1.5 py-0.5 leading-none">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xs lg:max-w-sm mx-3"
          >
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, gigs, notes..."
                className="pl-9 pr-8 h-10 rounded-xl bg-secondary/50 border-transparent hover:bg-secondary/70 focus-visible:bg-background focus-visible:border-input text-xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Right Action Icons - Fluid auto-adjusting targets for every phone screen size */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile Search Toggle */}
            <button
              type="button"
              className="md:hidden flex items-center justify-center h-10 w-10 rounded-full text-foreground hover:bg-secondary active:scale-95 transition-all shrink-0"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              aria-label="Toggle mobile search"
            >
              <Search className="h-5 w-5 stroke-[2.2]" />
            </button>

            {/* Quick Access: Admin Approval Center & Sell Item (Desktop) */}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hidden lg:inline-flex rounded-xl text-xs font-bold border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 h-9 px-3.5 gap-1.5"
              >
                <Link href="/admin">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Approval Center</span>
                </Link>
              </Button>
            )}

            {user && (
              <Button
                size="sm"
                asChild
                className="hidden sm:inline-flex rounded-xl text-xs font-bold h-9 px-3.5 gap-1.5 shadow-2xs"
              >
                <Link href="/seller/dashboard/products">
                  <Plus className="h-4 w-4" />
                  <span>Sell</span>
                </Link>
              </Button>
            )}

            {/* Desktop Messages shortcut */}
            <Button variant="ghost" size="icon" asChild className="hidden sm:flex h-10 w-10 rounded-full text-muted-foreground hover:text-foreground">
              <Link href="/messages" aria-label="Campus Messages">
                <MessageSquare className="h-5 w-5" />
              </Link>
            </Button>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" asChild className="hidden sm:flex h-10 w-10 rounded-full text-muted-foreground hover:text-foreground">
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>

            {/* Cart Button with Counter */}
            <Link
              href="/cart"
              aria-label="Shopping Cart"
              className="relative flex items-center justify-center h-10 w-10 rounded-full text-foreground hover:bg-secondary active:scale-95 transition-all shrink-0"
            >
              <ShoppingCart className="h-5 w-5 stroke-[1.8]" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* User Account / Profile dropdown or Login buttons */}
            {loading ? (
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-center h-10 w-10 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-primary/40 focus:outline-none shrink-0 overflow-hidden"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-primary/20 shrink-0 overflow-hidden">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} className="h-full w-full object-cover" />
                      )}
                      <AvatarFallback className="text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
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
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs h-9 px-3">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="btn-gradient-primary rounded-xl text-xs h-9 px-3.5 shadow-xs font-bold">
                  <Link href="/register">Join Campus</Link>
                </Button>
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
    </header>
  );
}
