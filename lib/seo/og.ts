import { db } from '@/lib/db';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lovelygirls.cz';

/** Returns custom OG image URL from admin (if uploaded) for a given page key. */
export async function getCustomOgImage(key: string): Promise<string | null> {
  try {
    const result = await db.execute({
      sql: `SELECT url FROM og_images WHERE page_key = ? LIMIT 1`,
      args: [key],
    });
    return result.rows[0]?.url ? String(result.rows[0].url) : null;
  } catch {
    return null;
  }
}

/** Builds a Next.js `openGraph.images` array.
 *
 *  Priority: admin upload (DB) > route-level `opengraph-image.tsx` (Next.js
 *  file convention via routePath). When neither given, returns empty array
 *  (caller will omit the field, letting Next.js fall back to layout default).
 */
export async function buildOgImages(
  pageKey: string,
  locale: string,
  routePath: string, // path under the locale segment, e.g. '/divky', '/cenik'
  alt: string,
): Promise<{ url: string; width: number; height: number; alt: string }[]> {
  const custom = await getCustomOgImage(pageKey);
  const localePrefix = locale === 'en' ? '' : `/${locale}`;
  const url = custom ?? `${BASE}${localePrefix}${routePath}/opengraph-image`;
  return [{ url, width: 1200, height: 630, alt }];
}

/** Legacy helper — kept for compat. */
export async function ogImageMeta(
  key: string,
  fallbackAlt: string,
  fallbackUrl?: string,
): Promise<{ url: string; width: number; height: number; alt: string }[]> {
  const custom = await getCustomOgImage(key);
  if (custom) {
    return [{ url: custom, width: 1200, height: 630, alt: fallbackAlt }];
  }
  if (fallbackUrl) {
    return [{ url: fallbackUrl, width: 1200, height: 630, alt: fallbackAlt }];
  }
  return [];
}
