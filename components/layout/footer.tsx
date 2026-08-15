'use client';

import Link from 'next/link';
import { Store, Instagram, Twitter, Linkedin, Mail, ShieldCheck, Heart, MapPin } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

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
        { href: 'mailto:support@campuscart.com?subject=CampusCart%20Support', label: 'Help & Support' },
      ],
    },
  ];

  return (
    <footer className="border-t border-border/80 bg-secondary/30 mt-14 sm:mt-20 pb-20 md:pb-8">
      <div className="container-px mx-auto max-w-7xl py-10 sm:py-14">
        {/* Top Trust Banner */}
        <div className="mb-10 pb-8 border-b border-border/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">100% Student Verified</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Exclusive to verified college peers</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Campus Handover</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Meet at safe college pickup points</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Zero Platform Fees</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Keep 100% of your earnings</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Circular Campus</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Pass down items to seniors & juniors</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                <Store className="h-5 w-5" />
              </div>
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight">
                CampusCart
              </span>
            </Link>
            <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
              The official student marketplace, freelance hub, and request board for Sri Venkateswara College of Engineering and Technology.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {[
                { Icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
                { Icon: Twitter, label: 'Twitter', href: 'https://x.com' },
                { Icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
                { Icon: Mail, label: 'Email', href: 'mailto:hello@campuscart.com' },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-card text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-accent/40 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title} className="col-span-1">
              <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors block py-0.5"
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
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} CampusCart · Built by students for students at SVCET.
          </p>
          <div className="flex items-center gap-5 flex-wrap justify-center text-xs text-muted-foreground">
            <Link href="/how-it-works" className="hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="/how-it-works" className="hover:text-primary transition-colors">
              Privacy & Trust
            </Link>
            <Link href="/how-it-works" className="hover:text-primary transition-colors">
              Campus Guidelines
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
