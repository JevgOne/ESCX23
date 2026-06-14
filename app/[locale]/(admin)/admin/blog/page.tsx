import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { deleteBlogPost } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PostRow {
  id: number;
  slug: string;
  title_cs: string;
  title_en: string;
  status: string;
  cover_url: string | null;
  reading_time_min: number;
  published_at: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  published: 'Publikováno',
  draft: 'Koncept',
  archived: 'Archiv',
};

const COLUMNS: DataTableColumn<PostRow>[] = [
  {
    key: 'cover',
    label: '',
    render: (row) => (
      <div style={{ width: 48, height: 32, borderRadius: 4, overflow: 'hidden', background: 'var(--color-surface-2)' }}>
        {row.cover_url ? (
          <img src={row.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--color-text-dim)' }}>
            —
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'title_cs',
    label: 'Článek',
    render: (row) => (
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500 }}>
          {row.title_cs.length > 60 ? row.title_cs.slice(0, 60) + '…' : row.title_cs}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', fontFamily: 'monospace' }}>
          /{row.slug}
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <span className={`status-badge ${row.status === 'published' ? 'active' : row.status === 'draft' ? 'inactive' : ''}`}>
        {STATUS_LABELS[row.status] ?? row.status}
      </span>
    ),
  },
  {
    key: 'reading_time_min',
    label: 'Čtení',
    render: (row) => <span>{row.reading_time_min} min</span>,
  },
  {
    key: 'published_at',
    label: 'Publikováno',
    render: (row) => (
      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
        {row.published_at
          ? new Date(row.published_at).toLocaleDateString('cs-CZ')
          : '—'}
      </span>
    ),
  },
  {
    key: 'actions',
    label: 'Akce',
    render: (row): ReactNode => (
      <div style={{ display: 'flex', gap: '6px' }}>
        <a href={`/cs/admin/blog/${row.id}`} className="admin-action-btn edit">Edit</a>
        <form action={deleteBlogPost} style={{ display: 'inline' }}>
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" className="admin-action-btn danger">Smazat</button>
        </form>
      </div>
    ),
  },
];

export default async function AdminBlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  const result = await db.execute(
    `SELECT id, slug, title_cs, title_en, status, cover_url, reading_time_min, published_at, created_at
     FROM blog_posts ORDER BY created_at DESC`
  );
  const rows = result.rows as unknown as PostRow[];

  return (
    <>
      <AdminTopbar title="Blog" />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
        <a href={`/${locale}/admin/blog/tagy`} className="admin-btn-secondary">Tagy</a>
        <a href={`/${locale}/admin/blog/novy`} className="admin-btn-primary">+ Nový článek</a>
      </div>

      <DataTable columns={COLUMNS} rows={rows} emptyText="Žádné blog posty" />
    </>
  );
}
