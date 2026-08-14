'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, ShoppingCart, Heart, Menu, Store, User,
  LayoutDashboard, Package, LogOut, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const navLinks = [
  { href: '/products', label: 'Products' },
  { href: '/categories', label: 'Categories' },
  { href: '/sellers', label: 'Creators' },
  { href: '/how-it-works', label: 'How It Works' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const { totalItems } = useCart();
  const router = useRouter();

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
        'sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300',
        scrolled
          ? 'border-border bg-background/80 backdrop-blur-md shadow-sm'
          : 'bg-background'
      )}
    >
      <div className="container-px mx-auto max-w-7xl">
        <div className="flex h-16 items-center gap-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">CampusCart</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors touch-target"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-3 h-px bg-border" />
                {loading ? null : user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors touch-target"
                    >
                      My Account
                    </Link>
                    {profile?.is_seller && (
                      <Link
                        href="/seller/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors touch-target"
                      >
                        Seller Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        handleSignOut();
                      }}
                      className="rounded-lg px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors touch-target"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors touch-target"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="mt-1"
                    >
                      <Button className="w-full h-10">Get Started</Button>
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              CampusCart
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex flex-1 max-w-md mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search products, creators, categories..."
                className="pl-9 pr-4 bg-secondary/50 border-transparent focus-visible:border-input focus-visible:bg-background transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/cart" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </Link>
            </Button>

            {loading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="ml-1 flex items-center gap-2 rounded-full p-0.5 ring-offset-background transition-all hover:ring-2 hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-8 w-8">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                      )}
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{profile?.display_name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {profile?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {profile?.is_seller && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/seller/dashboard" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Seller Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2 ml-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
