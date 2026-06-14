import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { updateSleva, deleteSleva } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SlevaRow {
  id: number;
  icon: string;
  discount_type: string;
  discount_value: number | null;
  display_order: number;
  is_active: number;
  is_featured: number;
  name_cs: string;
  name_en: string;
  name_de: string;
  name_uk: string;
  description_cs: string;
  description_en: string;
  description_de: string;
  description_uk: string;
}

const DISCOUNT_TYPES = ['percentage', 'fixed', 'special'];

export default async function AdminEditSlevaPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  const result = await db.execute({ sql: 'SELECT * FROM discounts WHERE id=?', args: [Number(id)] });
  if (result.rows.length === 0) notFound();

  const sleva = result.rows[0] as unknown as SlevaRow;

  return (
    <>
      <AdminTopbar title={`Editace slevy: ${sleva.name_cs}`} />

      <div style={{ marginBottom: '16px' }}>
        <a href={`/${locale}/admin/slevy`} style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na seznam
        </a>
      </div>

      <form action={updateSleva} className="admin-form">
        <input type="hidden" name="id" value={sleva.id} />

        <fieldset>
          <legend>Základní info</legend>
          <div className="admin-form-row">
            <div className="admin-form-field" style={{ maxWidth: '80px' }}>
              <label htmlFor="icon">Ikona</label>
              <input id="icon" name="icon" type="text" defaultValue={sleva.icon} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="discount_type">Typ *</label>
              <select id="discount_type" name="discount_type" defaultValue={sleva.discount_type}>
                {DISCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-field">
              <label htmlFor="discount_value">Hodnota (% nebo Kč)</label>
              <input id="discount_value" name="discount_value" type="number" min={0} defaultValue={sleva.discount_value ?? ''} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="display_order">Pořadí</label>
              <input id="display_order" name="display_order" type="number" defaultValue={sleva.display_order} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_active" defaultChecked={Boolean(sleva.is_active)} />
                Aktivní
              </label>
            </div>
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_featured" defaultChecked={Boolean(sleva.is_featured)} />
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
              <input id="name_cs" name="name_cs" type="text" required defaultValue={sleva.name_cs} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="name_en">EN *</label>
              <input id="name_en" name="name_en" type="text" required defaultValue={sleva.name_en} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="name_de">DE *</label>
              <input id="name_de" name="name_de" type="text" required defaultValue={sleva.name_de} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="name_uk">UK *</label>
              <input id="name_uk" name="name_uk" type="text" required defaultValue={sleva.name_uk} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Popis (4 jazyky)</legend>
          <div className="admin-form-field">
            <label htmlFor="description_cs">CS *</label>
            <textarea id="description_cs" name="description_cs" rows={3} required defaultValue={sleva.description_cs} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="description_en">EN *</label>
            <textarea id="description_en" name="description_en" rows={3} required defaultValue={sleva.description_en} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="description_de">DE *</label>
            <textarea id="description_de" name="description_de" rows={3} required defaultValue={sleva.description_de} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="description_uk">UK *</label>
            <textarea id="description_uk" name="description_uk" rows={3} required defaultValue={sleva.description_uk} />
          </div>
        </fieldset>

        <div className="admin-submit-row">
          <button type="submit" className="admin-btn-submit">Uložit změny</button>
          <a href={`/${locale}/admin/slevy`} className="admin-btn-secondary">Zrušit</a>
        </div>
      </form>

      <div style={{ marginTop: '48px', padding: '20px', border: '1px solid var(--color-red)', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-red)', marginBottom: '12px' }}>
          Nebezpečná zóna
        </div>
        <form action={deleteSleva}>
          <input type="hidden" name="id" value={sleva.id} />
          <button type="submit" className="danger-btn">Smazat tuto slevu</button>
        </form>
      </div>
    </>
  );
}
