import Link from 'next/link';
import { Store, Instagram, Twitter, Linkedin, Mail } from 'lucide-react';

const footerSections = [
  {
    title: 'Marketplace',
    links: [
      { href: '/products', label: 'Browse Products' },
      { href: '/categories', label: 'Categories' },
      { href: '/sellers', label: 'Student Creators' },
      { href: '/deals', label: 'Deals' },
    ],
  },
  {
    title: 'Sell',
    links: [
      { href: '/seller/dashboard', label: 'Seller Dashboard' },
      { href: '/seller/products/new', label: 'List a Product' },
      { href: '/seller/earnings', label: 'Earnings' },
      { href: '/how-it-works', label: 'How It Works' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/login', label: 'Sign In' },
      { href: '/register', label: 'Create Account' },
      { href: '/account/orders', label: 'My Orders' },
      { href: '/account/wishlist', label: 'Wishlist' },
    ],
  },
  {
    title: 'Help',
    links: [
      { href: '/policies', label: 'Marketplace Policies' },
      { href: '/safety', label: 'Trust & Safety' },
      { href: '/contact', label: 'Contact' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
];

export function Footer() {
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
                { Icon: Instagram, label: 'Instagram' },
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Linkedin, label: 'LinkedIn' },
                { Icon: Mail, label: 'Email' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
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
                  <li key={link.href}>
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
            <Link href="/privacy" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="/policies" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
              Policies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
