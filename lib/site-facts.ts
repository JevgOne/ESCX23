/**
 * Live agency numbers used in copy, meta descriptions and OG images.
 *
 * These used to be hardcoded in ~13 places and drifted apart from the DB
 * (footer said 14 companions while the copy still claimed 13). Everything
 * that states a count now reads it from here, so it can only drift in one
 * place — and that place is the database.
 */
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { verifiedCompanions } from '@/lib/plural';

export interface SiteFacts {
  companionsCount: number;
  locationsCount: number;
}

/**
 * Last-resort values when the DB is unreachable. Deliberately plausible —
 * printing "0 verified companions" into a meta description is worse than
 * being slightly stale.
 */
const FALLBACK: SiteFacts = { companionsCount: 13, locationsCount: 3 };

const getCachedSiteFacts = unstable_cache(
  async (): Promise<SiteFacts> => {
    const [g, l] = await Promise.all([
      // Same predicate as getFooterStats() — the trust strip and the copy
      // must never report different numbers on the same screen.
      db.execute(`SELECT COUNT(*) AS c FROM girls WHERE status IN ('active','inactive')`),
      db.execute(`SELECT COUNT(*) AS c FROM locations WHERE is_active = 1`),
    ]);
    return {
      companionsCount: Number(g.rows[0]?.c ?? 0) || FALLBACK.companionsCount,
      locationsCount: Number(l.rows[0]?.c ?? 0) || FALLBACK.locationsCount,
    };
  },
  ['site-facts'],
  // Short window: these numbers appear in the footer trust strip on every page,
  // so they should follow the roster closely without a query per request.
  { revalidate: 60, tags: ['site-facts'] }
);

export async function getSiteFacts(): Promise<SiteFacts> {
  try {
    return await getCachedSiteFacts();
  } catch {
    return FALLBACK;
  }
}

/**
 * Substitute {count} / {companions} / {apartments} in plain copy strings that
 * are not routed through next-intl (e.g. the landing-page content map).
 * {companions} expands to the count-agreeing noun phrase for the locale.
 */
export function fillSiteFacts(text: string, facts: SiteFacts, locale: string): string {
  return text
    .replace(/\{companions\}/g, verifiedCompanions(facts.companionsCount, locale))
    .replace(/\{count\}/g, String(facts.companionsCount))
    .replace(/\{apartments\}/g, String(facts.locationsCount));
}
