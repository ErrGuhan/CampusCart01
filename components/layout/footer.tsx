'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Store, Instagram, Twitter, Linkedin, Mail, ShieldCheck, Heart, MapPin } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { ThemeToggle } from '@/components/theme-toggle';

export function Footer() {
  const { profile, user } = useAuth();

  const footerSections = [
    {
      title: 'Marketplace',
      links: [
        { href: '/marketplace', label: 'All Products' },
        { href: '/used', label: 'Used & Pre-Owned' },
        { href: '/deals', label: 'Student Deals' },
        { href: '/categories', label: 'Categories' },
      ],
    },
    {
      title: 'Freelance & Gigs',
      links: [
        { href: '/services', label: 'Hire Student Talent' },
        { href: '/requests', label: 'Product Requests' },
        { href: '/seller/dashboard/services', label: 'Offer a Service' },
        { href: '/sellers', label: 'Campus Creators' },
      ],
    },
    {
      title: 'Community',
      links: [
        { href: '/community', label: 'Campus Feed' },
        { href: '/events', label: 'Events & Hackathons' },
        { href: '/how-it-works', label: 'How It Works' },
        { href: '/requests', label: 'What Students Need' },
      ],
    },
    {
      title: 'Student Hub',
      links: [
        { href: user ? '/dashboard' : '/login', label: user ? 'Student Dashboard' : 'Sign In' },
        { href: user ? '/account/orders' : '/register', label: user ? 'My Orders' : 'Join CampusCart' },
        { href: '/messages', label: 'Messages' },
        { href: 'mailto:campuscartsvcet@gmail.com?subject=CampusCart%20Support%20%26%20Feedback', label: 'Help & Feedback' },
      ],
    },
  ];

  return (
    <footer className="border-t border-border/80 bg-card/60 backdrop-blur-xl mt-16 sm:mt-24 pb-24 md:pb-12 w-full">
      <div className="container-px mx-auto max-w-7xl py-12 sm:py-16 w-full">
        
        {/* Top Trust Banner with Frosted Micro-Cards */}
        <div className="mb-12 pb-10 border-b border-border/60 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-left">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 backdrop-blur-md shadow-2xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-foreground leading-tight">Student Verified</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Exclusive to college peers</p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 backdrop-blur-md shadow-2xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-foreground leading-tight">Campus Handover</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Safe college pickup points</p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 backdrop-blur-md shadow-2xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-foreground leading-tight">Zero Platform Fees</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Keep 100% of earnings</p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 backdrop-blur-md shadow-2xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-foreground leading-tight">Circular Campus</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Pass down books & kits</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Image
                  src="/images/logo/logo-icon.png"
                  alt="CampusCart Logo"
                  width={44}
                  height={44}
                  className="object-contain w-full h-full filter drop-shadow-sm"
                />
              </div>
              <span className="font-display text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Campus<span className="text-amber-500 dark:text-amber-400">Cart</span>
              </span>
            </Link>
            <p className="mt-3.5 text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed font-medium">
              The official student marketplace, freelance hub, and request board for Sri Venkateswara College of Engineering and Technology.
            </p>

            {/* Official Feedback Contact Badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-secondary/60 border border-border/80 px-3.5 py-2 text-xs text-muted-foreground shadow-2xs backdrop-blur-md">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span>Feedback: </span>
              <a
                href="mailto:campuscartsvcet@gmail.com"
                className="font-bold text-foreground hover:text-primary transition-colors underline decoration-primary/40 underline-offset-2"
              >
                campuscartsvcet@gmail.com
              </a>
            </div>

            <div className="mt-5 flex items-center gap-2.5">
              {[
                { Icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
                { Icon: Twitter, label: 'Twitter', href: 'https://x.com' },
                { Icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
                { Icon: Mail, label: 'Email Feedback', href: 'mailto:campuscartsvcet@gmail.com' },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-card text-muted-foreground hover:text-primary hover:border-primary/40 hover:scale-105 active:scale-95 transition-all shadow-2xs backdrop-blur-md"
                >
                  <Icon className="h-4.5 w-4.5" />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title} className="col-span-1">
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight">
                {section.title}
              </h3>
              <ul className="mt-3.5 space-y-2.5">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors block py-0.5 font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground text-center sm:text-left font-medium">
            © {new Date().getFullYear()} CampusCart · Built by students for students at SVCET.
          </p>
          <div className="flex items-center gap-4 sm:gap-5 flex-wrap justify-center text-xs text-muted-foreground font-semibold">
            <Link href="/how-it-works" className="hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="/how-it-works" className="hover:text-primary transition-colors">
              Privacy & Trust
            </Link>
            <a href="mailto:campuscartsvcet@gmail.com" className="hover:text-primary transition-colors">
              Contact Support
            </a>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground/80 hidden md:inline">Theme:</span>
              <ThemeToggle variant="button" className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
