const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lovelygirls.cz';

const LOCALE_PREFIXES: Record<string, string> = {
  en: '',
  cs: '/cs',
  de: '/de',
  uk: '/uk',
};

/**
 * Localized path mappings from i18n/routing.ts.
 * Key = internal (cs) path, value = { locale: localized path }.
 * Paths not listed here are the same across all locales.
 */
const LOCALIZED_PATHS: Record<string, Record<string, string>> = {
  '/divky': { en: '/girls', cs: '/divky', de: '/maedchen', uk: '/divchata' },
  '/cenik': { en: '/pricing', cs: '/cenik', de: '/preise', uk: '/tsiny' },
  '/rozvrh': { en: '/schedule', cs: '/rozvrh', de: '/zeitplan', uk: '/rozklad' },
  '/slevy': { en: '/discounts', cs: '/slevy', de: '/rabatte', uk: '/znyzhky' },
  '/recenze': { en: '/reviews', cs: '/recenze', de: '/rezensionen', uk: '/vidhuky' },
  '/kontakt': { en: '/contact', cs: '/kontakt', de: '/kontakt', uk: '/kontakt' },
  '/o-nas': { en: '/about', cs: '/o-nas', de: '/ueber-uns', uk: '/pro-nas' },
  '/podminky': { en: '/terms', cs: '/podminky', de: '/agb', uk: '/umovy' },
  '/soukromi': { en: '/privacy', cs: '/soukromi', de: '/datenschutz', uk: '/konfidentsiinist' },
};

function localizedPath(locale: string, path: string): string {
  if (path === '/' || path === '') return '';
  const mapping = LOCALIZED_PATHS[path];
  if (mapping) return mapping[locale] ?? path;
  // For paths with slugs like /sluzba/69 — check prefix
  for (const [prefix, localeMap] of Object.entries(LOCALIZED_PATHS)) {
    if (path.startsWith(prefix + '/')) {
      const suffix = path.slice(prefix.length);
      const localizedPrefix = localeMap[locale] ?? prefix;
      return localizedPrefix + suffix;
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
