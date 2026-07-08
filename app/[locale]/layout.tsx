import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { routing } from '@/i18n/routing';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import MobileBottomBar from '@/components/layout/MobileBottomBar';
import AgeGate from '@/components/AgeGate';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { Suspense } from 'react';
import '../globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'LovelyGirls Prague — Premium Companions',
    template: '%s · LovelyGirls',
  },
  description:
    'LovelyGirls Prague: 13 verified companions, 4 private apartments in Prague 2, 8, 1 and 3, open daily 10:00–22:30. Fast WhatsApp/Telegram contact.',
  applicationName: 'LovelyGirls Prague',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  referrer: 'strict-origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  other: {
    rating: 'adult',
    RATING: 'RTA-5042-1996-1400-1577-RTA',
    'content-rating': 'mature',
    distribution: 'global',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@lovelygirls',
    title: 'LovelyGirls Prague — Verified Companions',
    description:
      'LovelyGirls Prague: 13 verified companions, 4 private apartments in Prague 2, 8, 1 and 3, open daily 10:00–22:30.',
    images: [{ url: '/og/default.jpg', width: 1200, height: 630, alt: 'LovelyGirls Prague' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'LovelyGirls Prague',
    locale: 'en_US',
    alternateLocale: ['cs_CZ', 'de_DE', 'uk_UA'],
    images: [{ url: '/og/default.jpg', width: 1200, height: 630, alt: 'LovelyGirls Prague' }],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') ?? '';
  const isProtectedArea = pathname.includes('/admin') || pathname.includes('/studio');

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="preconnect" href="https://qktyf1ozcve7804i.public.blob.vercel-storage.com" />
        <link rel="dns-prefetch" href="https://qktyf1ozcve7804i.public.blob.vercel-storage.com" />
      </head>
      <body>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <NextIntlClientProvider>
          {!isProtectedArea && <AgeGate />}
          <SiteHeader locale={locale} />
          {children}
          <SiteFooter />
          {!isProtectedArea && <MobileBottomBar locale={locale} />}
          {!isProtectedArea && (
            <script
              dangerouslySetInnerHTML={{
                __html: `document.addEventListener('contextmenu',function(e){if(e.target.tagName==='IMG'||e.target.tagName==='VIDEO'||e.target.closest('.lightbox-overlay'))e.preventDefault()});`,
              }}
            />
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
