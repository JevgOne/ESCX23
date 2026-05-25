import { headers } from 'next/headers';
import { routing, type Locale } from '@/i18n/routing';

interface Props {
  currentLocale: string;
}

const LABELS: Record<Locale, string> = {
  en: 'EN',
  cs: 'CS',
  de: 'DE',
  uk: 'UK',
};

const FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  cs: '🇨🇿',
  de: '🇩🇪',
  uk: '🇺🇦',
};

// Map any localized URL segment → canonical key (e.g. /girls → /divky)
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
  // Try dynamic templates
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

function buildLocalizedHref(canonicalKey: string, params: Record<string, string>, targetLocale: Locale): string {
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

export default async function LanguageSwitcher({ currentLocale }: Props) {
  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') ?? hdrs.get('next-url') ?? '/';
  const stripped = stripLocale(pathname);
  const { key: canonicalKey, params } = findCanonicalKey(stripped);

  return (
    <nav aria-label="Language" style={{ display: 'flex', gap: 4 }}>
      {routing.locales.map((loc) => {
        const isActive = loc === currentLocale;
        const href = buildLocalizedHref(canonicalKey, params, loc);
        return (
          <a
            key={loc}
            href={href}
            aria-current={isActive ? 'true' : undefined}
            hrefLang={loc}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: '1px solid var(--color-line)',
              background: isActive ? 'var(--color-bg-elev)' : 'transparent',
              color: isActive ? 'var(--color-coral)' : 'var(--color-text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span aria-hidden style={{ fontSize: 14 }}>
              {FLAGS[loc]}
            </span>
            {LABELS[loc]}
          </a>
        );
      })}
    </nav>
  );
}
