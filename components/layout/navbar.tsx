'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, ShoppingCart, Heart, Menu, Store, User,
  LayoutDashboard, Package, LogOut, Settings, ShieldCheck, Shield,
  MessageSquare, Bell, Sparkles, HelpCircle, ArrowRight,
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

const mobileQuickChips = [
  { href: '/marketplace', label: 'Marketplace', icon: '🛍️' },
  { href: '/used', label: 'Used & Pre-Owned', icon: '♻️' },
  { href: '/services', label: 'Freelance Gigs', icon: '⚡' },
  { href: '/requests', label: 'Need / Requests', icon: '🙋' },
  { href: '/deals', label: 'Deals < ₹199', icon: '🔥' },
  { href: '/categories', label: 'All Categories', icon: '📂' },
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
        scrolled
          ? 'border-b border-border/80 bg-background/95 backdrop-blur-2xl shadow-xs'
          : 'border-b border-border/50 bg-background/95 backdrop-blur-md'
      )}
    >
      <div className="container-px mx-auto max-w-7xl w-full min-w-0">
        {/* Main Desktop & Mobile Header Bar - Slightly taller & more spacious */}
        <div className="flex h-16 sm:h-18 items-center justify-between gap-3 sm:gap-5">
          {/* Left: Mobile Sheet Trigger + Logo */}
          <div className="flex items-center gap-2.5">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-10 w-10 rounded-2xl hover:bg-secondary active:scale-95 transition-transform"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs p-0 flex flex-col bg-background">
                <div className="p-5 border-b border-border bg-gradient-to-br from-primary/10 via-background to-secondary/30">
                  <div className="flex items-center justify-between">
                    <Link
                      href="/"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold shadow-xs">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-display text-xl font-extrabold tracking-tight block leading-tight">
                          CampusCart
                        </span>
                        <span className="text-[11px] font-semibold text-primary block leading-none mt-0.5">
                          SVCET Student Hub
                        </span>
                      </div>
                    </Link>
                  </div>

                  {user && profile ? (
                    <div className="mt-4 flex items-center gap-3 pt-3 border-t border-border/60">
                      <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs truncate text-foreground">{profile.display_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{profile.email}</p>
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search books, kits, skills..."
                      className="pl-9 pr-3 h-10 rounded-xl bg-secondary/60 text-xs border-border/60"
                    />
                  </form>

                  {/* Core Navigation */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">
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
                            'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all touch-target',
                            active
                              ? 'bg-primary text-primary-foreground shadow-xs'
                              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={cn(
                                'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
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
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">
                      Student Account
                    </div>
                    {user ? (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                        >
                          <LayoutDashboard className="h-4 w-4 text-primary" />
                          Student Dashboard
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                        >
                          <Package className="h-4 w-4 text-emerald-500" />
                          My Orders & Pickups
                        </Link>
                        <Link
                          href="/messages"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                        >
                          <MessageSquare className="h-4 w-4 text-indigo-500" />
                          Campus Messages
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-primary bg-primary/10 transition-all"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Admin Control Center
                          </Link>
                        )}
                        {profile?.is_seller ? (
                          <Link
                            href="/seller/dashboard"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-amber-600 bg-amber-500/10 transition-all"
                          >
                            <Store className="h-4 w-4" />
                            Seller Studio Dashboard
                          </Link>
                        ) : (
                          <Link
                            href="/account/settings"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-primary bg-primary/10 transition-all"
                          >
                            <Sparkles className="h-4 w-4" />
                            Become a Student Seller
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setMobileOpen(false);
                            handleSignOut();
                          }}
                          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-all text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <div className="pt-1 space-y-2">
                        <Link
                          href="/login"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold border border-border bg-card hover:bg-secondary transition-all"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold bg-primary text-primary-foreground shadow-xs transition-all"
                        >
                          Join CampusCart
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Brand Logo & College Tag */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold shadow-sm group-hover:scale-105 transition-transform">
                <Store className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl sm:text-2xl font-black tracking-tight text-foreground leading-none">
                  CampusCart
                </span>
                <span className="text-[11px] font-bold text-primary leading-none mt-0.5 hidden xs:block">
                  SVCET Marketplace
                </span>
              </div>
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
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
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
            className="hidden md:flex flex-1 max-w-xs lg:max-w-sm mx-2"
          >
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, gigs, notes..."
                className="pl-9 pr-8 h-10 rounded-2xl bg-secondary/50 border-transparent hover:bg-secondary/70 focus-visible:bg-background focus-visible:border-input text-xs transition-all"
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

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 rounded-2xl active:scale-95"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              aria-label="Toggle mobile search"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Desktop Messages shortcut */}
            <Button variant="ghost" size="icon" asChild className="hidden sm:flex h-10 w-10 rounded-2xl">
              <Link href="/messages" aria-label="Campus Messages">
                <MessageSquare className="h-5 w-5" />
              </Link>
            </Button>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" asChild className="hidden sm:flex h-10 w-10 rounded-2xl">
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>

            {/* Cart Button with Counter */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="relative h-10 w-10 rounded-2xl hover:bg-secondary active:scale-95"
            >
              <Link href="/cart" aria-label="Shopping Cart">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs animate-scale-in">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>
            </Button>

            {/* User Account / Profile dropdown or Login buttons */}
            {loading ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse ml-1" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="ml-1 flex items-center gap-1.5 rounded-full p-0.5 ring-offset-background transition-all hover:ring-2 hover:ring-primary/40 focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-9 w-9 sm:h-9.5 sm:w-9.5">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                      )}
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1.5 shadow-xl">
                  <DropdownMenuLabel className="p-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">{profile?.display_name}</span>
                      <span className="text-[10px] font-medium text-muted-foreground truncate">
                        {profile?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href="/dashboard" className="flex items-center text-xs">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
                      Student Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href="/account" className="flex items-center text-xs">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href="/account/orders" className="flex items-center text-xs">
                      <Package className="mr-2 h-4 w-4 text-emerald-500" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href="/messages" className="flex items-center text-xs">
                      <MessageSquare className="mr-2 h-4 w-4 text-indigo-500" />
                      Campus Messages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link href="/requests" className="flex items-center text-xs">
                      <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                      Product Requests Board
                    </Link>
                  </DropdownMenuItem>

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-xl cursor-pointer bg-primary/5 text-primary font-semibold">
                        <Link href="/admin" className="flex items-center text-xs">
                          <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                          Admin Control Center
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {profile?.is_seller ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-xl cursor-pointer bg-amber-500/10 text-amber-600 font-semibold">
                        <Link href="/seller/dashboard" className="flex items-center text-xs">
                          <Store className="mr-2 h-4 w-4" />
                          Seller Studio
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-primary font-semibold">
                        <Link href="/account/settings" className="flex items-center text-xs">
                          <Store className="mr-2 h-4 w-4" />
                          Become a Seller
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="rounded-xl cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs h-9 px-3">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="rounded-xl text-xs h-9 px-3.5 shadow-xs font-bold">
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
            className="pb-3.5 pt-1 md:hidden animate-fade-in"
          >
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search textbooks, drawing boards, projects, gigs..."
                className="pl-10 pr-8 h-11 rounded-2xl bg-secondary/80 text-xs border-border/80 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        )}

        {/* Mobile Quick Category Horizontal Carousel Strip - Slightly larger and spacious */}
        <div className="w-full min-w-0 flex sm:hidden items-center gap-2 overflow-x-auto pb-2.5 pt-0.5 scrollbar-none">
          {mobileQuickChips.map((chip) => {
            const active = pathname === chip.href;
            return (
              <Link
                key={chip.href}
                href={chip.href}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-95 shadow-2xs',
                  active
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/60'
                )}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
