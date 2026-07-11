import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { deletePricingPlan, deletePricingExtra } from '@/lib/admin-actions';
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
}

interface ExtraRow {
  id: number;
  price: number;
  display_order: number;
  is_active: number;
  name_cs: string;
  name_en: string;
}

const PLAN_COLS: DataTableColumn<PlanRow>[] = [
  { key: 'duration', label: 'Délka (min)' },
  { key: 'title_cs', label: 'Název (CS)' },
  {
    key: 'price',
    label: 'Cena',
    render: (row) => <span>{row.price.toLocaleString('cs')} Kč</span>,
  },
  {
    key: 'night_price',
    label: 'Noční cena',
    render: (row) => row.night_price != null
      ? <span style={{ color: '#fbbf24' }}>&#127769; {row.night_price.toLocaleString('cs')} Kč</span>
      : <span style={{ color: 'var(--color-text-dim)' }}>—</span>,
  },
  {
    key: 'is_popular',
    label: 'Populární',
    render: (row) => <span>{row.is_popular ? 'Ano' : '—'}</span>,
  },
  {
    key: 'is_active',
    label: 'Status',
    render: (row) => (
      <span className={`status-badge ${row.is_active ? 'active' : 'inactive'}`}>
        {row.is_active ? 'Aktivní' : 'Neaktivní'}
      </span>
    ),
  },
  {
    key: 'actions',
    label: 'Akce',
    render: (row): ReactNode => (
      <div style={{ display: 'flex', gap: '6px' }}>
        <a href={`/cs/admin/cenik/plany/${row.id}`} className="admin-action-btn edit">Edit</a>
        <form action={deletePricingPlan} style={{ display: 'inline' }}>
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" className="admin-action-btn danger">Smazat</button>
        </form>
      </div>
    ),
  },
];

const EXTRA_COLS: DataTableColumn<ExtraRow>[] = [
  { key: 'name_cs', label: 'Název (CS)' },
  {
    key: 'price',
    label: 'Cena',
    render: (row) => <span>{row.price.toLocaleString('cs')} Kč</span>,
  },
  { key: 'display_order', label: 'Pořadí' },
  {
    key: 'is_active',
    label: 'Status',
    render: (row) => (
      <span className={`status-badge ${row.is_active ? 'active' : 'inactive'}`}>
        {row.is_active ? 'Aktivní' : 'Neaktivní'}
      </span>
    ),
  },
  {
    key: 'actions',
    label: 'Akce',
    render: (row): ReactNode => (
      <div style={{ display: 'flex', gap: '6px' }}>
        <a href={`/cs/admin/cenik/extras/${row.id}`} className="admin-action-btn edit">Edit</a>
        <form action={deletePricingExtra} style={{ display: 'inline' }}>
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" className="admin-action-btn danger">Smazat</button>
        </form>
      </div>
    ),
  },
];

export default async function AdminCenikPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  const plansResult = await db.execute('SELECT id, duration, price, night_price, is_popular, is_active, display_order, title_cs, title_en FROM pricing_plans ORDER BY display_order ASC, duration ASC');
  const plans = plansResult.rows as unknown as PlanRow[];

  const extrasResult = await db.execute('SELECT id, price, display_order, is_active, name_cs, name_en FROM pricing_extras ORDER BY display_order ASC, id ASC');
  const extras = extrasResult.rows as unknown as ExtraRow[];

  return (
    <>
      <AdminTopbar title="Ceník" />

      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Programy</h2>
          <a href={`/${locale}/admin/cenik/nova-plan`} className="admin-btn-primary">+ Nový program</a>
        </div>
        <DataTable columns={PLAN_COLS} rows={plans} emptyText="Žádné programy" />
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Extras</h2>
          <a href={`/${locale}/admin/cenik/nova-extra`} className="admin-btn-primary">+ Nový extra</a>
        </div>
        <DataTable columns={EXTRA_COLS} rows={extras} emptyText="Žádné extras" />
      </section>
    </>
  );
}
