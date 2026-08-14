import './globals.css';
import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import { AuthProvider } from '@/components/auth-provider';
import { CartProvider } from '@/components/cart-provider';
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
  title: 'CampusCart — Discover what your campus creates',
  description:
    'Buy, sell, and discover products created by students in your college. A trusted marketplace for student creators.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover',
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
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
