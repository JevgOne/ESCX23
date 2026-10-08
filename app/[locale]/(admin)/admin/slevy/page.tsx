import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { deleteSleva } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';
import ConfirmDeleteForm from '@/components/admin/ConfirmDeleteForm';

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
}

function getColumns(locale: string): DataTableColumn<SlevaRow>[] {
  return [
  {
    key: 'name_cs',
    label: 'Název (CS)',
    render: (row) => (
      <span>
        {row.icon} {row.name_cs}
      </span>
    ),
  },
  {
    key: 'discount_type',
    label: 'Typ',
    render: (row) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{row.discount_type}</span>
    ),
  },
  {
    key: 'discount_value',
    label: 'Hodnota',
    render: (row) => (
      <span>
        {row.discount_value != null
          ? row.discount_type === 'percentage'
            ? `${row.discount_value} %`
            : `${row.discount_value.toLocaleString('cs')} Kč`
          : '—'}
      </span>
    ),
  },
  {
    key: 'is_featured',
    label: 'Featured',
    render: (row) => <span>{row.is_featured ? 'Ano' : '—'}</span>,
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
        <a href={`/${locale}/admin/slevy/${row.id}`} className="admin-action-btn edit">Edit</a>
        <ConfirmDeleteForm action={deleteSleva} id={row.id} />
      </div>
    ),
  },
  ];
}

export default async function AdminSlevyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  const result = await db.execute(
    'SELECT id, icon, discount_type, discount_value, display_order, is_active, is_featured, name_cs, name_en FROM discounts ORDER BY display_order ASC, id ASC'
  );
  const rows = result.rows as unknown as SlevaRow[];

  return (
    <>
      <AdminTopbar title="Slevy" />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <a href={`/${locale}/admin/slevy/nova`} className="admin-btn-primary">+ Nová sleva</a>
      </div>

      <DataTable columns={getColumns(locale)} rows={rows} emptyText="Žádné slevy" />
    </>
  );
}
