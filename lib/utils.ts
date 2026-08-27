export function formatPrice(czk: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(czk);
}

export function formatPragueTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    timeZone: 'Europe/Prague',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function pragueDayOfWeek(date: Date = new Date()): number {
  const pragueDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const jsDay = pragueDate.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function pragueDateISO(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function timeRange(from: string | null, to: string | null): string | null {
  if (!from || !to) return null;
  return `${displayTime(from)} — ${displayTime(to)}`;
}

// ── Night shift helpers (+24h convention) ──────────────────────────────────

/** Convert +24h stored time to display format: "31:00" → "07:00" */
export function displayTime(time: string): string {
  const h = parseInt(time.split(':')[0]);
  if (h >= 24) {
    return `${String(h - 24).padStart(2, '0')}:${time.split(':')[1]}`;
  }
  return time.substring(0, 5);
}

/** Convert user input to +24h storage: detects cross-midnight. */
export function toStorageTime(from: string, to: string): { from: string; to: string } {
  if (to < from) {
    const [h, m] = to.split(':').map(Number);
    return { from, to: `${h + 24}:${String(m).padStart(2, '0')}` };
  }
  return { from, to };
}

/** Check if current time falls within a shift (handles +24h convention). */
export function isWithinShift(now: string, from: string, to: string): boolean {
  const toH = parseInt(to.split(':')[0]);
  if (toH >= 24) {
    const nowH = parseInt(now.split(':')[0]);
    const adjustedNow = now < from
      ? `${nowH + 24}:${now.split(':')[1]}`
      : now;
    return adjustedNow >= from && adjustedNow <= to;
  }
  return now >= from && now <= to;
}

/** Check if current time is before shift start. */
export function isBeforeShift(now: string, from: string, to: string): boolean {
  const toH = parseInt(to.split(':')[0]);
  if (toH >= 24) {
    // Cross-midnight: "before" means after the shift ended (morning) but before it starts again
    const displayTo = displayTime(to);
    return now > displayTo && now < from;
  }
  return now < from;
}

/** Check if shift has ended (for filtering out past shifts). */
export function isShiftEnded(now: string, from: string, to: string): boolean {
  const toH = parseInt(to.split(':')[0]);
  if (toH >= 24) {
    // Cross-midnight: ended only if we're in the gap between morning end and evening start
    const displayTo = displayTime(to);
    return now > displayTo && now < from;
  }
  return now > to;
}

export type ShiftCategory = 'morning' | 'afternoon' | 'allday' | 'allevening' | 'night';

export function classifyShift(from: string, to: string): ShiftCategory {
  const startH = parseInt(from.split(':')[0]);
  const endH = parseInt(to.split(':')[0]);

  // Cross-midnight: end_time >= 24 (stored as 24+)
  if (endH >= 24) {
    return startH >= 23 ? 'night' : 'allevening';
  }
  // Same-day shifts
  if (startH < 12 && endH >= 20) return 'allday';
  if (startH < 14) return 'morning';
  return 'afternoon';
}

const DAY_NAMES_CS = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const DAY_NAMES_CS_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

export function dayNameCs(dayOfWeek: number, short = false): string {
  return short ? DAY_NAMES_CS_SHORT[dayOfWeek] : DAY_NAMES_CS[dayOfWeek];
}

/** @deprecated Use locations.display_name from DB via schedule JOIN instead */
export function prettyDistrict(location: string | null | undefined): string | null {
  if (!location || location.trim() === '' || location.trim() === 'Praha') return null;
  return location;
}

const CITY_MAP: Record<string, Record<string, string>> = {
  cs: { Praha: 'Praha' },
  en: { Praha: 'Prague' },
  de: { Praha: 'Prag' },
  uk: { Praha: 'Прага' },
};

/** Translate location string — replaces "Praha" anywhere (e.g. "Žižkov, Praha 3" → "Žižkov, Prague 3"). */
export function translateLocation(location: string | null, locale: string): string | null {
  if (!location) return null;
  const map = CITY_MAP[locale] ?? CITY_MAP.en;
  let result = location;
  for (const [cz, localized] of Object.entries(map)) {
    if (result.includes(cz)) {
      result = result.replaceAll(cz, localized);
    }
  }
  return result;
}

export function formatOpeningDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const month = d.getMonth() + 1;
  if (locale === 'en') {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${day}`;
  }
  return `${day}.${month}.`;
}

/**
 * "3 days ago" in the reader's language.
 *
 * This used to return Czech unconditionally, so the English homepage showed
 * "a 5★ review včera" next to English copy — and the Czech was wrong too:
 * a single `před ${n} týdny` gave "před 1 týdny" instead of "před 1 týdnem".
 * Czech needs three forms (1 / 2–4 / 5+), so the units are spelled out.
 */
type Unit = 'today' | 'yesterday' | 'day' | 'week' | 'month';

const RELATIVE: Record<string, Record<Unit, (n: number) => string>> = {
  cs: {
    today: () => 'dnes',
    yesterday: () => 'včera',
    day: (n) => `před ${n} ${n < 5 ? 'dny' : 'dny'}`,
    week: (n) => `před ${n} ${n === 1 ? 'týdnem' : n < 5 ? 'týdny' : 'týdny'}`,
    month: (n) => `před ${n} ${n === 1 ? 'měsícem' : n < 5 ? 'měsíci' : 'měsíci'}`,
  },
  en: {
    today: () => 'today',
    yesterday: () => 'yesterday',
    day: (n) => `${n} days ago`,
    week: (n) => `${n} ${n === 1 ? 'week' : 'weeks'} ago`,
    month: (n) => `${n} ${n === 1 ? 'month' : 'months'} ago`,
  },
  de: {
    today: () => 'heute',
    yesterday: () => 'gestern',
    day: (n) => `vor ${n} Tagen`,
    week: (n) => `vor ${n} ${n === 1 ? 'Woche' : 'Wochen'}`,
    month: (n) => `vor ${n} ${n === 1 ? 'Monat' : 'Monaten'}`,
  },
  uk: {
    today: () => 'сьогодні',
    yesterday: () => 'вчора',
    day: (n) => `${n} дн. тому`,
    week: (n) => `${n} тиж. тому`,
    month: (n) => `${n} міс. тому`,
  },
};

export function relativeTime(date: Date | string, locale: string = 'cs'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const L = RELATIVE[locale] ?? RELATIVE.cs;

  if (diffDays < 1) return L.today(0);
  if (diffDays === 1) return L.yesterday(1);
  if (diffDays < 7) return L.day(diffDays);
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return L.week(diffWeeks);
  return L.month(Math.floor(diffDays / 30));
}

