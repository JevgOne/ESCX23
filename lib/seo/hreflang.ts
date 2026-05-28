import { routing, type Locale } from '@/i18n/routing';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lovelygirls.cz';

const SEGMENT_TO_KEY: Record<string, string> = {};
for (const [key, val] of Object.entries(routing.pathnames)) {
  if (typeof val === 'string') {
    SEGMENT_TO_KEY[val] = key;
  } else {
    for (const localized of Object.values(val as Record<string, string>)) {
      SEGMENT_TO_KEY[localized] = key;
    }
  }
}

function stripLocale(path: string): string {
  for (const loc of routing.locales) {
    if (path === `/${loc}` || path.startsWith(`/${loc}/`)) {
      return path.replace(new RegExp(`^/${loc}`), '') || '/';
    }
  }
  return path;
}

function findCanonicalKey(strippedPath: string): { key: string; params: Record<string, string> } {
  if (SEGMENT_TO_KEY[strippedPath]) return { key: SEGMENT_TO_KEY[strippedPath], params: {} };
  for (const [seg, key] of Object.entries(SEGMENT_TO_KEY)) {
    if (!seg.includes('[')) continue;
    const params: Record<string, string> = {};
    const paramNames: string[] = [];
    const pattern = seg.replace(/\[([^\]]+)\]/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const m = strippedPath.match(new RegExp('^' + pattern + '$'));
    if (m) {
      paramNames.forEach((n, i) => { params[n] = m[i + 1] ?? ''; });
      return { key, params };
    }
  }
  return { key: strippedPath, params: {} };
}

function buildLocalizedPath(canonicalKey: string, params: Record<string, string>, targetLocale: Locale): string {
  const def = routing.pathnames[canonicalKey as keyof typeof routing.pathnames];
  let template: string;
  if (def == null) {
    template = canonicalKey;
  } else if (typeof def === 'string') {
    template = def;
  } else {
    const localized = (def as Record<string, string>)[targetLocale];
    template = localized ?? canonicalKey;
  }
  let result = template;
  for (const [name, val] of Object.entries(params)) {
    result = result.replace(`[${name}]`, val);
  }
  const prefix = targetLocale === routing.defaultLocale ? '' : `/${targetLocale}`;
  return (prefix + result) || '/';
}

export function getHreflangsForPath(pathname: string): Record<string, string> {
  const stripped = stripLocale(pathname);
  const { key, params } = findCanonicalKey(stripped);
  const out: Record<string, string> = {};
  for (const loc of routing.locales) {
    out[loc] = `${BASE}${buildLocalizedPath(key, params, loc)}`;
  }
  out['x-default'] = `${BASE}${buildLocalizedPath(key, params, routing.defaultLocale)}`;
  return out;
}

export function getCanonicalForPath(pathname: string, locale: string): string {
  const stripped = stripLocale(pathname);
  const { key, params } = findCanonicalKey(stripped);
  return `${BASE}${buildLocalizedPath(key, params, locale as Locale)}`;
}
