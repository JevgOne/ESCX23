const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lovelygirls.cz';

const LOCALE_PREFIXES: Record<string, string> = {
  en: '',
  cs: '/cs',
  de: '/de',
  uk: '/uk',
};

export function getCanonicalUrl(locale: string, path: string): string {
  const prefix = LOCALE_PREFIXES[locale] ?? `/${locale}`;
  const cleanPath = path === '/' ? '' : path;
  return `${BASE}${prefix}${cleanPath}`;
}

export function getAlternates(path: string): Record<string, string> {
  const cleanPath = path === '/' ? '' : path;
  return {
    en: `${BASE}${cleanPath}`,
    cs: `${BASE}/cs${cleanPath}`,
    de: `${BASE}/de${cleanPath}`,
    uk: `${BASE}/uk${cleanPath}`,
    'x-default': `${BASE}${cleanPath}`,
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
