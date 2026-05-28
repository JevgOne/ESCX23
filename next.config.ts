import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const config: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  serverExternalPackages: ['@libsql/client', '@vercel/blob', 'sharp'],
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
    ];
  },
  /**
   * 301 redirects from legacy Secretstory URLs to new ESCX23 structure.
   * Critical for SEO continuity when switching lovelygirls.cz domain over.
   * All `permanent: true` = 308 (search engines treat as 301).
   */
  async redirects() {
    return [
      // === Profiles: /{locale}/profily/{slug} → /{locale}/profil/{slug} (or /profile/ in EN) ===
      { source: '/cs/profily/:slug', destination: '/cs/profil/:slug', permanent: true },
      { source: '/de/profily/:slug', destination: '/de/profil/:slug', permanent: true },
      { source: '/uk/profily/:slug', destination: '/uk/profil/:slug', permanent: true },
      { source: '/en/profily/:slug', destination: '/profile/:slug', permanent: true },
      { source: '/profily/:slug', destination: '/profile/:slug', permanent: true },

      // === Schedule: legacy '/cs/schedule' → '/cs/rozvrh' (CS) ===
      { source: '/cs/schedule', destination: '/cs/rozvrh', permanent: true },
      { source: '/de/schedule', destination: '/de/zeitplan', permanent: true },
      { source: '/uk/schedule', destination: '/uk/rozklad', permanent: true },

      // === Discounts: legacy '/cs/discounts' → '/cs/slevy' (CS) ===
      { source: '/cs/discounts', destination: '/cs/slevy', permanent: true },
      { source: '/de/discounts', destination: '/de/rabatte', permanent: true },
      { source: '/uk/discounts', destination: '/uk/znyzhky', permanent: true },

      // === Pricing: legacy '/en/cenik' → '/pricing' (EN no prefix) ===
      { source: '/en/cenik', destination: '/pricing', permanent: true },
      { source: '/en/divky', destination: '/girls', permanent: true },
      { source: '/en/rozvrh', destination: '/schedule', permanent: true },
      { source: '/en/slevy', destination: '/discounts', permanent: true },

      // === Služby (legacy services listing) — sluzby was a multi-purpose page, redirect to /sluzba listing ===
      { source: '/cs/sluzby', destination: '/cs/divky', permanent: true },
      { source: '/de/sluzby', destination: '/de/maedchen', permanent: true },
      { source: '/uk/sluzby', destination: '/uk/divchata', permanent: true },
      { source: '/en/sluzby', destination: '/girls', permanent: true },

      // === Praktiky (legacy practice pages) → /sluzba/{slug} ===
      { source: '/cs/praktiky/:slug', destination: '/cs/sluzba/:slug', permanent: true },
      { source: '/de/praktiky/:slug', destination: '/de/leistung/:slug', permanent: true },
      { source: '/uk/praktiky/:slug', destination: '/uk/posluha/:slug', permanent: true },
      { source: '/en/praktiky/:slug', destination: '/service/:slug', permanent: true },

      // === Landing pages (legacy) → /hashtag/{slug} (where slug matches) or homepage ===
      { source: '/cs/landing/escort-praha', destination: '/cs/hashtag/spolecnice-praha', permanent: true },
      { source: '/cs/landing/spolecnice-praha', destination: '/cs/hashtag/spolecnice-praha', permanent: true },
      { source: '/cs/landing/girlfriend-experience-praha', destination: '/cs/hashtag/gfe-praha', permanent: true },
      { source: '/cs/landing/vip-escort-praha', destination: '/cs/hashtag/luxusni-sluzby', permanent: true },
      { source: '/cs/landing/eroticke-masaze-praha', destination: '/cs/hashtag/spolecnice-praha', permanent: true },
      { source: '/cs/landing/privat-praha', destination: '/cs/pobocka/vinohrady', permanent: true },
      { source: '/cs/landing/sex-praha', destination: '/cs/hashtag/spolecnice-praha', permanent: true },
      { source: '/cs/landing/duo-escort-praha', destination: '/cs/hashtag/luxusni-sluzby', permanent: true },
      { source: '/cs/landing/nonstop-escort-praha', destination: '/cs/rozvrh', permanent: true },
      { source: '/cs/landing/outcall-escort-praha', destination: '/cs/hashtag/spolecnice-praha', permanent: true },
      // Catchall for any other legacy landing
      { source: '/cs/landing/:slug', destination: '/cs/divky', permanent: true },
      { source: '/de/landing/:slug', destination: '/de/maedchen', permanent: true },
      { source: '/uk/landing/:slug', destination: '/uk/divchata', permanent: true },
      { source: '/en/landing/:slug', destination: '/girls', permanent: true },

      // === Hashtag legacy slugs which exist in old but not new ===
      { source: '/cs/hashtag/asiatky', destination: '/cs/hashtag/exoticke-krasky', permanent: true },
      { source: '/cs/hashtag/latinky', destination: '/cs/hashtag/exoticke-krasky', permanent: true },
      { source: '/cs/hashtag/zrale-zeny', destination: '/cs/hashtag/milf-praha', permanent: true },
      { source: '/cs/hashtag/bujne-tvary', destination: '/cs/hashtag/krivky', permanent: true },
      { source: '/cs/hashtag/holky-praha', destination: '/cs/hashtag/spolecnice-praha', permanent: true },
      { source: '/cs/hashtag/modelky-praha', destination: '/cs/hashtag/elegantni-holky', permanent: true },
      { source: '/cs/hashtag/vip-holky', destination: '/cs/hashtag/luxusni-sluzby', permanent: true },
      { source: '/cs/hashtag/privatni-sluzby', destination: '/cs/hashtag/luxusni-sluzby', permanent: true },
      { source: '/cs/hashtag/silikonove-prsa', destination: '/cs/hashtag/velka-prsa', permanent: true },
      { source: '/cs/hashtag/slovenske-holky', destination: '/cs/hashtag/ceske-holky', permanent: true },

      // === Domain canonicalization: www.lovelygirls.cz → apex (handled by Vercel/DNS, no app code needed) ===
    ];
  },
};

export default withNextIntl(config);
