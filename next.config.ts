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

      // === G) Legacy Secretstory URLs, every locale ===
      // The rules above only ever covered /cs. EN is the default locale with no
      // prefix and de/uk exist too, so /main, /sluzby/*, /praktiky/* and
      // /profily/* stayed dead — 128 URLs still pulling ~930 clicks a quarter
      // into 404s, several of them ranking in the top 5.
      ...(() => {
        // Localised path segments, verified against production.
        const L = {
          '':    { girls: '/girls',       pricing: '/pricing',   service: '/service',     profile: '/profile',   hashtag: '/hashtag',    schedule: '/schedule',     root: '/' },
          '/cs': { girls: '/cs/divky',    pricing: '/cs/cenik',  service: '/cs/sluzba',   profile: '/cs/profil', hashtag: '/cs/hashtag', schedule: '/cs/rozvrh',    root: '/cs' },
          '/de': { girls: '/de/maedchen', pricing: '/de/preise', service: '/de/leistung', profile: '/de/profil', hashtag: '/de/hashtag', schedule: '/de/zeitplan',  root: '/de' },
          '/uk': { girls: '/uk/divchata', pricing: '/uk/tsiny',  service: '/uk/posluha',  profile: '/uk/profil', hashtag: '/uk/hashtag', schedule: '/uk/rozklad',   root: '/uk' },
        };

        // Old /sluzby/* used Czech marketing slugs; the live catalogue uses the
        // English keys below. Anything with no counterpart goes to the listing.
        const SERVICE_SLUG: Record<string, string> = {
          'oral-bez-ochrany': 'blowjob_no_condom',
          'oral-s-ochranou': 'blowjob_condom',
          'hluboky-oral': 'deepthroat',
          'eroticka-masaz': 'erotic_massage',
          'nohy-fetis': 'foot_fetish',
          'strikani-do-obliceje': 'cof',
          'strikani-do-ust': 'cim',
          'strikani-na-telo': 'cum_on_body',
          'strikani-divky': 'cum_on_body',
          'bdsm-lehke': 'light_sm',
          'hrani-roli': 'role_play',
          'analni-sex': 'anal_girl',
          'polyknuti': 'swallow',
          'klasicky-sex': 'classic',
          'francouzske-libani': 'kissing',
          'poloha-69': '69',
          'prostatova-masaz': 'prostate_massage',
          'pse-pornstar-zkusenost': 'hard_sex',
          'duo-service': 'threesome_fmf',
        };
        // Format/marketing pages with no service page behind them.
        const TO_PRICING = ['overnight'];
        const TO_HASHTAG: Record<string, string> = { 'gfe-zkusenost-pritelkyne': 'gfe-praha' };

        const out: { source: string; destination: string; permanent: boolean }[] = [];
        for (const [prefix, path] of Object.entries(L)) {
          // /praktiky/* kept today's slugs, so it is a straight path rename
          out.push({ source: `${prefix}/praktiky/:slug`, destination: `${path.service}/:slug`, permanent: true });
          out.push({ source: `${prefix}/praktiky`, destination: path.girls, permanent: true });

          for (const [from, to] of Object.entries(SERVICE_SLUG)) {
            out.push({ source: `${prefix}/sluzby/${from}`, destination: `${path.service}/${to}`, permanent: true });
          }
          for (const slug of TO_PRICING) {
            out.push({ source: `${prefix}/sluzby/${slug}`, destination: path.pricing, permanent: true });
          }
          for (const [from, to] of Object.entries(TO_HASHTAG)) {
            out.push({ source: `${prefix}/sluzby/${from}`, destination: `${path.hashtag}/${to}`, permanent: true });
          }
          // everything else under /sluzby, plus the index itself
          out.push({ source: `${prefix}/sluzby/:slug`, destination: path.girls, permanent: true });
          out.push({ source: `${prefix}/sluzby`, destination: path.girls, permanent: true });

          out.push({ source: `${prefix}/profily/:slug`, destination: `${path.profile}/:slug`, permanent: true });
          out.push({ source: `${prefix}/profiles/:slug`, destination: `${path.profile}/:slug`, permanent: true });
          out.push({ source: `${prefix}/main`, destination: path.root, permanent: true });

          // Hashtags that no longer exist in the catalogue
          for (const dead of ['asiatky', 'zrale-zeny', 'privatni-sluzby', 'modelky-praha', 'zrzky-praha', 'vysoke-holky', 'vip-holky', 'silikonove-prsa']) {
            out.push({ source: `${prefix}/hashtag/${dead}`, destination: path.girls, permanent: true });
          }

          // /landing/* existed for every locale, not just /cs
          if (prefix !== '/cs') {
            out.push({ source: `${prefix}/landing/nonstop-escort-praha`, destination: path.schedule, permanent: true });
            out.push({ source: `${prefix}/landing/:slug`, destination: path.girls, permanent: true });
          }
        }
        return out;
      })(),

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
