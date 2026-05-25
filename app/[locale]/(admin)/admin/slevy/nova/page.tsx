import { setRequestLocale } from 'next-intl/server';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { createSleva } from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DISCOUNT_TYPES = ['percentage', 'fixed', 'special'];

export default async function AdminNovaSlevaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <AdminTopbar title="Nová sleva" />

      <div style={{ marginBottom: '16px' }}>
        <a href="/cs/admin/slevy" style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na seznam
        </a>
      </div>

      <form action={createSleva} className="admin-form">
        <fieldset>
          <legend>Základní info</legend>
          <div className="admin-form-row">
            <div className="admin-form-field" style={{ maxWidth: '80px' }}>
              <label htmlFor="icon">Ikona</label>
              <input id="icon" name="icon" type="text" defaultValue="🎁" />
            </div>
            <div className="admin-form-field">
              <label htmlFor="discount_type">Typ *</label>
              <select id="discount_type" name="discount_type">
                {DISCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-field">
              <label htmlFor="discount_value">Hodnota (% nebo Kč)</label>
              <input id="discount_value" name="discount_value" type="number" min={0} placeholder="15" />
            </div>
            <div className="admin-form-field">
              <label htmlFor="display_order">Pořadí</label>
              <input id="display_order" name="display_order" type="number" defaultValue={0} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_active" defaultChecked />
                Aktivní
              </label>
            </div>
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_featured" />
                Featured
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Název (4 jazyky)</legend>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="name_cs">CS *</label>
              <input id="name_cs" name="name_cs" type="text" required />
            </div>
            <div className="admin-form-field">
              <label htmlFor="name_en">EN *</label>
              <input id="name_en" name="name_en" type="text" required />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="name_de">DE *</label>
              <input id="name_de" name="name_de" type="text" required />
            </div>
            <div className="admin-form-field">
              <label htmlFor="name_uk">UK *</label>
              <input id="name_uk" name="name_uk" type="text" required />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Popis (4 jazyky)</legend>
          <div className="admin-form-field">
            <label htmlFor="description_cs">CS *</label>
            <textarea id="description_cs" name="description_cs" rows={3} required />
          </div>
          <div className="admin-form-field">
            <label htmlFor="description_en">EN *</label>
            <textarea id="description_en" name="description_en" rows={3} required />
          </div>
          <div className="admin-form-field">
            <label htmlFor="description_de">DE *</label>
            <textarea id="description_de" name="description_de" rows={3} required />
          </div>
          <div className="admin-form-field">
            <label htmlFor="description_uk">UK *</label>
            <textarea id="description_uk" name="description_uk" rows={3} required />
          </div>
        </fieldset>

        <div className="admin-submit-row">
          <button type="submit" className="admin-btn-submit">Vytvořit slevu</button>
          <a href="/cs/admin/slevy" className="admin-btn-secondary">Zrušit</a>
        </div>
      </form>
    </>
  );
}
