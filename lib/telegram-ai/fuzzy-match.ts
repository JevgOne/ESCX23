/**
 * Fuzzy name matching for girl lookups in Telegram bot.
 *
 * Handles: typos (Viktorie→Viktoria), K/C swaps (Katy→Caty),
 * diacritics (Katarina→Kateřina), case insensitivity.
 */

import { db } from '../db';

// ---------------------------------------------------------------------------
// Known aliases — hardcoded common name variants
// ---------------------------------------------------------------------------

const NAME_ALIASES: Record<string, string[]> = {
  // K/C swap variants
  katy: ['caty', 'kathy', 'katie', 'kati', 'cathy', 'katka', 'katuska'],
  caty: ['katy', 'kathy', 'katie', 'kati', 'cathy', 'katka', 'katuska'],
  katka: ['katy', 'caty', 'kathy', 'katie', 'kati'],
  // Viktoria variants + Czech diminutives
  viktoria: ['viktorie', 'victoria', 'viktorka', 'viki', 'vikki', 'viky', 'vikca'],
  viktorie: ['viktoria', 'victoria', 'viktorka', 'viki', 'vikki', 'viky', 'vikca'],
  viky: ['viktoria', 'viktorie', 'victoria', 'viktorka', 'viki', 'vikki'],
  viktorka: ['viktoria', 'viktorie', 'viki', 'viky'],
  // Katerina/Katarina
  katarina: ['katerina', 'katka', 'kata', 'katuska'],
  katerina: ['katarina', 'katka', 'kata', 'katuska'],
  // Natalia/Natalie
  natalia: ['natalie', 'natalka', 'nata', 'natka', 'natuska'],
  natalie: ['natalia', 'natalka', 'nata', 'natka', 'natuska'],
  natalka: ['natalia', 'natalie', 'nata'],
  // Emily + Czech diminutives
  emily: ['emilly', 'emilie', 'emili', 'emca', 'emicka'],
  emilie: ['emily', 'emilly', 'emili', 'emca', 'emicka'],
  emca: ['emily', 'emilie', 'emilly'],
  emicka: ['emily', 'emilie', 'emilly'],
  // Nicole/Nikola/Nika + diminutives
  nicole: ['nikola', 'nikol', 'nicolle', 'nika', 'niky', 'nikca', 'nikuska'],
  nikola: ['nicole', 'nikol', 'nicolle', 'nika', 'niky', 'nikca', 'nikuska'],
  nika: ['nicole', 'nikola', 'nikol', 'niky', 'nikca'],
  niky: ['nicole', 'nikola', 'nikol', 'nika', 'nikca'],
  // Kim + diminutives
  kim: ['kimca', 'kimicka', 'kimmy'],
  kimca: ['kim', 'kimicka', 'kimmy'],
  // Anna + Czech diminutives
  anna: ['anicka', 'anka', 'aninka', 'anecka', 'anulka'],
  anicka: ['anna', 'anka', 'aninka'],
  anka: ['anna', 'anicka', 'aninka'],
  // Kristyna/Kristina
  kristyna: ['kristina', 'kristy', 'kristi', 'kristynka'],
  kristina: ['kristyna', 'kristy', 'kristi', 'kristynka'],
  // Lucie/Lucia
  lucie: ['lucia', 'lucka', 'lucy', 'lucinka'],
  lucia: ['lucie', 'lucka', 'lucy', 'lucinka'],
  lucka: ['lucie', 'lucia', 'lucy'],
  // Tereza/Teresa
  tereza: ['teresa', 'teri', 'terka', 'terezka'],
  teresa: ['tereza', 'teri', 'terka', 'terezka'],
  terka: ['tereza', 'teresa', 'teri'],
  // Aneta
  aneta: ['anetta', 'anet', 'anetka'],
  anetka: ['aneta', 'anetta'],
  // Andrea
  andrea: ['andrejka', 'andi', 'andulka'],
  // Simona
  simona: ['simone', 'simi', 'simonka'],
  // Daniela
  daniela: ['danielle', 'daniella', 'dani', 'danka', 'danecka'],
  danka: ['daniela', 'danielle', 'daniella', 'dani'],
  // Barbora
  barbora: ['barbara', 'barborka', 'bara', 'barca', 'baruska'],
  barborka: ['barbora', 'barbara', 'bara'],
  // Monika
  monika: ['monica', 'monca', 'monicka'],
  monca: ['monika', 'monica'],
  // Petra
  petra: ['petruska', 'petricka', 'petruse'],
  // Veronika
  veronika: ['veronica', 'verunka', 'vera', 'veruse', 'verca'],
  verunka: ['veronika', 'veronica', 'vera'],
  // Dominika
  dominika: ['dominique', 'domca', 'dominicka'],
  domca: ['dominika', 'dominique'],
  // Karolina
  karolina: ['carolina', 'karolinka', 'karla'],
  karolinka: ['karolina', 'carolina'],
  // Sara
  sara: ['sarka', 'saruska', 'sarah'],
  sarka: ['sara', 'saruska'],
  // Dana
  dana: ['danuska', 'danka', 'danuse'],
  // Eliska
  eliska: ['eliza', 'elizabeth', 'eli', 'elicka'],
  elizabeth: ['eliska', 'eliza', 'eli', 'elicka'],
  // Jessica
  jessica: ['jesicka', 'jess', 'jessie'],
  // Luna
  luna: ['lunka', 'lunicka'],
  // Lyra
  lyra: ['lyrka'],
  // Rebeca
  rebeca: ['rebeka', 'rebecca', 'rebi', 'rebecka'],
  rebeka: ['rebeca', 'rebecca', 'rebi'],
};

// ---------------------------------------------------------------------------
// Diacritics removal
// ---------------------------------------------------------------------------

const DIACRITICS_MAP: Record<string, string> = {
  á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i',
  ň: 'n', ó: 'o', ř: 'r', š: 's', ť: 't', ú: 'u',
  ů: 'u', ý: 'y', ž: 'z',
};

function removeDiacritics(str: string): string {
  return str.replace(/[áčďéěíňóřšťúůýž]/gi, (ch) => DIACRITICS_MAP[ch.toLowerCase()] ?? ch);
}

/**
 * Normalize a name for comparison: lowercase, remove diacritics, trim.
 */
export function normalizeName(name: string): string {
  return removeDiacritics(name.toLowerCase().trim());
}

// ---------------------------------------------------------------------------
// Levenshtein distance
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

// ---------------------------------------------------------------------------
// Main fuzzy match function
// ---------------------------------------------------------------------------

export interface FuzzyMatch {
  id: number;
  name: string;
  score: number; // 0 = perfect, higher = worse
}

/**
 * Find the best fuzzy matches for a query among a list of girl names.
 *
 * Scoring (lower = better):
 *   0 — exact match (after normalization)
 *   0 — alias match (known variant)
 *   1..N — Levenshtein distance
 *
 * Returns matches sorted by score, filtered to max distance 3.
 * Returns empty array if no reasonable match found.
 */
// ---------------------------------------------------------------------------
// Shared girl ID resolver — used by all tools that accept girlId/girlName
// ---------------------------------------------------------------------------

export type ResolveResult =
  | { ok: true; girlId: number; girlName: string }
  | { ok: false; error: string; suggestions?: Array<{ id: number; name: string }> };

/**
 * Resolve a girl by ID or name (with fuzzy fallback).
 * - If girlId is provided, returns it directly (with name lookup).
 * - If girlName is provided, tries exact SQL match then fuzzy.
 * - Returns disambiguation if multiple fuzzy matches.
 */
export async function resolveGirlId(
  _db: typeof db,
  input: Record<string, unknown>,
): Promise<ResolveResult> {
  const girlId = input.girlId as number | undefined;
  const girlName = input.girlName as string | undefined;

  if (girlId) {
    // Verify the girl exists and is active
    const result = await _db.execute({
      sql: "SELECT id, name FROM girls WHERE id = ? AND status = 'active' LIMIT 1",
      args: [girlId],
    });
    if (result.rows.length === 0) {
      return { ok: false, error: 'Divka s timto ID nenalezena.' };
    }
    return { ok: true, girlId: Number(result.rows[0].id), girlName: String(result.rows[0].name) };
  }

  if (girlName) {
    // Try exact match first
    const exact = await _db.execute({
      sql: "SELECT id, name FROM girls WHERE LOWER(name) = LOWER(?) AND status = 'active' LIMIT 1",
      args: [girlName],
    });
    if (exact.rows.length > 0) {
      return { ok: true, girlId: Number(exact.rows[0].id), girlName: String(exact.rows[0].name) };
    }

    // Fuzzy fallback
    const allGirls = await _db.execute({
      sql: "SELECT id, name FROM girls WHERE status = 'active'",
      args: [],
    });
    const girls = allGirls.rows.map((r) => ({ id: Number(r.id), name: String(r.name) }));
    const matches = fuzzyMatchGirls(girlName, girls);

    if (matches.length === 1 || (matches.length > 0 && matches[0].score === 0)) {
      return { ok: true, girlId: matches[0].id, girlName: matches[0].name };
    }
    if (matches.length > 1) {
      return {
        ok: false,
        error: `fuzzy_multiple`,
        suggestions: matches.slice(0, 5).map((m) => ({ id: m.id, name: m.name })),
      };
    }

    return { ok: false, error: 'Divka nenalezena.' };
  }

  return { ok: false, error: 'Zadej girlId nebo girlName.' };
}

// ---------------------------------------------------------------------------
// Core fuzzy match function
// ---------------------------------------------------------------------------

export function fuzzyMatchGirls(
  query: string,
  girls: Array<{ id: number; name: string }>,
): FuzzyMatch[] {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) return [];

  const MAX_DISTANCE = 3;
  const matches: FuzzyMatch[] = [];

  for (const girl of girls) {
    const normalizedName = normalizeName(girl.name);

    // Exact match after normalization
    if (normalizedName === normalizedQuery) {
      matches.push({ id: girl.id, name: girl.name, score: 0 });
      continue;
    }

    // Alias match
    const aliases = NAME_ALIASES[normalizedQuery];
    if (aliases && aliases.includes(normalizedName)) {
      matches.push({ id: girl.id, name: girl.name, score: 0 });
      continue;
    }

    // Reverse alias: check if the girl's name has aliases matching the query
    const girlAliases = NAME_ALIASES[normalizedName];
    if (girlAliases && girlAliases.includes(normalizedQuery)) {
      matches.push({ id: girl.id, name: girl.name, score: 0 });
      continue;
    }

    // Prefix match (query is start of name or vice versa, min 3 chars)
    if (normalizedQuery.length >= 3 && normalizedName.startsWith(normalizedQuery)) {
      matches.push({ id: girl.id, name: girl.name, score: 1 });
      continue;
    }
    if (normalizedName.length >= 3 && normalizedQuery.startsWith(normalizedName)) {
      matches.push({ id: girl.id, name: girl.name, score: 1 });
      continue;
    }

    // Levenshtein distance
    const dist = levenshtein(normalizedQuery, normalizedName);
    if (dist <= MAX_DISTANCE) {
      matches.push({ id: girl.id, name: girl.name, score: dist });
    }
  }

  return matches.sort((a, b) => a.score - b.score);
}
