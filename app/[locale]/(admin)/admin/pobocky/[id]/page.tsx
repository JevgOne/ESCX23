import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { updatePobocka, deletePobocka } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type LocationRow = Record<string, unknown> & {
  id: number;
  name: string;
  display_name: string;
  city: string;
  is_active: number;
  is_primary: number;
};

const LANGS = [
  { code: 'cs', label: '🇨🇿 Čeština', suffix: '' },
  { code: 'en', label: '🇬🇧 English', suffix: '_en' },
  { code: 'de', label: '🇩🇪 Deutsch', suffix: '_de' },
  { code: 'uk', label: '🇺🇦 Українська', suffix: '_uk' },
];

const I18N_FIELDS: { key: string; label: string; rows: number; placeholder?: string; type?: 'input' | 'textarea' }[] = [
  { key: 'description', label: 'Popis pobočky', rows: 4, type: 'textarea' },
  { key: 'features_text', label: 'Vlastnosti apartmánu (1 položka / řádek)', rows: 6, type: 'textarea',
    placeholder: 'Soukromý vchod\nPlně zařízený byt\nSprcha & WC\nKlimatizace\nWi-Fi' },
  { key: 'hours_text', label: 'Otevírací doba', rows: 1, type: 'input', placeholder: 'Denně 10:00 — 22:30' },
  { key: 'transport_text', label: '🚇 Doprava MHD', rows: 3, type: 'textarea' },
  { key: 'payment_text', label: '💳 Platba', rows: 3, type: 'textarea' },
  { key: 'parking_text', label: '🅿️ Možnost parkování', rows: 3, type: 'textarea' },
];

export default async function AdminEditPobockaPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  const result = await db.execute({ sql: 'SELECT * FROM locations WHERE id=?', args: [Number(id)] });
  if (result.rows.length === 0) notFound();

  const loc = result.rows[0] as unknown as LocationRow;

  return (
    <>
      <AdminTopbar title={`Editace: ${loc.display_name}`} />

      <div style={{ marginBottom: '16px' }}>
        <a href="/cs/admin/pobocky" style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na seznam
        </a>
      </div>

      <form action={updatePobocka} className="admin-form">
        <input type="hidden" name="id" value={loc.id} />

        <fieldset>
          <legend>Identita</legend>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="name">Slug (interní název) *</label>
              <input id="name" name="name" type="text" required defaultValue={loc.name} style={{ fontFamily: 'monospace' }} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="display_name">Zobrazovaný název *</label>
              <input id="display_name" name="display_name" type="text" required defaultValue={loc.display_name} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="city">Město *</label>
              <input id="city" name="city" type="text" required defaultValue={loc.city} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="district">Čtvrť</label>
              <input id="district" name="district" type="text" defaultValue={String(loc.district ?? '')} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Kontakt</legend>
          <div className="admin-form-field">
            <label htmlFor="address">Adresa (interní)</label>
            <input id="address" name="address" type="text" defaultValue={String(loc.address ?? '')} />
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="postal_code">PSČ</label>
              <input id="postal_code" name="postal_code" type="text" defaultValue={String(loc.postal_code ?? '')} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="phone">Telefon</label>
              <input id="phone" name="phone" type="text" defaultValue={String(loc.phone ?? '')} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" defaultValue={String(loc.email ?? '')} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Texty stránky (multi-jazyk)</legend>
          <p style={{ fontSize: '12px', color: 'var(--color-text-dim)', margin: '0 0 16px' }}>
            Vyplň alespoň českou verzi. Ostatní jazyky lze nechat prázdné — fallback je čeština.
          </p>

          {/* Language tabs via radio + :checked CSS */}
          <div className="lang-tabs">
            {LANGS.map((lng, i) => (
              <input
                key={`r-${lng.code}`}
                type="radio"
                name="lang-tab"
                id={`lt-${loc.id}-${lng.code}`}
                className={`lang-tab-radio lang-tab-radio-${lng.code}`}
                defaultChecked={i === 0}
              />
            ))}
            <div className="lang-tab-bar">
              {LANGS.map((lng) => (
                <label key={`l-${lng.code}`} htmlFor={`lt-${loc.id}-${lng.code}`} className={`lang-tab-btn lang-tab-btn-${lng.code}`}>
                  {lng.label}
                </label>
              ))}
            </div>

            {LANGS.map((lng) => (
              <div key={`p-${lng.code}`} className={`lang-tab-pane lang-tab-pane-${lng.code}`}>
                {I18N_FIELDS.map((f) => {
                  const fieldName = `${f.key}${lng.suffix === '' ? '_cs' : lng.suffix}`;
                  const dbColumn = `${f.key}${lng.suffix}`;
                  const value = (loc[dbColumn] as string | null) ?? '';
                  return (
                    <div className="admin-form-field" key={fieldName}>
                      <label htmlFor={fieldName}>{f.label}</label>
                      {f.type === 'input' ? (
                        <input id={fieldName} name={fieldName} type="text" placeholder={f.placeholder} defaultValue={value} />
                      ) : (
                        <textarea id={fieldName} name={fieldName} rows={f.rows} placeholder={f.placeholder} defaultValue={value} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Status</legend>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_active" defaultChecked={Boolean(loc.is_active)} />
                Aktivní
              </label>
            </div>
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_primary" defaultChecked={Boolean(loc.is_primary)} />
                Hlavní pobočka
              </label>
            </div>
          </div>
          <div className="admin-form-field" style={{ marginTop: '12px' }}>
            <label htmlFor="opening_date">Datum otevření</label>
            <input id="opening_date" name="opening_date" type="date"
              defaultValue={String(loc.opening_date ?? '')} />
            <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>
              Pokud je v budoucnu, pobočka se zobrazí jako &quot;Připravujeme&quot;
            </span>
          </div>
        </fieldset>

        <div className="admin-submit-row">
          <button type="submit" className="admin-btn-submit">Uložit změny</button>
          <a href="/cs/admin/pobocky" className="admin-btn-secondary">Zrušit</a>
        </div>
      </form>

      <div style={{ marginTop: '48px', padding: '20px', border: '1px solid var(--color-red)', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-red)', marginBottom: '12px' }}>
          Nebezpečná zóna
        </div>
        <form action={deletePobocka}>
          <input type="hidden" name="id" value={loc.id} />
          <button type="submit" className="danger-btn">Smazat tuto pobočku</button>
        </form>
      </div>
    </>
  );
}
