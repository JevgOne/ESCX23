import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { updatePricingPlan, deletePricingPlan } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PlanRow {
  id: number;
  duration: number;
  price: number;
  night_price: number | null;
  is_popular: number;
  is_active: number;
  display_order: number;
  title_cs: string;
  title_en: string;
  title_de: string;
  title_uk: string;
}

export default async function AdminEditPlanPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  const result = await db.execute({ sql: 'SELECT * FROM pricing_plans WHERE id=?', args: [Number(id)] });
  if (result.rows.length === 0) notFound();

  const plan = result.rows[0] as unknown as PlanRow;

  return (
    <>
      <AdminTopbar title={`Editace programu: ${plan.duration} min`} />

      <div style={{ marginBottom: '16px' }}>
        <a href={`/${locale}/admin/cenik`} style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na ceník
        </a>
      </div>

      <form action={updatePricingPlan} className="admin-form">
        <input type="hidden" name="id" value={plan.id} />

        <fieldset>
          <legend>Základní info</legend>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="duration">Délka (minuty) *</label>
              <input id="duration" name="duration" type="number" required min={1} defaultValue={plan.duration} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="price">Cena (Kč) *</label>
              <input id="price" name="price" type="number" required min={0} defaultValue={plan.price} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="night_price">Noční cena (Kč)</label>
              <input id="night_price" name="night_price" type="number" min={0} defaultValue={plan.night_price ?? ''} placeholder="Prázdné = stejná jako denní" />
            </div>
            <div className="admin-form-field">
              <label htmlFor="display_order">Pořadí</label>
              <input id="display_order" name="display_order" type="number" defaultValue={plan.display_order} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_popular" defaultChecked={Boolean(plan.is_popular)} />
                Populární
              </label>
            </div>
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_active" defaultChecked={Boolean(plan.is_active)} />
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
              <input id="title_cs" name="title_cs" type="text" required defaultValue={plan.title_cs} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="title_en">EN</label>
              <input id="title_en" name="title_en" type="text" required defaultValue={plan.title_en} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="title_de">DE</label>
              <input id="title_de" name="title_de" type="text" required defaultValue={plan.title_de} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="title_uk">UK</label>
              <input id="title_uk" name="title_uk" type="text" required defaultValue={plan.title_uk} />
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
        <form action={deletePricingPlan}>
          <input type="hidden" name="id" value={plan.id} />
          <button type="submit" className="danger-btn">Smazat tento program</button>
        </form>
      </div>
    </>
  );
}
