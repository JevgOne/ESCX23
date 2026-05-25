import { db } from '@/lib/db';

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

/** Returns OG image object for Next.js metadata, with fallback. */
export async function ogImageMeta(
  key: string,
  fallbackAlt: string,
  fallbackUrl?: string
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
