import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { db } from '@/lib/db';
import { getGirlById, getActivePricingPlans, getSchedulesForGirl, getActiveLocations } from '@/lib/queries';
import { HASHTAGS } from '@/lib/hashtags';
import { pragueDateISO } from '@/lib/utils';
import { onboardingStep1, onboardingStep3, completeOnboarding } from './actions';
import { submitShiftRequest, cancelShiftRequest } from '../dostupnost/actions';

export const dynamic = 'force-dynamic';

// ── Constants ──

const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Zakladni',
  oral: 'Oralni',
  special: 'Specialni',
  massage: 'Masaze',
  extras: 'Extra',
  types: 'Typ setkani',
};
const CATEGORY_ORDER = ['basic', 'oral', 'special', 'massage', 'extras', 'types'];

const LANGUAGES = [
  { code: 'cs', label: 'Cestina' },
  { code: 'en', label: 'Anglictina' },
  { code: 'de', label: 'Nemcina' },
  { code: 'uk', label: 'Ukrajinstina' },
  { code: 'ru', label: 'Rustina' },
  { code: 'sk', label: 'Slovenstina' },
  { code: 'es', label: 'Spanelstina' },
  { code: 'fr', label: 'Francouzstina' },
  { code: 'it', label: 'Italstina' },
  { code: 'pt', label: 'Portugalstina' },
  { code: 'pl', label: 'Polstina' },
  { code: 'ro', label: 'Rumunstina' },
  { code: 'hu', label: 'Madarstina' },
];

const HASHTAG_CATEGORY_LABELS: Record<string, string> = {
  appearance: 'Vzhled',
  body: 'Postava',
  age: 'Vek',
  profession: 'Profese',
  origin: 'Puvod',
  style: 'Styl',
};
const HASHTAG_CATEGORY_ORDER = ['appearance', 'body', 'age', 'profession', 'origin', 'style'];

const SHIFT_PRESETS = [
  { type: 'morning', label: 'Ranni', time: '10:00 - 16:00' },
  { type: 'afternoon', label: 'Odpoledni', time: '16:30 - 22:30' },
  { type: 'fullday', label: 'Cely den', time: '10:00 - 22:00' },
] as const;

const DAY_SHORT = ['Po', 'Ut', 'St', 'Ct', 'Pa', 'So', 'Ne'];

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

// ── Page ──

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ step?: string; error?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;

  // Step 1 is the only required gate (password change).
  // If force_password_change is still 1, always show step 1.
  const rawStep = Number(sp.step || 1);
  const step = user.force_password_change ? 1 : Math.max(1, Math.min(5, rawStep));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: onboardingCSS }} />

      <div className="ob-shell">
        <div className="ob-header">
          <div className="ob-logo">SF</div>
          <span className="ob-brand">STUDIOFLOW</span>
        </div>

        {/* Progress bar */}
        <div className="ob-progress">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className={`ob-step${s === step ? ' active' : ''}${s < step ? ' done' : ''}`}>
              <span className="ob-step-num">{s < step ? '\u2713' : s}</span>
              <span className="ob-step-label">
                {s === 1 && 'Heslo'}
                {s === 2 && 'Profil'}
                {s === 3 && 'Sluzby'}
                {s === 4 && 'Smeny'}
                {s === 5 && 'Hotovo'}
              </span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="ob-content">
          {step === 1 && <Step1 locale={locale} error={sp.error} />}
          {step === 2 && <Step2 locale={locale} girlId={girlId} />}
          {step === 3 && <Step3 locale={locale} girlId={girlId} />}
          {step === 4 && <Step4 locale={locale} girlId={girlId} />}
          {step === 5 && <Step5 locale={locale} girlId={girlId} />}
        </div>
      </div>
    </>
  );
}

// ── Step 1: Change password + personal message ──

function Step1({ locale, error }: { locale: string; error?: string }) {
  return (
    <>
      <h2 className="ob-title">Zmena hesla</h2>
      <p className="ob-sub">
        Zadej heslo, ktere ti bylo zaslano, a zvol si nove heslo (min. 8 znaku).
      </p>

      {error === 'missing' && <p className="ob-error">Vyplnte vsechna pole.</p>}
      {error === 'short' && <p className="ob-error">Nove heslo musi mit alespon 8 znaku.</p>}
      {error === 'mismatch' && <p className="ob-error">Hesla se neshoduji.</p>}
      {error === 'wrong' && <p className="ob-error">Soucasne heslo neni spravne.</p>}

      <form action={onboardingStep1} className="ob-form">
        <div className="ob-field">
          <label htmlFor="currentPassword">AKTUALNI HESLO</label>
          <input id="currentPassword" name="currentPassword" type="password" required
            placeholder="Heslo z SMS/emailu" autoComplete="current-password" />
        </div>
        <div className="ob-field">
          <label htmlFor="newPassword">NOVE HESLO</label>
          <input id="newPassword" name="newPassword" type="password" required
            placeholder="Min. 8 znaku" autoComplete="new-password" minLength={8} />
        </div>
        <div className="ob-field">
          <label htmlFor="confirmPassword">POTVRZENI HESLA</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required
            placeholder="Znovu nove heslo" autoComplete="new-password" />
        </div>

        <hr className="ob-divider" />

        <div className="ob-field">
          <label htmlFor="personal_message">OSOBNI ZPRAVA (volitelne)</label>
          <textarea id="personal_message" name="personal_message" maxLength={160}
            placeholder="Kratky citat ci pozdrav pro klienty (max 160 znaku)"
            rows={3} />
        </div>

        <button type="submit" className="ob-btn">Zmenit heslo a pokracovat</button>
      </form>
    </>
  );
}

// ── Step 2: Profile overview (read-only) ──

async function Step2({ locale, girlId }: { locale: string; girlId: number }) {
  const girl = await getGirlById(girlId);
  const photoRes = await db.execute({
    sql: 'SELECT url FROM girl_photos WHERE girl_id = ? ORDER BY display_order, id LIMIT 8',
    args: [girlId],
  });
  const photos = photoRes.rows.map(r => String(r.url));

  return (
    <>
      <h2 className="ob-title">Tvuj profil</h2>
      <p className="ob-sub">Admin nastavil tvuj profil z prihlasky. Pokud neco nesedi, kontaktuj management.</p>

      {girl && (() => {
        const g = girl as Record<string, unknown>;
        const name = String(g.name ?? '');
        const age = String(g.age ?? '');
        const height = g.height ? String(g.height) : null;
        const weight = g.weight ? String(g.weight) : null;
        const bust = g.bust ? String(g.bust) : null;
        const hair = g.hair ? String(g.hair) : null;
        const eyes = g.eyes ? String(g.eyes) : null;
        return (
          <div className="ob-readonly-card">
            <div className="ob-readonly-row"><span>Jmeno:</span> <strong>{name}</strong></div>
            <div className="ob-readonly-row"><span>Vek:</span> <strong>{age}</strong></div>
            {height && <div className="ob-readonly-row"><span>Vyska:</span> <strong>{height} cm</strong></div>}
            {weight && <div className="ob-readonly-row"><span>Vaha:</span> <strong>{weight} kg</strong></div>}
            {bust && <div className="ob-readonly-row"><span>Prsa:</span> <strong>{bust}</strong></div>}
            {hair && <div className="ob-readonly-row"><span>Vlasy:</span> <strong>{hair}</strong></div>}
            {eyes && <div className="ob-readonly-row"><span>Oci:</span> <strong>{eyes}</strong></div>}
          </div>
        );
      })()}

      <h3 className="ob-section-title">Tvoje fotky</h3>
      {photos.length === 0 ? (
        <div className="ob-info-box warn">
          Fotky zatim nemas -- admin je nahraje. Kontaktuj management.
        </div>
      ) : (
        <>
          <div className="ob-info-box ok">
            Admin nahral {photos.length} {photos.length === 1 ? 'fotku' : photos.length < 5 ? 'fotky' : 'fotek'}. Nove fotky posilej managementu ke schvaleni.
          </div>
          <div className="ob-photo-grid">
            {photos.map((url, i) => (
              <img key={i} src={url} alt="" className="ob-photo" loading="lazy" />
            ))}
          </div>
        </>
      )}

      <h3 className="ob-section-title">Co muzes doplnit pozdeji</h3>
      <div className="ob-info-box neutral">
        Po dokonceni wizardu muzes v menu pridat: hlasovou zpravu, videa, stories.
      </div>

      <div className="ob-nav">
        <a href={`/${locale}/studio/onboarding?step=1`} className="ob-btn secondary">Zpet</a>
        <a href={`/${locale}/studio/onboarding?step=3`} className="ob-btn">Dalsi</a>
      </div>
    </>
  );
}

// ── Step 3: Services + languages + hashtags + program ──

async function Step3({ locale, girlId }: { locale: string; girlId: number }) {
  const [allSvcRes, girlSvcRes, girl, plans, hashtagsRes] = await Promise.all([
    db.execute('SELECT id, slug, name_cs, category FROM services ORDER BY category, id'),
    db.execute({ sql: 'SELECT service_id FROM girl_services WHERE girl_id = ?', args: [girlId] }),
    getGirlById(girlId),
    getActivePricingPlans(),
    db.execute({ sql: 'SELECT hashtags FROM girls WHERE id = ?', args: [girlId] }),
  ]);

  const activeServiceIds = new Set(girlSvcRes.rows.map(r => Number(r.service_id)));
  type SvcRow = { id: number; slug: string; name: string; category: string };
  const services: SvcRow[] = allSvcRes.rows.map(r => ({
    id: Number(r.id),
    slug: String(r.slug),
    name: String(r.name_cs),
    category: String(r.category),
  }));

  const groupedSvc = new Map<string, SvcRow[]>();
  for (const svc of services) {
    if (!groupedSvc.has(svc.category)) groupedSvc.set(svc.category, []);
    groupedSvc.get(svc.category)!.push(svc);
  }

  // Languages
  let currentLangs: string[] = [];
  if (girl) {
    const raw = (girl as Record<string, unknown>).languages;
    if (raw) {
      const s = String(raw).trim();
      try { currentLangs = s.startsWith('[') ? JSON.parse(s) : s.split(',').map((l: string) => l.trim()); } catch { /* */ }
    }
  }
  const activeLangs = new Set(currentLangs);

  // Hashtags
  let activeSlugs = new Set<string>();
  if (hashtagsRes.rows[0]?.hashtags) {
    try {
      const parsed = JSON.parse(String(hashtagsRes.rows[0].hashtags));
      if (Array.isArray(parsed)) activeSlugs = new Set(parsed);
    } catch { /* */ }
  }
  const groupedHash = new Map<string, typeof HASHTAGS>();
  for (const h of HASHTAGS) {
    if (!groupedHash.has(h.category)) groupedHash.set(h.category, []);
    groupedHash.get(h.category)!.push(h);
  }

  // Program
  const currentProgramId = girl?.preferred_program_id != null ? Number(girl.preferred_program_id) : null;
  type PlanRow = { id: unknown; duration: unknown; price: unknown; title_cs: unknown };
  const planTyped = plans as unknown as PlanRow[];

  return (
    <>
      <h2 className="ob-title">Sluzby a profil</h2>
      <p className="ob-sub">Vyber sluzby, jazyky, hashtagy a doporuceny program.</p>

      <form action={onboardingStep3} className="ob-form">
        {/* Services */}
        <h3 className="ob-section-title">Sluzby</h3>
        {CATEGORY_ORDER.map(cat => {
          const items = groupedSvc.get(cat);
          if (!items || items.length === 0) return null;
          return (
            <div key={cat} className="ob-svc-group">
              <h4 className="ob-svc-cat">{CATEGORY_LABELS[cat] ?? cat}</h4>
              <div className="ob-chip-grid">
                {items.map(svc => (
                  <label key={svc.id} className={`ob-chip${activeServiceIds.has(svc.id) ? ' active' : ''}`}>
                    <input type="checkbox" name="services" value={svc.id} defaultChecked={activeServiceIds.has(svc.id)} />
                    <span>{svc.name}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <hr className="ob-divider" />

        {/* Languages */}
        <h3 className="ob-section-title">Jazyky</h3>
        <div className="ob-chip-grid">
          {LANGUAGES.map(lang => (
            <label key={lang.code} className={`ob-chip${activeLangs.has(lang.code) ? ' active' : ''}`}>
              <input type="checkbox" name="languages" value={lang.code} defaultChecked={activeLangs.has(lang.code)} />
              <span>{lang.label}</span>
            </label>
          ))}
        </div>

        <hr className="ob-divider" />

        {/* Hashtags */}
        <h3 className="ob-section-title">Hashtagy</h3>
        {HASHTAG_CATEGORY_ORDER.map(cat => {
          const items = groupedHash.get(cat);
          if (!items || items.length === 0) return null;
          return (
            <div key={cat} className="ob-svc-group">
              <h4 className="ob-svc-cat">{HASHTAG_CATEGORY_LABELS[cat] ?? cat}</h4>
              <div className="ob-chip-grid">
                {items.map(h => (
                  <label key={h.id} className={`ob-chip${activeSlugs.has(h.id) ? ' active' : ''}`}>
                    <input type="checkbox" name="hashtag_slugs" value={h.id} defaultChecked={activeSlugs.has(h.id)} />
                    <span>{h.translations.cs}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <hr className="ob-divider" />

        {/* Preferred program */}
        <h3 className="ob-section-title">Doporuceny program</h3>
        <div className="ob-program-list">
          <label className={`ob-program-option${currentProgramId === null ? ' selected' : ''}`}>
            <input type="radio" name="program_id" value="" defaultChecked={currentProgramId === null} />
            <span>Zadny</span>
          </label>
          {planTyped.map(plan => {
            const id = Number(plan.id);
            const duration = Number(plan.duration);
            const price = Number(plan.price);
            return (
              <label key={id} className={`ob-program-option${currentProgramId === id ? ' selected' : ''}`}>
                <input type="radio" name="program_id" value={id} defaultChecked={currentProgramId === id} />
                <span>{String(plan.title_cs ?? `${duration} min`)} -- {price.toLocaleString('cs-CZ')} Kc</span>
              </label>
            );
          })}
        </div>

        <div className="ob-nav">
          <a href={`/${locale}/studio/onboarding?step=2`} className="ob-btn secondary">Zpet</a>
          <button type="submit" className="ob-btn">Ulozit a pokracovat</button>
        </div>
      </form>
    </>
  );
}

// ── Step 4: Shifts ──

async function Step4({ locale, girlId }: { locale: string; girlId: number }) {
  const today = pragueDateISO();
  const nowPrague = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const thisMonday = getMonday(nowPrague);
  const nextMonday = addDays(thisMonday, 7);

  const [locations, shiftRes] = await Promise.all([
    getActiveLocations(),
    db.execute({
      sql: 'SELECT * FROM shift_requests WHERE girl_id = ? AND week_start IN (?, ?) ORDER BY week_start, day_of_week',
      args: [girlId, thisMonday, nextMonday],
    }),
  ]);

  type ShiftRow = { id: number; weekStart: string; dayOfWeek: number; shiftType: string; status: string };
  const shiftMap = new Map<string, ShiftRow>();
  for (const r of shiftRes.rows) {
    const key = `${r.week_start}_${r.day_of_week}`;
    shiftMap.set(key, {
      id: Number(r.id),
      weekStart: String(r.week_start),
      dayOfWeek: Number(r.day_of_week),
      shiftType: String(r.shift_type),
      status: String(r.status),
    });
  }

  const defaultLocationId = locations.find(l => l.isPrimary)?.id ?? locations[0]?.id ?? null;

  const weeks = [
    { label: 'Tento tyden', monday: thisMonday },
    { label: 'Pristi tyden', monday: nextMonday },
  ];

  function countActiveShifts(monday: string): number {
    let count = 0;
    for (let d = 0; d < 7; d++) {
      const shift = shiftMap.get(`${monday}_${d}`);
      if (shift && (shift.status === 'pending' || shift.status === 'approved')) count++;
    }
    return count;
  }

  const totalShifts = countActiveShifts(thisMonday) + countActiveShifts(nextMonday);

  return (
    <>
      <h2 className="ob-title">Smeny</h2>
      <p className="ob-sub">Prihlas se na prvni smeny. Doporucujeme alespon 2.</p>

      {totalShifts === 0 && (
        <div className="ob-info-box warn">Zatim nemas zadne smeny. Vyber alespon 2.</div>
      )}
      {totalShifts > 0 && totalShifts < 2 && (
        <div className="ob-info-box warn">Mas {totalShifts} {totalShifts === 1 ? 'smenu' : 'smeny'}. Doporucujeme alespon 2.</div>
      )}
      {totalShifts >= 2 && (
        <div className="ob-info-box ok">Minimum splneno ({totalShifts} smen).</div>
      )}

      <div className="ob-info-box neutral">
        Smeny zadavej kazdou nedeli do 22:00. Admin schvali a zobrazis se na webu. Schvalene smeny nelze rusit.
      </div>

      {weeks.map(week => (
        <div key={week.monday}>
          <h3 className="ob-section-title">{week.label}</h3>
          <div className="ob-shift-grid">
            {DAY_SHORT.map((dayLabel, i) => {
              const dateStr = addDays(week.monday, i);
              const isPast = dateStr <= today;
              const key = `${week.monday}_${i}`;
              const existing = shiftMap.get(key);

              return (
                <div key={i} className={`ob-shift-day${isPast ? ' past' : ''}`}>
                  <span className="ob-shift-label">{dayLabel}</span>
                  <span className="ob-shift-date">{formatDateShort(dateStr)}</span>

                  {existing ? (
                    <>
                      <span className={`ob-shift-badge ${existing.status}`}>
                        {existing.status === 'pending' && 'Ceka'}
                        {existing.status === 'approved' && 'OK'}
                        {existing.status === 'rejected' && 'X'}
                      </span>
                      <span className="ob-shift-type">
                        {existing.shiftType === 'morning' && 'Ranni'}
                        {existing.shiftType === 'afternoon' && 'Odp.'}
                        {existing.shiftType === 'fullday' && 'Cely'}
                      </span>
                      {existing.status === 'pending' && (
                        <form action={cancelShiftRequest}>
                          <input type="hidden" name="request_id" value={existing.id} />
                          <button type="submit" className="ob-shift-cancel">Zrusit</button>
                        </form>
                      )}
                    </>
                  ) : !isPast ? (
                    <div className="ob-shift-btns">
                      {SHIFT_PRESETS.map(preset => (
                        <form key={preset.type} action={submitShiftRequest}>
                          <input type="hidden" name="shift_type" value={preset.type} />
                          <input type="hidden" name="day_of_week" value={i} />
                          <input type="hidden" name="week_start" value={week.monday} />
                          <input type="hidden" name="location_id" value={defaultLocationId ?? ''} />
                          <button type="submit" className="ob-shift-btn">{preset.label}</button>
                        </form>
                      ))}
                    </div>
                  ) : (
                    <span className="ob-shift-type">--</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="ob-nav">
        <a href={`/${locale}/studio/onboarding?step=3`} className="ob-btn secondary">Zpet</a>
        <a href={`/${locale}/studio/onboarding?step=5`} className="ob-btn">Dalsi</a>
      </div>
    </>
  );
}

// ── Step 5: Summary + completion ──

async function Step5({ locale, girlId }: { locale: string; girlId: number }) {
  const [girl, svcRes, shiftRes, photoRes] = await Promise.all([
    getGirlById(girlId),
    db.execute({ sql: 'SELECT COUNT(*) AS cnt FROM girl_services WHERE girl_id = ?', args: [girlId] }),
    db.execute({
      sql: `SELECT COUNT(*) AS cnt FROM shift_requests WHERE girl_id = ? AND status IN ('pending', 'approved')`,
      args: [girlId],
    }),
    db.execute({ sql: 'SELECT COUNT(*) AS cnt FROM girl_photos WHERE girl_id = ?', args: [girlId] }),
  ]);

  const svcCount = Number(svcRes.rows[0]?.cnt ?? 0);
  const shiftCount = Number(shiftRes.rows[0]?.cnt ?? 0);
  const photoCount = Number(photoRes.rows[0]?.cnt ?? 0);

  const hasMessage = !!((girl as Record<string, unknown>)?.personal_message);

  let langCount = 0;
  if (girl) {
    const raw = (girl as Record<string, unknown>).languages;
    if (raw) {
      try {
        const parsed = JSON.parse(String(raw));
        if (Array.isArray(parsed)) langCount = parsed.length;
      } catch { /* */ }
    }
  }

  return (
    <>
      <h2 className="ob-title">Vsechno je nastaveno!</h2>
      <p className="ob-sub">Prehled tveho profilu a co se bude dit dal.</p>

      <div className="ob-summary">
        <div className="ob-summary-row ok">Heslo zmeneno</div>
        <div className={`ob-summary-row ${hasMessage ? 'ok' : 'warn'}`}>
          Osobni zprava: {hasMessage ? 'nastavena' : 'nenastavena'}
        </div>
        <div className={`ob-summary-row ${svcCount > 0 ? 'ok' : 'warn'}`}>
          Sluzby: {svcCount > 0 ? `${svcCount} vybranych` : 'zadne'}
        </div>
        <div className={`ob-summary-row ${langCount > 0 ? 'ok' : 'warn'}`}>
          Jazyky: {langCount > 0 ? `${langCount} vybranych` : 'zadne'}
        </div>
        <div className={`ob-summary-row ${shiftCount > 0 ? 'ok' : 'warn'}`}>
          Smeny: {shiftCount > 0 ? `${shiftCount} prihlasenych` : 'zadne'}
        </div>
        <div className="ob-summary-row info">
          Fotky: {photoCount > 0 ? `${photoCount} nahranych adminem` : 'ceka na admin'}
        </div>
        <div className="ob-summary-row info">Profil: nastaven adminem z prihlasky</div>
      </div>

      <h3 className="ob-section-title">Co se bude dit</h3>
      <ol className="ob-steps-list">
        <li>Admin overi tvuj profil a fotky</li>
        <li>Po verifikaci prepne tvuj profil na LIVE</li>
        <li>Zacnes dostavat rezervace!</li>
      </ol>

      <h3 className="ob-section-title">Dulezita pravidla</h3>
      <ul className="ob-rules-list">
        <li>Smeny: min 2/tyden, deadline nedele 22:00</li>
        <li>Uklid: 12-bodovy checklist, deadline ranni 16:30 / odpoledni+cely den 22:30, pokuta 500 Kc</li>
        <li>Dashboard: sleduj rezervace, potvrzuj prichod klientu</li>
      </ul>

      <h3 className="ob-section-title">Telegram bot</h3>
      <div className="ob-info-box neutral">
        Pres StudioFlow bot ti budou chodit upozorneni. Otevri Telegram, najdi @studioflow3_bot a klikni Start.
      </div>

      <h3 className="ob-section-title">PWA instalace</h3>
      <div className="ob-info-box neutral">
        iOS: Safari &gt; Sdilet &gt; Pridat na plochu.<br />
        Android: Chrome &gt; Menu &gt; Pridat na domovskou obrazovku.
      </div>

      <div className="ob-nav">
        <a href={`/${locale}/studio/onboarding?step=4`} className="ob-btn secondary">Zpet</a>
        <form action={completeOnboarding} style={{ display: 'inline' }}>
          <button type="submit" className="ob-btn">Prejit do Studia</button>
        </form>
      </div>
    </>
  );
}

// ── CSS ──

const onboardingCSS = `
  .ob-shell {
    max-width: 680px;
    margin: 0 auto;
    padding: 24px 16px 60px;
  }
  .ob-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
  }
  .ob-logo {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--color-coral, #e94e77), var(--color-magenta, #d63384));
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 14px; color: #fff;
    letter-spacing: 0.04em;
  }
  .ob-brand {
    font-weight: 800; font-size: 14px; letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-text, #fff);
  }

  /* Progress */
  .ob-progress {
    display: flex;
    gap: 4px;
    margin-bottom: 32px;
  }
  .ob-step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 4px;
    border-radius: 10px;
    background: var(--color-bg-elev, #1a1a2e);
    border: 1px solid var(--color-line, #2a2a3e);
    opacity: 0.4;
    transition: all 0.2s;
  }
  .ob-step.active {
    opacity: 1;
    border-color: var(--color-coral, #e94e77);
    background: rgba(233, 78, 119, 0.08);
  }
  .ob-step.done {
    opacity: 0.7;
  }
  .ob-step-num {
    width: 24px; height: 24px;
    border-radius: 50%;
    background: var(--color-bg-card, #1e1e32);
    border: 1px solid var(--color-line, #2a2a3e);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    color: var(--color-text-dim, #888);
  }
  .ob-step.active .ob-step-num {
    background: var(--color-coral, #e94e77);
    border-color: transparent;
    color: #fff;
  }
  .ob-step.done .ob-step-num {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.4);
    color: #22c55e;
  }
  .ob-step-label {
    font-size: 9px; font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-dim, #888);
  }
  .ob-step.active .ob-step-label { color: var(--color-coral, #e94e77); }

  /* Content */
  .ob-content { }
  .ob-title {
    font-size: 22px; font-weight: 800;
    margin-bottom: 8px;
    color: var(--color-text, #fff);
  }
  .ob-sub {
    font-size: 14px;
    color: var(--color-text-muted, #aaa);
    margin-bottom: 24px;
    line-height: 1.5;
  }
  .ob-section-title {
    font-size: 13px; font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-coral, #e94e77);
    margin: 24px 0 12px;
  }

  /* Form */
  .ob-form { }
  .ob-field {
    margin-bottom: 16px;
  }
  .ob-field label {
    display: block;
    font-size: 10px; font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-dim, #888);
    margin-bottom: 6px;
  }
  .ob-field input[type="password"],
  .ob-field input[type="text"],
  .ob-field textarea {
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid var(--color-line, #2a2a3e);
    background: var(--color-bg-elev, #1a1a2e);
    color: var(--color-text, #fff);
    font-size: 14px;
    font-family: inherit;
  }
  .ob-field textarea { resize: vertical; }

  .ob-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 13px;
    margin-bottom: 16px;
  }
  .ob-divider {
    border: 0;
    border-top: 1px solid var(--color-line, #2a2a3e);
    margin: 24px 0;
  }

  /* Buttons */
  .ob-btn {
    display: inline-block;
    padding: 12px 28px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    text-decoration: none;
    background: linear-gradient(135deg, var(--color-coral, #e94e77), var(--color-magenta, #d63384));
    color: #fff;
    transition: opacity 0.15s;
  }
  .ob-btn:hover { opacity: 0.9; }
  .ob-btn.secondary {
    background: var(--color-bg-elev, #1a1a2e);
    border: 1px solid var(--color-line, #2a2a3e);
    color: var(--color-text-muted, #aaa);
  }
  .ob-nav {
    display: flex;
    gap: 12px;
    margin-top: 32px;
    justify-content: space-between;
  }

  /* Info boxes */
  .ob-info-box {
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 13px;
    line-height: 1.5;
    margin-bottom: 16px;
  }
  .ob-info-box.ok {
    background: rgba(34, 197, 94, 0.08);
    border: 1px solid rgba(34, 197, 94, 0.25);
    color: #86efac;
  }
  .ob-info-box.warn {
    background: rgba(251, 191, 36, 0.08);
    border: 1px solid rgba(251, 191, 36, 0.25);
    color: #fde68a;
  }
  .ob-info-box.neutral {
    background: var(--color-bg-elev, #1a1a2e);
    border: 1px solid var(--color-line, #2a2a3e);
    color: var(--color-text-muted, #aaa);
  }

  /* Readonly card */
  .ob-readonly-card {
    background: var(--color-bg-card, #1e1e32);
    border: 1px solid var(--color-line, #2a2a3e);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }
  .ob-readonly-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 13px;
    color: var(--color-text-muted, #aaa);
    border-bottom: 1px solid var(--color-line, #1a1a2e);
  }
  .ob-readonly-row:last-child { border-bottom: none; }
  .ob-readonly-row strong { color: var(--color-text, #fff); }

  /* Photo grid */
  .ob-photo-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }
  .ob-photo {
    width: 100%;
    aspect-ratio: 3/4;
    object-fit: cover;
    border-radius: 8px;
  }

  /* Chips (services, languages, hashtags) */
  .ob-svc-group { margin-bottom: 16px; }
  .ob-svc-cat {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-dim, #888);
    margin-bottom: 8px;
  }
  .ob-chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ob-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--color-line, #2a2a3e);
    background: var(--color-bg-elev, #1a1a2e);
    color: var(--color-text-muted, #aaa);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ob-chip input { display: none; }
  .ob-chip:hover {
    border-color: var(--color-coral, #e94e77);
    color: var(--color-text, #fff);
  }
  .ob-chip.active {
    background: linear-gradient(135deg, var(--color-coral, #e94e77), var(--color-magenta, #d63384));
    border-color: transparent;
    color: #fff;
  }

  /* Program radio */
  .ob-program-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }
  .ob-program-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--color-line, #2a2a3e);
    background: var(--color-bg-elev, #1a1a2e);
    color: var(--color-text-muted, #aaa);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ob-program-option:hover {
    border-color: var(--color-coral, #e94e77);
  }
  .ob-program-option.selected {
    border-color: var(--color-coral, #e94e77);
    background: rgba(233, 78, 119, 0.08);
    color: var(--color-text, #fff);
  }

  /* Shift grid */
  .ob-shift-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    margin-bottom: 20px;
  }
  .ob-shift-day {
    background: var(--color-bg-card, #1e1e32);
    border: 1px solid var(--color-line, #2a2a3e);
    border-radius: 10px;
    padding: 8px 4px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
  }
  .ob-shift-day.past {
    opacity: 0.3;
    pointer-events: none;
  }
  .ob-shift-label {
    font-size: 9px; font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-dim, #888);
  }
  .ob-shift-date {
    font-size: 10px;
    color: var(--color-text-muted, #aaa);
    font-family: ui-monospace, monospace;
  }
  .ob-shift-btns {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 100%;
  }
  .ob-shift-btn {
    width: 100%;
    padding: 5px 2px;
    border-radius: 6px;
    font-size: 9px;
    font-weight: 600;
    border: 1px solid var(--color-line, #2a2a3e);
    background: var(--color-bg-elev, #1a1a2e);
    color: var(--color-text-muted, #aaa);
    cursor: pointer;
  }
  .ob-shift-btn:hover {
    border-color: var(--color-coral, #e94e77);
    color: var(--color-text, #fff);
  }
  .ob-shift-badge {
    display: inline-block;
    padding: 3px 6px;
    border-radius: 5px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .ob-shift-badge.pending {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
  }
  .ob-shift-badge.approved {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }
  .ob-shift-badge.rejected {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
  .ob-shift-type {
    font-size: 9px;
    color: var(--color-text-dim, #888);
  }
  .ob-shift-cancel {
    background: none;
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: rgba(239, 68, 68, 0.8);
    padding: 2px 6px;
    border-radius: 5px;
    font-size: 8px;
    font-weight: 600;
    cursor: pointer;
  }

  /* Summary */
  .ob-summary {
    background: var(--color-bg-card, #1e1e32);
    border: 1px solid var(--color-line, #2a2a3e);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }
  .ob-summary-row {
    padding: 8px 0;
    font-size: 13px;
    border-bottom: 1px solid var(--color-line, #1a1a2e);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ob-summary-row:last-child { border-bottom: none; }
  .ob-summary-row.ok::before {
    content: '\\2713';
    color: #22c55e;
    font-weight: 700;
  }
  .ob-summary-row.warn::before {
    content: '!';
    color: #fbbf24;
    font-weight: 700;
    font-size: 14px;
  }
  .ob-summary-row.info::before {
    content: 'i';
    color: #60a5fa;
    font-weight: 700;
    font-style: italic;
  }
  .ob-summary-row.ok { color: #86efac; }
  .ob-summary-row.warn { color: #fde68a; }
  .ob-summary-row.info { color: var(--color-text-muted, #aaa); }

  /* Lists */
  .ob-steps-list, .ob-rules-list {
    font-size: 13px;
    color: var(--color-text-muted, #aaa);
    line-height: 1.8;
    padding-left: 20px;
    margin-bottom: 16px;
  }

  /* Mobile */
  @media (max-width: 640px) {
    .ob-shell { padding: 16px 12px 40px; }
    .ob-photo-grid { grid-template-columns: repeat(3, 1fr); }
    .ob-shift-grid { gap: 3px; }
    .ob-shift-day { padding: 6px 2px; border-radius: 8px; }
    .ob-shift-label { font-size: 8px; }
    .ob-shift-date { font-size: 8px; }
    .ob-shift-btn { font-size: 8px; padding: 4px 1px; }
  }
`;
