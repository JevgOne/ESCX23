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
  return `${from.substring(0, 5)} — ${to.substring(0, 5)}`;
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

export function relativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'dnes';
  if (diffDays === 1) return 'včera';
  if (diffDays < 7) return `před ${diffDays} dny`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `před ${diffWeeks} týdny`;
  const diffMonths = Math.floor(diffDays / 30);
  return `před ${diffMonths} měsíci`;
}
