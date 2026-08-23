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

export interface SiteApartment {
  /** Neighbourhood as people say it: "Žižkov" */
  name: string;
  /** Administrative district: "Praha 3" */
  district: string | null;
  slug: string;
}

export interface SiteFacts {
  companionsCount: number;
  locationsCount: number;
  /** Active apartments, in footer order. Copy must never name a district we do not have. */
  apartments: SiteApartment[];
}

/**
 * Last-resort values when the DB is unreachable. Deliberately plausible —
 * printing "0 verified companions" into a meta description is worse than
 * being slightly stale.
 */
const FALLBACK: SiteFacts = { companionsCount: 13, locationsCount: 3, apartments: [] };

const getCachedSiteFacts = unstable_cache(
  async (): Promise<SiteFacts> => {
    const [g, l] = await Promise.all([
      // Same predicate as getFooterStats() — the trust strip and the copy
      // must never report different numbers on the same screen.
      db.execute(`SELECT COUNT(*) AS c FROM girls WHERE status IN ('active','inactive')`),
      db.execute(
        `SELECT name, display_name, district FROM locations
         WHERE is_active = 1 ORDER BY is_primary DESC, id ASC`
      ),
    ]);
    const apartments: SiteApartment[] = l.rows.map((r) => ({
      // display_name reads "Nové Město, Praha 2" — the part before the comma
      // is the neighbourhood, the district column holds "Praha 2".
      name: String(r.display_name ?? r.name).split(',')[0].trim(),
      district: r.district ? String(r.district) : null,
      slug: String(r.name),
    }));
    return {
      companionsCount: Number(g.rows[0]?.c ?? 0) || FALLBACK.companionsCount,
      locationsCount: apartments.length || FALLBACK.locationsCount,
      apartments,
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
    .replace(/\{districts\}/g, districtList(facts, locale))
    .replace(/\{apartments\}/g, String(facts.locationsCount));
}

/**
 * "Nové Město (Praha 2), Žižkov (Praha 3) a Anděl (Praha 5)" — the real
 * apartments, never a hardcoded list. Naming a district we do not have is
 * both a lie to the visitor and a wasted keyword.
 */
export function districtList(facts: SiteFacts, locale: string): string {
  const parts = facts.apartments.map((a) =>
    a.district && a.district !== a.name ? `${a.name} (${a.district})` : a.name
  );
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  const and = locale === 'cs' ? ' a ' : locale === 'de' ? ' und ' : locale === 'uk' ? ' та ' : ' and ';
  return parts.slice(0, -1).join(', ') + and + parts[parts.length - 1];
}
