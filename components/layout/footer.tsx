'use client';

import Link from 'next/link';
import { Store, Instagram, Twitter, Linkedin, Mail } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

export function Footer() {
  const { profile, user } = useAuth();

  const footerSections = [
    {
      title: 'Marketplace',
      links: [
        { href: '/products', label: 'Browse Products' },
        { href: '/categories', label: 'Categories' },
        { href: '/sellers', label: 'Student Creators' },
        { href: '/how-it-works', label: 'How It Works' },
      ],
    },
    {
      title: 'Sell',
      links: profile?.is_seller
        ? [
            { href: '/seller/dashboard', label: 'Seller Dashboard' },
            { href: '/seller/dashboard/products', label: 'Manage Products' },
            { href: '/seller/dashboard/orders', label: 'Orders' },
            { href: '/how-it-works', label: 'How It Works' },
          ]
        : [
            { href: user ? '/account/settings' : '/register', label: 'Become a Seller' },
            { href: '/seller/dashboard', label: 'Seller Dashboard' },
            { href: '/how-it-works', label: 'How It Works' },
            { href: '/products', label: 'List Your Products' },
          ],
    },
    {
      title: 'Account',
      links: [
        { href: user ? '/account' : '/login', label: user ? 'My Account' : 'Sign In' },
        { href: user ? '/account/settings' : '/register', label: user ? 'Settings' : 'Create Account' },
        { href: '/account/orders', label: 'My Orders' },
        { href: '/wishlist', label: 'Wishlist' },
      ],
    },
    {
      title: 'Help',
      links: [
        { href: '/how-it-works', label: 'Marketplace Guide' },
        { href: '/products', label: 'Buying Guide' },
        { href: 'mailto:support@campuscart.com?subject=CampusCart%20Support', label: 'Contact' },
        { href: '/how-it-works', label: 'FAQ' },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-secondary/30 mt-16 sm:mt-20">
      <div className="container-px mx-auto max-w-7xl py-10 sm:py-14">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Store className="h-5 w-5" />
              </div>
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight">
                CampusCart
              </span>
            </Link>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground max-w-xs leading-relaxed">
              A trusted marketplace where students create, discover, and support
              each other. Built by students, for students.
            </p>
            <div className="mt-4 sm:mt-5 flex items-center gap-2">
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
                  className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-accent transition-colors touch-target"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title} className="col-span-1">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              <ul className="mt-3 sm:mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:pt-8 sm:flex-row">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {new Date().getFullYear()} CampusCart. All rights reserved.
          </p>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <Link href="/how-it-works" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/how-it-works" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="/how-it-works" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
              Policies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
