/**
 * Seasonal decoration system — centralized theme management.
 * Supports: halloween, christmas, valentine, newyear
 * Admin can override via site_settings.seasonal_theme
 */

import { db } from './db';

export type SeasonalTheme = 'none' | 'halloween' | 'christmas' | 'valentine' | 'newyear' | 'easter';

export interface SeasonalConfig {
  theme: SeasonalTheme;
  autoStart: string;  // MM-DD
  autoEnd: string;    // MM-DD
  label: string;
  emoji: string;
}

export const SEASONS: SeasonalConfig[] = [
  { theme: 'halloween',  autoStart: '10-20', autoEnd: '11-02', label: 'Halloween',  emoji: '🎃' },
  { theme: 'newyear',    autoStart: '12-28', autoEnd: '01-03', label: 'Silvestr',    emoji: '🎆' },
  { theme: 'christmas',  autoStart: '12-17', autoEnd: '12-27', label: 'Vánoce',     emoji: '🎄' },
  { theme: 'valentine',  autoStart: '02-11', autoEnd: '02-15', label: 'Valentýn',    emoji: '💕' },
  { theme: 'easter',     autoStart: '04-10', autoEnd: '04-21', label: 'Velikonoce', emoji: '🐰' },
];

// ---------------------------------------------------------------------------
// DB queries
// ---------------------------------------------------------------------------

export async function getSeasonalOverride(): Promise<string> {
  try {
    const result = await db.execute({
      sql: "SELECT value FROM site_settings WHERE key = 'seasonal_theme'",
      args: [],
    });
    return result.rows[0]?.value ? String(result.rows[0].value) : 'auto';
  } catch {
    return 'auto';
  }
}

export async function setSeasonalOverride(value: string): Promise<void> {
  await db.execute({
    sql: `INSERT INTO site_settings (key, value, updated_at)
          VALUES ('seasonal_theme', ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
    args: [value, value],
  });
}

// ---------------------------------------------------------------------------
// Theme resolution
// ---------------------------------------------------------------------------

function getAutoTheme(): SeasonalTheme {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' })
  );
  const m = now.getMonth() + 1; // 1-based
  const d = now.getDate();
  const mmdd = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  for (const season of SEASONS) {
    const start = season.autoStart;
    const end = season.autoEnd;

    if (start <= end) {
      // Normal range (e.g., 10-20 to 11-02)
      if (mmdd >= start && mmdd <= end) return season.theme;
    } else {
      // Wraps around year boundary (e.g., 12-28 to 01-03)
      if (mmdd >= start || mmdd <= end) return season.theme;
    }
  }

  return 'none';
}

/**
 * Get the currently active seasonal theme.
 * Checks admin override first, then falls back to auto-detection by date.
 */
export async function getActiveTheme(): Promise<SeasonalTheme> {
  const override = await getSeasonalOverride();

  if (override.startsWith('force:')) {
    const forced = override.replace('force:', '') as SeasonalTheme;
    if (forced === 'none' || SEASONS.some(s => s.theme === forced)) {
      return forced;
    }
  }

  // Default: auto-detect by Prague date
  return getAutoTheme();
}
