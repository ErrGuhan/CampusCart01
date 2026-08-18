import { Suspense } from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { CartProvider } from '@/components/cart-provider';
import { SwipeProvider } from '@/components/layout/swipe-context';
import { PWAProvider } from '@/components/pwa-provider';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CampusCartAIAssistant } from '@/components/ai-assistant';
import { NavigationProgressBar } from '@/components/layout/progress-bar';
import { ScrollToTop } from '@/components/layout/scroll-to-top';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://campuscart.app'),
  title: {
    default: 'CampusCart — SVCET Student Marketplace & Hub',
    template: '%s | CampusCart',
  },
  description:
    'Buy, sell, and discover products and freelance services created by students at Sri Venkateswara College of Engineering and Technology (SVCET).',
  applicationName: 'CampusCart',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CampusCart',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: '#09090b',
  openGraph: {
    title: 'CampusCart — Discover what your campus creates',
    description:
      'Buy, sell, and discover products created by students in your college.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CampusCart — Discover what your campus creates',
    description:
      'Buy, sell, and discover products created by students in your college.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sora.variable} w-full max-w-[100vw] overflow-x-hidden`}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CampusCart" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased pb-20 md:pb-0 min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-hidden">
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <CartProvider>
              <SwipeProvider>
                <PWAProvider>
                  {children}
                  <BottomNav />
                  <ScrollToTop />
                  <CampusCartAIAssistant />
                  <Toaster />
                </PWAProvider>
              </SwipeProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
