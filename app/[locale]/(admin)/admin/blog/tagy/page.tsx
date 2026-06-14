import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { deleteBlogTag } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TagRow {
  id: number;
  slug: string;
  name_cs: string;
  name_en: string;
  post_count: number;
}

const COLUMNS: DataTableColumn<TagRow>[] = [
  {
    key: 'name_cs',
    label: 'Název (CS)',
    render: (row) => <span style={{ fontWeight: 500 }}>{row.name_cs}</span>,
  },
  {
    key: 'name_en',
    label: 'Název (EN)',
    render: (row) => <span style={{ color: 'var(--color-text-muted)' }}>{row.name_en}</span>,
  },
  {
    key: 'slug',
    label: 'Slug',
    render: (row) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-dim)' }}>
        {row.slug}
      </span>
    ),
  },
  {
    key: 'post_count',
    label: 'Články',
    render: (row) => <span>{row.post_count}</span>,
  },
  {
    key: 'actions',
    label: 'Akce',
    render: (row): ReactNode => (
      <div style={{ display: 'flex', gap: '6px' }}>
        <a href={`/cs/admin/blog/tagy/${row.id}`} className="admin-action-btn edit">Edit</a>
        <form action={deleteBlogTag} style={{ display: 'inline' }}>
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" className="admin-action-btn danger">Smazat</button>
        </form>
      </div>
    ),
  },
];

export default async function AdminBlogTagsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  const result = await db.execute(
    `SELECT bt.id, bt.slug, bt.name_cs, bt.name_en,
       (SELECT COUNT(*) FROM blog_post_tags WHERE tag_id = bt.id) AS post_count
     FROM blog_tags bt ORDER BY bt.name_cs ASC`
  );
  const rows = result.rows as unknown as TagRow[];

  return (
    <>
      <AdminTopbar title="Blog — Tagy" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <a href={`/${locale}/admin/blog`} style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na blog
        </a>
        <a href={`/${locale}/admin/blog/tagy/novy`} className="admin-btn-primary">+ Nový tag</a>
      </div>

      <DataTable columns={COLUMNS} rows={rows} emptyText="Žádné tagy" />
    </>
  );
}
