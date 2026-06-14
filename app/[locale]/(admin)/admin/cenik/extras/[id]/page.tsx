import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { updatePricingExtra, deletePricingExtra } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ExtraRow {
  id: number;
  price: number;
  display_order: number;
  is_active: number;
  name_cs: string;
  name_en: string;
  name_de: string;
  name_uk: string;
}

export default async function AdminEditExtraPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  const result = await db.execute({ sql: 'SELECT * FROM pricing_extras WHERE id=?', args: [Number(id)] });
  if (result.rows.length === 0) notFound();

  const extra = result.rows[0] as unknown as ExtraRow;

  return (
    <>
      <AdminTopbar title={`Editace extra: ${extra.name_cs}`} />

      <div style={{ marginBottom: '16px' }}>
        <a href={`/${locale}/admin/cenik`} style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na ceník
        </a>
      </div>

      <form action={updatePricingExtra} className="admin-form">
        <input type="hidden" name="id" value={extra.id} />

        <fieldset>
          <legend>Základní info</legend>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="price">Cena (Kč) *</label>
              <input id="price" name="price" type="number" required min={0} defaultValue={extra.price} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="display_order">Pořadí</label>
              <input id="display_order" name="display_order" type="number" defaultValue={extra.display_order} />
            </div>
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_active" defaultChecked={Boolean(extra.is_active)} />
                Aktivní
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Název (4 jazyky)</legend>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="name_cs">CS</label>
              <input id="name_cs" name="name_cs" type="text" required defaultValue={extra.name_cs} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="name_en">EN</label>
              <input id="name_en" name="name_en" type="text" required defaultValue={extra.name_en} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="name_de">DE</label>
              <input id="name_de" name="name_de" type="text" required defaultValue={extra.name_de} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="name_uk">UK</label>
              <input id="name_uk" name="name_uk" type="text" required defaultValue={extra.name_uk} />
            </div>
          </div>
        </fieldset>

        <div className="admin-submit-row">
          <button type="submit" className="admin-btn-submit">Uložit změny</button>
          <a href={`/${locale}/admin/cenik`} className="admin-btn-secondary">Zrušit</a>
        </div>
      </form>

      <div style={{ marginTop: '48px', padding: '20px', border: '1px solid var(--color-red)', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-red)', marginBottom: '12px' }}>
          Nebezpečná zóna
        </div>
        <form action={deletePricingExtra}>
          <input type="hidden" name="id" value={extra.id} />
          <button type="submit" className="danger-btn">Smazat tento extra</button>
        </form>
      </div>
    </>
  );
}
