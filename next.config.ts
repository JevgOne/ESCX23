import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const config: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  serverExternalPackages: ['@libsql/client', '@vercel/blob', 'sharp'],
  async redirects() {
    return [
      // non-www → www (permanent 301)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'lovelygirls.cz' }],
        destination: 'https://www.lovelygirls.cz/:path*',
        permanent: true,
      },
      // old Vercel preview → www (permanent 301)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'escx23.vercel.app' }],
        destination: 'https://www.lovelygirls.cz/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/studio/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/:locale/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/:locale/studio/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default withNextIntl(config);
