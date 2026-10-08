import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { deletePricingPlan, deletePricingExtra } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';
import ConfirmDeleteForm from '@/components/admin/ConfirmDeleteForm';

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

function getPlanCols(locale: string): DataTableColumn<PlanRow>[] {
  return [
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
        <a href={`/${locale}/admin/cenik/plany/${row.id}`} className="admin-action-btn edit">Edit</a>
        <ConfirmDeleteForm action={deletePricingPlan} id={row.id} />
      </div>
    ),
  },
  ];
}

function getExtraCols(locale: string): DataTableColumn<ExtraRow>[] {
  return [
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
        <a href={`/${locale}/admin/cenik/extras/${row.id}`} className="admin-action-btn edit">Edit</a>
        <ConfirmDeleteForm action={deletePricingExtra} id={row.id} />
      </div>
    ),
  },
  ];
}

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
        <DataTable columns={getPlanCols(locale)} rows={plans} emptyText="Žádné programy" />
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Extras</h2>
          <a href={`/${locale}/admin/cenik/nova-extra`} className="admin-btn-primary">+ Nový extra</a>
        </div>
        <DataTable columns={getExtraCols(locale)} rows={extras} emptyText="Žádné extras" />
      </section>
    </>
  );
}
