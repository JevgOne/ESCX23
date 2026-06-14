import { setRequestLocale } from 'next-intl/server';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { createPricingExtra } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminNovyExtraPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  return (
    <>
      <AdminTopbar title="Nový extra" />

      <div style={{ marginBottom: '16px' }}>
        <a href={`/${locale}/admin/cenik`} style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na ceník
        </a>
      </div>

      <form action={createPricingExtra} className="admin-form">
        <fieldset>
          <legend>Základní info</legend>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="price">Cena (Kč) *</label>
              <input id="price" name="price" type="number" required min={0} placeholder="500" />
            </div>
            <div className="admin-form-field">
              <label htmlFor="display_order">Pořadí</label>
              <input id="display_order" name="display_order" type="number" defaultValue={0} />
            </div>
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_active" defaultChecked />
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
              <input id="name_cs" name="name_cs" type="text" required />
            </div>
            <div className="admin-form-field">
              <label htmlFor="name_en">EN</label>
              <input id="name_en" name="name_en" type="text" required />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="name_de">DE</label>
              <input id="name_de" name="name_de" type="text" required />
            </div>
            <div className="admin-form-field">
              <label htmlFor="name_uk">UK</label>
              <input id="name_uk" name="name_uk" type="text" required />
            </div>
          </div>
        </fieldset>

        <div className="admin-submit-row">
          <button type="submit" className="admin-btn-submit">Vytvořit extra</button>
          <a href={`/${locale}/admin/cenik`} className="admin-btn-secondary">Zrušit</a>
        </div>
      </form>
    </>
  );
}
