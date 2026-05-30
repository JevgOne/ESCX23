import { setRequestLocale } from 'next-intl/server';
import { requireGirl } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateGirlServices } from '@/lib/studio-actions';
import StudioTopbar from '@/components/studio/StudioTopbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Základní',
  oral: 'Orální',
  special: 'Speciální',
  massage: 'Masáže',
  extras: 'Extra',
  types: 'Typ setkání',
};

const CATEGORY_ORDER = ['basic', 'oral', 'special', 'massage', 'extras', 'types'];

interface ServiceRow {
  id: number;
  slug: string;
  name: string;
  category: string;
  active: boolean;
}

export default async function StudioSluzbyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const user = await requireGirl();
  const girlId = user.girl_id!;

  // Fetch all services + which ones the girl has
  const [allRes, girlRes] = await Promise.all([
    db.execute(`SELECT id, slug, name_cs, category FROM services ORDER BY category, id`),
    db.execute({ sql: `SELECT service_id FROM girl_services WHERE girl_id = ?`, args: [girlId] }),
  ]);

  const activeIds = new Set(girlRes.rows.map((r) => Number(r.service_id)));

  const services: ServiceRow[] = allRes.rows.map((r) => ({
    id: Number(r.id),
    slug: String(r.slug),
    name: String(r.name_cs),
    category: String(r.category),
    active: activeIds.has(Number(r.id)),
  }));

  // Group by category
  const grouped = new Map<string, ServiceRow[]>();
  for (const svc of services) {
    if (!grouped.has(svc.category)) grouped.set(svc.category, []);
    grouped.get(svc.category)!.push(svc);
  }

  return (
    <>
      <StudioTopbar title="Služby" />

      <div className="studio-content">
        {sp.saved === '1' && (
          <div className="studio-alert studio-alert-ok">Služby uloženy!</div>
        )}

        <form action={updateGirlServices} className="studio-form-wrap" style={{ maxWidth: 720 }}>
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped.get(cat);
            if (!items || items.length === 0) return null;
            return (
              <div key={cat} className="studio-services-group">
                <h3 className="studio-services-cat">{CATEGORY_LABELS[cat] ?? cat}</h3>
                <div className="studio-services-grid">
                  {items.map((svc) => (
                    <label key={svc.id} className={`studio-service-chip${svc.active ? ' active' : ''}`}>
                      <input
                        type="checkbox"
                        name="services"
                        value={svc.id}
                        defaultChecked={svc.active}
                      />
                      <span className="studio-service-name">{svc.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          <button type="submit" className="btn btn-pink" style={{ marginTop: 24 }}>
            Uložit služby
          </button>
        </form>
      </div>
    </>
  );
}
