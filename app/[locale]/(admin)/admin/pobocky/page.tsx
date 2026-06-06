import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { deletePobocka } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LocationRow {
  id: number;
  name: string;
  display_name: string;
  city: string;
  district: string | null;
  address: string | null;
  is_active: number;
  is_primary: number;
  opening_date: string | null;
}

const COLUMNS: DataTableColumn<LocationRow>[] = [
  { key: 'display_name', label: 'Název' },
  {
    key: 'district',
    label: 'Čtvrť',
    render: (row) => <span>{row.district ?? row.city}</span>,
  },
  {
    key: 'address',
    label: 'Adresa',
    render: (row) => (
      <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>{row.address ?? '—'}</span>
    ),
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
    key: 'is_primary',
    label: 'Hlavní',
    render: (row) => <span>{row.is_primary ? 'Ano' : '—'}</span>,
  },
  {
    key: 'opening_date',
    label: 'Otevření',
    render: (row) => <span>{row.opening_date ?? '—'}</span>,
  },
  {
    key: 'actions',
    label: 'Akce',
    render: (row): ReactNode => (
      <div style={{ display: 'flex', gap: '6px' }}>
        <a href={`/cs/admin/pobocky/${row.id}`} className="admin-action-btn edit">
          Edit
        </a>
        <form action={deletePobocka} style={{ display: 'inline' }}>
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" className="admin-action-btn danger">
            Smazat
          </button>
        </form>
      </div>
    ),
  },
];

export default async function AdminPobockyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  const result = await db.execute('SELECT id, name, display_name, city, district, address, is_active, is_primary, opening_date FROM locations ORDER BY id ASC');
  const rows = result.rows as unknown as LocationRow[];

  return (
    <>
      <AdminTopbar title="Pobočky" />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <a href="/cs/admin/pobocky/nova" className="admin-btn-primary">
          + Nová pobočka
        </a>
      </div>

      <DataTable columns={COLUMNS} rows={rows} emptyText="Žádné pobočky" />
    </>
  );
}
