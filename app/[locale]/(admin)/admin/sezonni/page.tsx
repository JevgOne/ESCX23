/**
 * Admin — Seasonal Decorations Settings
 * Allows admin to force-enable/disable seasonal themes or set auto mode.
 */

import { requireAdmin } from '@/lib/auth';
import { getActiveTheme, getSeasonalOverride, setSeasonalOverride, SEASONS } from '@/lib/seasonal';
import type { SeasonalTheme } from '@/lib/seasonal';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function updateTheme(formData: FormData) {
  'use server';
  const user = await requireAdmin();
  if (user.role !== 'admin') return;

  const value = formData.get('theme') as string;
  if (!value) return;

  await setSeasonalOverride(value);
  revalidatePath('/');
}

export default async function SeasonalSettingsPage() {
  await requireAdmin();

  const [override, activeTheme] = await Promise.all([
    getSeasonalOverride(),
    getActiveTheme(),
  ]);

  const isAuto = override === 'auto';
  const forcedTheme = override.startsWith('force:') ? override.replace('force:', '') : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="ss-page">
        <div className="ss-header">
          <h1 className="ss-title">Sezonni vyzdoba</h1>
          <p className="ss-subtitle">Sprava sezonni vyzdoby webu — automaticky podle data nebo rucne.</p>
        </div>

        {/* Current status */}
        <div className="ss-status-card">
          <div className="ss-status-row">
            <span className="ss-status-label">Rezim:</span>
            <span className={`ss-status-value ${isAuto ? 'ss-auto' : forcedTheme === 'none' ? 'ss-off' : 'ss-forced'}`}>
              {isAuto ? 'Automaticky' : forcedTheme === 'none' ? 'Vypnuto' : `Zapnuto (${forcedTheme})`}
            </span>
          </div>
          <div className="ss-status-row">
            <span className="ss-status-label">Aktivni tema:</span>
            <span className="ss-status-value">
              {activeTheme === 'none' ? (
                <span style={{ color: 'var(--dim)' }}>Zadne</span>
              ) : (
                <>
                  {SEASONS.find(s => s.theme === activeTheme)?.emoji}{' '}
                  {SEASONS.find(s => s.theme === activeTheme)?.label}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Theme cards */}
        <div className="ss-section-title">Dostupna temata</div>
        <div className="ss-themes">
          {SEASONS.map((season) => {
            const isActive = activeTheme === season.theme;
            const isForced = forcedTheme === season.theme;
            return (
              <div key={season.theme} className={`ss-theme-card${isActive ? ' active' : ''}`}>
                <div className="ss-theme-top">
                  <span className="ss-theme-emoji">{season.emoji}</span>
                  <div className="ss-theme-info">
                    <span className="ss-theme-name">{season.label}</span>
                    <span className="ss-theme-dates">{season.autoStart} — {season.autoEnd}</span>
                  </div>
                  {isActive && <span className="ss-active-badge">AKTIVNI</span>}
                </div>
                <div className="ss-theme-actions">
                  {isForced ? (
                    <form action={updateTheme}>
                      <input type="hidden" name="theme" value="auto" />
                      <button type="submit" className="ss-btn ss-btn-secondary">Prepnout na auto</button>
                    </form>
                  ) : (
                    <form action={updateTheme}>
                      <input type="hidden" name="theme" value={`force:${season.theme}`} />
                      <button type="submit" className="ss-btn ss-btn-primary">Zapnout</button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mode controls */}
        <div className="ss-section-title">Rezimy</div>
        <div className="ss-modes">
          <form action={updateTheme} className="ss-mode-row">
            <input type="hidden" name="theme" value="auto" />
            <div className="ss-mode-info">
              <span className={`ss-mode-name${isAuto ? ' active' : ''}`}>Automaticky</span>
              <span className="ss-mode-desc">Aktivuje se podle data (Prague timezone)</span>
            </div>
            <button type="submit" className={`ss-btn ${isAuto ? 'ss-btn-active' : 'ss-btn-secondary'}`} disabled={isAuto}>
              {isAuto ? 'Aktivni' : 'Nastavit'}
            </button>
          </form>
          <form action={updateTheme} className="ss-mode-row">
            <input type="hidden" name="theme" value="force:none" />
            <div className="ss-mode-info">
              <span className={`ss-mode-name${forcedTheme === 'none' ? ' active' : ''}`}>Vypnuto</span>
              <span className="ss-mode-desc">Zadna sezonni vyzdoba</span>
            </div>
            <button type="submit" className={`ss-btn ${forcedTheme === 'none' ? 'ss-btn-active' : 'ss-btn-secondary'}`} disabled={forcedTheme === 'none'}>
              {forcedTheme === 'none' ? 'Aktivni' : 'Vypnout vse'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const STYLES = `
.ss-page { max-width: 700px; margin: 0 auto; }
.ss-header { margin-bottom: 24px; }
.ss-title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.ss-subtitle { font-size: 13px; color: var(--dim); }
.ss-section-title {
  font-size: 11px; color: var(--dim); text-transform: uppercase;
  letter-spacing: 0.08em; font-weight: 700; margin: 24px 0 10px;
}

.ss-status-card {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 12px; padding: 16px; margin-bottom: 8px;
}
.ss-status-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 0;
}
.ss-status-label { font-size: 13px; color: var(--muted); }
.ss-status-value { font-size: 13px; font-weight: 600; }
.ss-auto { color: #4ade80; }
.ss-forced { color: #fbbf24; }
.ss-off { color: var(--dim); }

.ss-themes { display: flex; flex-direction: column; gap: 8px; }
.ss-theme-card {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 12px; padding: 14px 16px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px;
}
.ss-theme-card.active { border-color: var(--coral); }
.ss-theme-top { display: flex; align-items: center; gap: 12px; flex: 1; }
.ss-theme-emoji { font-size: 28px; }
.ss-theme-info { display: flex; flex-direction: column; gap: 2px; }
.ss-theme-name { font-size: 14px; font-weight: 600; }
.ss-theme-dates { font-size: 11px; color: var(--dim); font-family: ui-monospace, monospace; }
.ss-active-badge {
  font-size: 9px; font-weight: 800; color: var(--coral);
  background: rgba(242,125,141,0.12); padding: 3px 8px;
  border-radius: 999px; letter-spacing: 0.06em;
}
.ss-theme-actions { flex-shrink: 0; }

.ss-modes { display: flex; flex-direction: column; gap: 8px; }
.ss-mode-row {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 12px; padding: 14px 16px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px;
}
.ss-mode-info { display: flex; flex-direction: column; gap: 2px; }
.ss-mode-name { font-size: 14px; font-weight: 600; }
.ss-mode-name.active { color: var(--coral); }
.ss-mode-desc { font-size: 12px; color: var(--dim); }

.ss-btn {
  padding: 6px 14px; border-radius: 8px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: inherit; border: none; transition: all 0.15s;
}
.ss-btn:disabled { opacity: 0.5; cursor: default; }
.ss-btn-primary {
  background: var(--coral); color: #fff;
}
.ss-btn-primary:hover:not(:disabled) { opacity: 0.85; }
.ss-btn-secondary {
  background: var(--bg); border: 1px solid var(--line);
  color: var(--muted);
}
.ss-btn-secondary:hover:not(:disabled) { border-color: var(--coral); color: var(--coral); }
.ss-btn-active {
  background: rgba(242,125,141,0.12); color: var(--coral);
}
`;
