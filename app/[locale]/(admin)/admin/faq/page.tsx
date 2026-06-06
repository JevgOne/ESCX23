import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { deleteFaq } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface FaqRow {
  id: number;
  category: string;
  display_order: number;
  is_active: number;
  question_cs: string;
  question_en: string;
}

const COLUMNS: DataTableColumn<FaqRow>[] = [
  {
    key: 'category',
    label: 'Kategorie',
    render: (row) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        {row.category}
      </span>
    ),
  },
  {
    key: 'question_cs',
    label: 'Otázka (CS)',
    render: (row) => (
      <span style={{ fontSize: '13px' }}>{row.question_cs.length > 80 ? row.question_cs.slice(0, 80) + '…' : row.question_cs}</span>
    ),
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
        <a href={`/cs/admin/faq/${row.id}`} className="admin-action-btn edit">Edit</a>
        <form action={deleteFaq} style={{ display: 'inline' }}>
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" className="admin-action-btn danger">Smazat</button>
        </form>
      </div>
    ),
  },
];

export default async function AdminFaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  const result = await db.execute(
    'SELECT id, category, display_order, is_active, question_cs, question_en FROM faq_items ORDER BY category ASC, display_order ASC'
  );
  const rows = result.rows as unknown as FaqRow[];

  return (
    <>
      <AdminTopbar title="FAQ" />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <a href="/cs/admin/faq/nova" className="admin-btn-primary">+ Nová otázka</a>
      </div>

      <DataTable columns={COLUMNS} rows={rows} emptyText="Žádné FAQ položky" />
    </>
  );
}
