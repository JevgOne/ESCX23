import { routing } from '@/i18n/routing';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lovelygirls.cz';

const LOCALE_PREFIXES: Record<string, string> = {
  en: '',
  cs: '/cs',
  de: '/de',
  uk: '/uk',
};

/**
 * Localised path segments, derived from i18n/routing.ts.
 *
 * This used to be a hand-written copy of that table and had fallen behind it:
 * /sluzba, /profil, /pobocka, /hashtag, /faq and /blog were all missing, so
 * localizedPath() returned the Czech slug unchanged for them. Every service
 * page therefore advertised hreflang alternates at /sluzba/bdsm,
 * /de/sluzba/bdsm and /uk/sluzba/bdsm — none of which exist — and canonicals
 * pointed at the same dead URLs. Deriving it means the two can no longer drift.
 */
const LOCALIZED_PATHS: Record<string, Record<string, string>> = (() => {
  const stripParam = (p: string) => p.replace(/\/\[[^\]]+\]$/, '');
  const out: Record<string, Record<string, string>> = {};

  for (const [internal, value] of Object.entries(routing.pathnames)) {
    const key = stripParam(internal);
    if (!key || key === '/') continue;

    if (typeof value === 'string') {
      const v = stripParam(value);
      out[key] = { en: v, cs: v, de: v, uk: v };
      continue;
    }
    const perLocale: Record<string, string> = {};
    for (const [loc, localised] of Object.entries(value as Record<string, string>)) {
      perLocale[loc] = stripParam(localised);
    }
    out[key] = perLocale;
  }
  return out;
})();

/** Longest prefix first, so /clenstvi/zadost never swallows a longer sibling. */
const LOCALIZED_PREFIXES = Object.entries(LOCALIZED_PATHS).sort(
  (a, b) => b[0].length - a[0].length,
);

function localizedPath(locale: string, path: string): string {
  if (path === '/' || path === '') return '';

  const exact = LOCALIZED_PATHS[path];
  if (exact) return exact[locale] ?? path;

  // Paths carrying a slug, e.g. /sluzba/bdsm or /profil/luna.
  for (const [prefix, localeMap] of LOCALIZED_PREFIXES) {
    if (path.startsWith(prefix + '/')) {
      return (localeMap[locale] ?? prefix) + path.slice(prefix.length);
    }
  }
  return path;
}

export function getCanonicalUrl(locale: string, path: string): string {
  const prefix = LOCALE_PREFIXES[locale] ?? `/${locale}`;
  const lPath = localizedPath(locale, path);
  return `${BASE}${prefix}${lPath}`;
}

export function getAlternates(path: string): Record<string, string> {
  return {
    en: `${BASE}${localizedPath('en', path)}`,
    cs: `${BASE}/cs${localizedPath('cs', path)}`,
    de: `${BASE}/de${localizedPath('de', path)}`,
    uk: `${BASE}/uk${localizedPath('uk', path)}`,
    'x-default': `${BASE}${localizedPath('en', path)}`,
  };
}

export function getProfileCanonical(locale: string, slug: string): string {
  const pathByLocale: Record<string, string> = {
    en: `${BASE}/profile/${slug}`,
    cs: `${BASE}/cs/profil/${slug}`,
    de: `${BASE}/de/profil/${slug}`,
    uk: `${BASE}/uk/profil/${slug}`,
  };
  return pathByLocale[locale] ?? `${BASE}/profile/${slug}`;
}

export function getProfileAlternates(slug: string): Record<string, string> {
  return {
    en: `${BASE}/profile/${slug}`,
    cs: `${BASE}/cs/profil/${slug}`,
    de: `${BASE}/de/profil/${slug}`,
    uk: `${BASE}/uk/profil/${slug}`,
    'x-default': `${BASE}/profile/${slug}`,
  };
}

export function ogLocale(locale: string): string {
  const map: Record<string, string> = {
    en: 'en_US',
    cs: 'cs_CZ',
    de: 'de_DE',
    uk: 'uk_UA',
  };
  return map[locale] ?? 'en_US';
}
