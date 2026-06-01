/**
 * Convert any Google Calendar URL to a proper embed URL.
 *
 * Accepted formats:
 *   - https://calendar.google.com/calendar/embed?src=... (already embed — pass through)
 *   - https://calendar.google.com/calendar/u/0?cid=BASE64  (sharing link — decode cid)
 *   - raw calendar ID like abc@group.calendar.google.com
 */
export function toCalendarEmbedUrl(raw: string): string {
  const trimmed = raw.trim();

  // Already an embed URL
  if (trimmed.includes('/calendar/embed')) {
    return trimmed;
  }

  // Sharing link with ?cid= param (base64-encoded calendar ID)
  const cidMatch = trimmed.match(/[?&]cid=([A-Za-z0-9+/=_-]+)/);
  if (cidMatch) {
    try {
      const calendarId = Buffer.from(cidMatch[1], 'base64').toString('utf-8');
      return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`;
    } catch {
      // fallback — use raw
    }
  }

  // Looks like a raw calendar ID (contains @)
  if (trimmed.includes('@') && !trimmed.startsWith('http')) {
    return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(trimmed)}`;
  }

  // Unknown format — return as-is
  return trimmed;
}
