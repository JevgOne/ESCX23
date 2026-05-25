import { setRequestLocale } from 'next-intl/server';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { createPobocka } from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminNovaPobockaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <AdminTopbar title="Nová pobočka" />

      <div style={{ marginBottom: '16px' }}>
        <a href="/cs/admin/pobocky" style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na seznam
        </a>
      </div>

      <form action={createPobocka} className="admin-form">
        <fieldset>
          <legend>Identita</legend>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="name">Slug (interní název) *</label>
              <input id="name" name="name" type="text" required placeholder="vinohrady" style={{ fontFamily: 'monospace' }} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="display_name">Zobrazovaný název *</label>
              <input id="display_name" name="display_name" type="text" required placeholder="Praha 2 · Vinohrady" />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="city">Město *</label>
              <input id="city" name="city" type="text" required defaultValue="Praha" />
            </div>
            <div className="admin-form-field">
              <label htmlFor="district">Čtvrť</label>
              <input id="district" name="district" type="text" placeholder="Praha 2 · Vinohrady" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Kontakt</legend>
          <div className="admin-form-field">
            <label htmlFor="address">Adresa (interní)</label>
            <input id="address" name="address" type="text" placeholder="Mánesova 88, Praha 2" />
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="postal_code">PSČ</label>
              <input id="postal_code" name="postal_code" type="text" placeholder="120 00" />
            </div>
            <div className="admin-form-field">
              <label htmlFor="phone">Telefon</label>
              <input id="phone" name="phone" type="text" placeholder="+420 xxx xxx xxx" />
            </div>
            <div className="admin-form-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Texty stránky (multi-jazyk)</legend>
          <p style={{ fontSize: '12px', color: 'var(--color-text-dim)', margin: '0 0 16px' }}>
            Vyplň alespoň českou verzi. Ostatní jazyky lze doplnit později.
          </p>
          <div className="lang-tabs">
            {(['cs','en','de','uk'] as const).map((code, i) => (
              <input key={`r-${code}`} type="radio" name="lang-tab-new" id={`ltn-${code}`} className={`lang-tab-radio lang-tab-radio-${code}`} defaultChecked={i === 0} />
            ))}
            <div className="lang-tab-bar">
              <label htmlFor="ltn-cs" className="lang-tab-btn lang-tab-btn-cs">🇨🇿 Čeština</label>
              <label htmlFor="ltn-en" className="lang-tab-btn lang-tab-btn-en">🇬🇧 English</label>
              <label htmlFor="ltn-de" className="lang-tab-btn lang-tab-btn-de">🇩🇪 Deutsch</label>
              <label htmlFor="ltn-uk" className="lang-tab-btn lang-tab-btn-uk">🇺🇦 Українська</label>
            </div>
            {(['cs','en','de','uk'] as const).map((code) => {
              const sfx = code === 'cs' ? '_cs' : `_${code}`;
              return (
                <div key={`p-${code}`} className={`lang-tab-pane lang-tab-pane-${code}`}>
                  <div className="admin-form-field">
                    <label htmlFor={`description${sfx}`}>Popis pobočky</label>
                    <textarea id={`description${sfx}`} name={`description${sfx}`} rows={4} />
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor={`features_text${sfx}`}>Vlastnosti apartmánu (1 položka / řádek)</label>
                    <textarea id={`features_text${sfx}`} name={`features_text${sfx}`} rows={6} />
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor={`hours_text${sfx}`}>Otevírací doba</label>
                    <input id={`hours_text${sfx}`} name={`hours_text${sfx}`} type="text" placeholder="Denně 10:00 — 22:30" defaultValue={code === 'cs' ? 'Denně 10:00 — 22:30' : ''} />
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor={`transport_text${sfx}`}>🚇 Doprava MHD</label>
                    <textarea id={`transport_text${sfx}`} name={`transport_text${sfx}`} rows={3} />
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor={`payment_text${sfx}`}>💳 Platba</label>
                    <textarea id={`payment_text${sfx}`} name={`payment_text${sfx}`} rows={3} />
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor={`parking_text${sfx}`}>🅿️ Možnost parkování</label>
                    <textarea id={`parking_text${sfx}`} name={`parking_text${sfx}`} rows={3} />
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend>Status</legend>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_active" defaultChecked />
                Aktivní
              </label>
            </div>
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_primary" />
                Hlavní pobočka
              </label>
            </div>
          </div>
        </fieldset>

        <div className="admin-submit-row">
          <button type="submit" className="admin-btn-submit">Vytvořit pobočku</button>
          <a href="/cs/admin/pobocky" className="admin-btn-secondary">Zrušit</a>
        </div>
      </form>
    </>
  );
}
