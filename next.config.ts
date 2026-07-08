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

      // === A) Profile old URLs ===
      { source: '/cs/girls/:slug', destination: '/cs/profil/:slug', permanent: true },
      { source: '/cs/profily/:slug', destination: '/cs/profil/:slug', permanent: true },
      { source: '/cs/profiles', destination: '/cs/divky', permanent: true },
      { source: '/cz/profiles', destination: '/cs/divky', permanent: true },

      // === B) Landing pages ===
      { source: '/cs/landing/escort-prague', destination: '/cs/divky', permanent: true },
      { source: '/cs/landing/escort-praha', destination: '/cs/divky', permanent: true },
      { source: '/cs/landing/companions-prague', destination: '/cs/divky', permanent: true },
      { source: '/cs/landing/spolecnice-praha', destination: '/cs/hashtag/spolecnice-praha', permanent: true },
      { source: '/cs/landing/blondynky', destination: '/cs/hashtag/blondynky-praha', permanent: true },
      { source: '/cs/landing/brunetky', destination: '/cs/hashtag/brunetky-praha', permanent: true },
      { source: '/cs/landing/gfe', destination: '/cs/hashtag/gfe-praha', permanent: true },
      { source: '/cs/landing/studentky', destination: '/cs/hashtag/studentky-praha', permanent: true },
      { source: '/cs/landing/vinohrady', destination: '/cs/pobocka/praha-2', permanent: true },
      { source: '/cs/landing/zizkov', destination: '/cs/pobocka/praha-3', permanent: true },
      { source: '/cs/landing/sex-praha', destination: '/cs/divky', permanent: true },
      { source: '/cs/landing/privat-praha', destination: '/cs/divky', permanent: true },
      { source: '/cs/landing/girlfriend-experience-praha', destination: '/cs/hashtag/gfe-praha', permanent: true },
      { source: '/cs/landing/nonstop-escort-praha', destination: '/cs/rozvrh', permanent: true },
      { source: '/cs/landing/outcall-escort-praha', destination: '/cs/divky', permanent: true },
      { source: '/cs/landing/duo-escort-praha', destination: '/cs/divky', permanent: true },
      { source: '/cs/landing/eroticke-masaze-praha', destination: '/cs/divky', permanent: true },
      { source: '/cs/landing/vip-escort-praha', destination: '/cs/divky', permanent: true },
      // landing catchall
      { source: '/cs/landing/:slug', destination: '/cs/', permanent: true },

      // === C) Blog old URLs ===
      { source: '/blog-cs/:slug', destination: '/cs/blog/:slug', permanent: true },
      { source: '/blogs-cz/:slug', destination: '/cs/blog/:slug', permanent: true },
      { source: '/blog', destination: '/cs/blog', permanent: true },

      // === D) Old locale/structural URLs ===
      { source: '/cz/main', destination: '/cs/', permanent: true },
      { source: '/cs/main', destination: '/cs/', permanent: true },
      { source: '/cz/pricing', destination: '/cs/cenik', permanent: true },
      { source: '/cs/pricing', destination: '/cs/cenik', permanent: true },
      { source: '/cz/schedule', destination: '/cs/rozvrh', permanent: true },
      { source: '/cs/schedule', destination: '/cs/rozvrh', permanent: true },
      { source: '/cs/discount', destination: '/cs/slevy', permanent: true },
      { source: '/cs/sluzby', destination: '/cs/divky', permanent: true },
      { source: '/cz/blog', destination: '/cs/blog', permanent: true },
      { source: '/cz/faq', destination: '/cs/faq', permanent: true },

      // === E) WordPress-era / bare URLs ===
      { source: '/escort-praha', destination: '/cs/divky', permanent: true },
      { source: '/escort-prague', destination: '/en/girls', permanent: true },
      { source: '/bdsm', destination: '/cs/blog', permanent: true },
      { source: '/author/:slug', destination: '/cs/', permanent: true },

      // === F) Old sitemaps ===
      { source: '/slecny-sitemap.xml', destination: '/sitemap.xml', permanent: true },
      { source: '/page-sitemap.xml', destination: '/sitemap.xml', permanent: true },
      { source: '/wp-sitemap.xml', destination: '/sitemap.xml', permanent: true },
      { source: '/sitemap_index.xml', destination: '/sitemap.xml', permanent: true },

      // === Wildcard /cz → /cs (MUST be last) ===
      { source: '/cz/:path*', destination: '/cs/:path*', permanent: true },
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
