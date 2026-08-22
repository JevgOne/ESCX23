/**
 * Parse a list column that is written in two different formats.
 *
 * The admin panel stores `languages` as CSV (lib/admin-actions.ts) while the
 * girl's own studio stores it as a JSON array (lib/studio-actions.ts). A
 * JSON-only reader silently drops every CSV row, which is how languages
 * disappeared from the mobile profile header for admin-entered girls while
 * still showing on desktop.
 *
 * Accepts a real array, a JSON array string, or a comma-separated string.
 */
export function parseList(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);

  const s = String(raw).trim();
  if (s === '') return [];

  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(String).map((v) => v.trim()).filter(Boolean);
    } catch {
      /* malformed JSON — fall through to CSV */
    }
  }

  return s.split(',').map((v) => v.trim()).filter(Boolean);
}
