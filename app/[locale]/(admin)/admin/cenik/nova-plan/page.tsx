import { setRequestLocale } from 'next-intl/server';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { createPricingPlan } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminNovyPlanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  return (
    <>
      <AdminTopbar title="Nový program" />

      <div style={{ marginBottom: '16px' }}>
        <a href="/cs/admin/cenik" style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na ceník
        </a>
      </div>

      <form action={createPricingPlan} className="admin-form">
        <fieldset>
          <legend>Základní info</legend>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="duration">Délka (minuty) *</label>
              <input id="duration" name="duration" type="number" required min={1} placeholder="60" />
            </div>
            <div className="admin-form-field">
              <label htmlFor="price">Cena (Kč) *</label>
              <input id="price" name="price" type="number" required min={0} placeholder="3000" />
            </div>
            <div className="admin-form-field">
              <label htmlFor="display_order">Pořadí</label>
              <input id="display_order" name="display_order" type="number" defaultValue={0} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_popular" />
                Populární
              </label>
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
              <label htmlFor="title_cs">CS</label>
              <input id="title_cs" name="title_cs" type="text" required />
            </div>
            <div className="admin-form-field">
              <label htmlFor="title_en">EN</label>
              <input id="title_en" name="title_en" type="text" required />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="title_de">DE</label>
              <input id="title_de" name="title_de" type="text" required />
            </div>
            <div className="admin-form-field">
              <label htmlFor="title_uk">UK</label>
              <input id="title_uk" name="title_uk" type="text" required />
            </div>
          </div>
        </fieldset>

        <div className="admin-submit-row">
          <button type="submit" className="admin-btn-submit">Vytvořit program</button>
          <a href="/cs/admin/cenik" className="admin-btn-secondary">Zrušit</a>
        </div>
      </form>
    </>
  );
}
