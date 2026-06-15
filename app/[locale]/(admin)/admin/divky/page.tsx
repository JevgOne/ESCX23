import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { getAllGirlsForAdmin, type AdminGirlRow } from '@/lib/queries';
import { relativeTime } from '@/lib/utils';
import { restoreGirl } from '@/lib/admin-actions';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_LABELS: Record<string, string> = {
  active: 'active',
  draft: 'draft',
  paused: 'paused',
  archived: 'archived',
  pending: 'pending',
  inactive: 'inactive',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_LABELS[status] ?? 'draft';
  const LABEL: Record<string, string> = {
    active: 'Aktivní', inactive: 'Nedostupná', pending: 'Čekající',
    archived: 'Archiv', draft: 'Draft', paused: 'Paused',
  };
  return <span className={`status-badge ${cls}`}>{LABEL[status] ?? status}</span>;
}

const STATUSES = ['all', 'active', 'inactive', 'pending', 'archived'];

const COLUMNS: DataTableColumn<AdminGirlRow>[] = [ // eslint-disable-line
  {
    key: 'primaryPhoto',
    label: 'Foto',
    render: (row) =>
      row.primaryPhoto ? (
        <img src={row.primaryPhoto} alt={row.name} className="thumb" />
      ) : (
        <div className="thumb" style={{ background: 'var(--color-bg-elev)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--color-text-dim)' }}>
          —
        </div>
      ),
  },
  {
    key: 'name',
    label: 'Jméno',
    render: (row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{row.name}</div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', fontFamily: 'monospace' }}>{row.age} let</div>
      </div>
    ),
  },
  {
    key: 'slug',
    label: 'Slug',
    render: (row) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        /{row.slug}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'photoCount',
    label: 'Fotky',
    render: (row) => <span>{row.photoCount}</span>,
  },
  {
    key: 'updatedAt',
    label: 'Upraveno',
    render: (row) => (
      <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
        {row.updatedAt ? relativeTime(row.updatedAt) : relativeTime(row.createdAt)}
      </span>
    ),
  },
  {
    key: 'actions',
    label: 'Akce',
    render: (row) => (
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {row.status === 'archived' ? (
          <form action={restoreGirl} style={{ display: 'inline' }}>
            <input type="hidden" name="id" value={row.id} />
            <button type="submit" className="admin-action-btn edit">Obnovit</button>
          </form>
        ) : (
          <>
            <a href={`/cs/admin/divky/${row.id}/edit`} className="admin-action-btn edit">
              Edit
            </a>
            <a href={`/cs/admin/divky/${row.id}/dostupnost`} className="admin-action-btn">
              Rozvrh
            </a>
            <a href={`/cs/admin/divky/${row.id}/fotky`} className="admin-action-btn">
              Fotky
            </a>
            <a href={`/cs/admin/divky/${row.id}`} className="admin-action-btn">
              Detail
            </a>
          </>
        )}
      </div>
    ),
  },
];

export default async function AdminDivkyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { q, status } = await searchParams;
  const girls = await getAllGirlsForAdmin(q, status);

  const activeStatus = status ?? 'all';

  return (
    <>
      <AdminTopbar title="Dívky" />

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <form method="GET" style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
          {activeStatus !== 'all' && <input type="hidden" name="status" value={activeStatus} />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Hledat podle jména..."
            className="admin-search"
          />
          <button type="submit" className="admin-btn-primary">Hledat</button>
        </form>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {STATUSES.map((s) => (
            <a
              key={s}
              href={s === 'all' ? '/cs/admin/divky' : `/cs/admin/divky?status=${s}`}
              className={`admin-filter-pill${activeStatus === s ? ' active' : ''}`}
            >
              {s === 'all' ? 'Vše' : s === 'active' ? 'Aktivní' : s === 'inactive' ? 'Nedostupné' : s === 'pending' ? 'Čekající' : 'Archiv'}
            </a>
          ))}
        </div>
        <a href={`/${locale}/admin/divky/nova`} className="admin-btn-primary" style={{ whiteSpace: 'nowrap' }}>
          + Nová dívka
        </a>
      </div>

      <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-dim)' }}>
        {girls.length} {girls.length === 1 ? 'záznam' : girls.length < 5 ? 'záznamy' : 'záznamů'}
      </div>

      <DataTable
        columns={COLUMNS}
        rows={girls}
        emptyText="Žádné dívky nenalezeny"
      />
    </>
  );
}
