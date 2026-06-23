import type { MetadataRoute } from 'next';
import {
  getAllGirlsForAdmin,
  getActiveLocations,
  getAllServices,
  getPhotosBySlug,
  getBlogPostSlugs,
} from '@/lib/queries';
import { photoUrl } from '@/lib/photoUrl';

export const dynamic = 'force-dynamic';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lovelygirls.cz';
const LOCALES = ['en', 'cs', 'de', 'uk'] as const;
type Locale = (typeof LOCALES)[number];

const prefix = (locale: Locale): string => (locale === 'en' ? '' : `/${locale}`);

// Localized path segments (must match i18n/routing.ts pathnames)
const PATHS: Record<string, Record<Locale, string>> = {
  '/divky': { en: '/girls', cs: '/divky', de: '/maedchen', uk: '/divchata' },
  '/profil/[slug]': {
    en: '/profile/[slug]',
    cs: '/profil/[slug]',
    de: '/profil/[slug]',
    uk: '/profil/[slug]',
  },
  '/pobocka/[slug]': {
    en: '/pobocka/[slug]',
    cs: '/pobocka/[slug]',
    de: '/pobocka/[slug]',
    uk: '/pobocka/[slug]',
  },
  '/sluzba/[slug]': {
    en: '/service/[slug]',
    cs: '/sluzba/[slug]',
    de: '/leistung/[slug]',
    uk: '/posluha/[slug]',
  },
  '/hashtag/[slug]': {
    en: '/hashtag/[slug]',
    cs: '/hashtag/[slug]',
    de: '/hashtag/[slug]',
    uk: '/hashtag/[slug]',
  },
  '/cenik': { en: '/pricing', cs: '/cenik', de: '/preise', uk: '/tsiny' },
  '/rozvrh': { en: '/schedule', cs: '/rozvrh', de: '/zeitplan', uk: '/rozklad' },
  '/slevy': { en: '/discounts', cs: '/slevy', de: '/rabatte', uk: '/znyzhky' },
  '/faq': { en: '/faq', cs: '/faq', de: '/faq', uk: '/faq' },
  '/recenze': { en: '/reviews', cs: '/recenze', de: '/rezensionen', uk: '/vidhuky' },
  '/o-nas': { en: '/about', cs: '/o-nas', de: '/ueber-uns', uk: '/pro-nas' },
  '/kontakt': { en: '/contact', cs: '/kontakt', de: '/kontakt', uk: '/kontakt' },
  '/podminky': { en: '/terms', cs: '/podminky', de: '/agb', uk: '/umovy' },
  '/soukromi': { en: '/privacy', cs: '/soukromi', de: '/datenschutz', uk: '/konfidentsiinist' },
  '/blog': { en: '/blog', cs: '/blog', de: '/blog', uk: '/blog' },
};

function resolvePath(routeKey: string, locale: Locale, slug?: string): string {
  const entry = PATHS[routeKey];
  if (!entry) return routeKey;
  const localized = entry[locale];
  if (slug) return localized.replace('[slug]', slug);
  return localized;
}

function url(locale: Locale, path: string): string {
  if (path === '/' || path === '') return `${BASE}${prefix(locale) || ''}` || BASE;
  return `${BASE}${prefix(locale)}${path}`;
}

function buildAlternates(routeKey: string, slug?: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) {
    out[l] = url(l, resolvePath(routeKey, l, slug));
  }
  out['x-default'] = url('en', resolvePath(routeKey, 'en', slug));
  return out;
}

function buildHomeAlternates(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) {
    out[l] = `${BASE}${prefix(l)}` || BASE;
  }
  out['x-default'] = BASE;
  return out;
}

// Static homepage tag dictionary — mirror TAG_NAMES in app/[locale]/hashtag/[slug]/page.tsx
// Only hashtags with unique HASHTAG_CONTENT (intro + FAQ) in sitemap.
// Other hashtag pages still work, just not submitted to Google.
const HASHTAG_SLUGS = [
  'blondynky-praha', 'brunetky-praha', 'cernovlasky-praha', 'gfe-praha',
  'studentky-praha', 'spolecnice-praha', 'prirodni-poprsi', 'tetovani',
];

const STATIC_KEYS: Array<{ key: string; freq: 'daily' | 'hourly' | 'weekly' | 'monthly'; priority: number }> = [
  { key: '/cenik', freq: 'weekly', priority: 0.8 },
  { key: '/slevy', freq: 'weekly', priority: 0.7 },
  { key: '/rozvrh', freq: 'hourly', priority: 0.8 },
  { key: '/faq', freq: 'monthly', priority: 0.7 },
  { key: '/recenze', freq: 'daily', priority: 0.6 },
  { key: '/o-nas', freq: 'monthly', priority: 0.5 },
  { key: '/kontakt', freq: 'monthly', priority: 0.5 },
  { key: '/blog', freq: 'daily', priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [girls, locations, services, photosBySlug, blogSlugs] = await Promise.all([
    getAllGirlsForAdmin(undefined, 'active').catch(() => []),
    getActiveLocations().catch(() => []),
    getAllServices().catch(() => []),
    getPhotosBySlug(5).catch(() => ({} as Record<string, string[]>)),
    getBlogPostSlugs().catch(() => []),
  ]);

  // Resolve relative photo URLs to absolute (required by sitemap spec)
  const resolveImages = (slug: string): string[] => {
    const urls = photosBySlug[slug] ?? [];
    return urls.map((u) => {
      const resolved = photoUrl(u);
      if (resolved.startsWith('http')) return resolved;
      return `${BASE}${resolved.startsWith('/') ? '' : '/'}${resolved}`;
    });
  };

  const now = new Date();
  const pages: MetadataRoute.Sitemap = [];

  // Homepage per locale
  for (const l of LOCALES) {
    pages.push({
      url: `${BASE}${prefix(l)}` || BASE,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: { languages: buildHomeAlternates() },
    });
  }

  // /divky (per locale, localized path)
  for (const l of LOCALES) {
    pages.push({
      url: url(l, resolvePath('/divky', l)),
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
      alternates: { languages: buildAlternates('/divky') },
    });
  }

  // Static pages (per locale)
  for (const { key, freq, priority } of STATIC_KEYS) {
    for (const l of LOCALES) {
      pages.push({
        url: url(l, resolvePath(key, l)),
        lastModified: now,
        changeFrequency: freq,
        priority,
        alternates: { languages: buildAlternates(key) },
      });
    }
  }

  // Profile pages (per girl × per locale) — with image sitemap entries
  for (const girl of girls) {
    const lastmod = girl.updatedAt ? new Date(girl.updatedAt) : now;
    const alternates = buildAlternates('/profil/[slug]', girl.slug);
    const images = resolveImages(girl.slug);
    for (const l of LOCALES) {
      pages.push({
        url: url(l, resolvePath('/profil/[slug]', l, girl.slug)),
        lastModified: lastmod,
        changeFrequency: 'daily',
        priority: 0.9,
        alternates: { languages: alternates },
        ...(images.length > 0 ? { images } : {}),
      });
    }
  }

  // Pobočky (per location × per locale)
  for (const loc of locations) {
    const alternates = buildAlternates('/pobocka/[slug]', loc.name);
    for (const l of LOCALES) {
      pages.push({
        url: url(l, resolvePath('/pobocka/[slug]', l, loc.name)),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: { languages: alternates },
      });
    }
  }

  // Služby (per service × per locale)
  for (const svc of services) {
    if (!svc.slug) continue;
    const alternates = buildAlternates('/sluzba/[slug]', svc.slug);
    for (const l of LOCALES) {
      pages.push({
        url: url(l, resolvePath('/sluzba/[slug]', l, svc.slug)),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: { languages: alternates },
      });
    }
  }

  // Blog posts (per post × all locales)
  for (const bp of blogSlugs) {
    const lastmod = bp.updatedAt ? new Date(bp.updatedAt) : now;
    const alternates: Record<string, string> = {};
    for (const l of LOCALES) {
      alternates[l] = l === 'en' ? `${BASE}/blog/${bp.slug}` : `${BASE}/${l}/blog/${bp.slug}`;
    }
    alternates['x-default'] = `${BASE}/blog/${bp.slug}`;
    // Only CS + EN in sitemap (DE/UK are untranslated duplicates of CS)
    for (const l of ['en', 'cs'] as const) {
      pages.push({
        url: l === 'en' ? `${BASE}/blog/${bp.slug}` : `${BASE}/${l}/blog/${bp.slug}`,
        lastModified: lastmod,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: alternates },
      });
    }
  }

  // Hashtagy (statický seznam × per locale)
  for (const slug of HASHTAG_SLUGS) {
    const alternates = buildAlternates('/hashtag/[slug]', slug);
    for (const l of LOCALES) {
      pages.push({
        url: url(l, resolvePath('/hashtag/[slug]', l, slug)),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.4,
        alternates: { languages: alternates },
      });
    }
  }

  return pages;
}
