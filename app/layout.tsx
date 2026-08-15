import './globals.css';
import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import { AuthProvider } from '@/components/auth-provider';
import { CartProvider } from '@/components/cart-provider';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CampusCartAIAssistant } from '@/components/ai-assistant';
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
  title: 'CampusCart — SVCET Student Marketplace & Freelance Hub',
  description:
    'Buy, sell, and discover products and freelance services created by students at Sri Venkateswara College of Engineering and Technology (SVCET).',
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
    <html lang="en" className={`${inter.variable} ${sora.variable} w-full max-w-[100vw] overflow-x-hidden`}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body className="font-sans antialiased pb-16 md:pb-0 min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-hidden">
        <AuthProvider>
          <CartProvider>
            {children}
            <BottomNav />
            <CampusCartAIAssistant />
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
