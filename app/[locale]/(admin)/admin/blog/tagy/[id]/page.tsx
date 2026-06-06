import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { updateBlogTag, deleteBlogTag } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminEditBlogTagPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  const result = await db.execute({ sql: 'SELECT * FROM blog_tags WHERE id=?', args: [Number(id)] });
  if (result.rows.length === 0) notFound();
  const tag = result.rows[0];

  return (
    <>
      <AdminTopbar title={`Tag: ${String(tag.name_cs)}`} />

      <div style={{ marginBottom: '16px' }}>
        <a href="/cs/admin/blog/tagy" style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na tagy
        </a>
      </div>

      <form action={updateBlogTag} className="admin-form">
        <input type="hidden" name="id" value={Number(tag.id)} />

        <fieldset>
          <legend>Tag</legend>
          <div className="admin-form-field">
            <label htmlFor="slug">Slug *</label>
            <input id="slug" name="slug" type="text" required defaultValue={String(tag.slug)}
              style={{ fontFamily: 'monospace', fontSize: '13px' }} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="name_cs">Název CS *</label>
            <input id="name_cs" name="name_cs" type="text" required defaultValue={String(tag.name_cs)} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="name_en">Název EN *</label>
            <input id="name_en" name="name_en" type="text" required defaultValue={String(tag.name_en)} />
          </div>
        </fieldset>

        <div className="admin-submit-row">
          <button type="submit" className="admin-btn-submit">Uložit</button>
          <a href="/cs/admin/blog/tagy" className="admin-btn-secondary">Zrušit</a>
        </div>
      </form>

      <div style={{ marginTop: '48px', padding: '20px', border: '1px solid var(--color-red)', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-red)', marginBottom: '12px' }}>
          Nebezpečná zóna
        </div>
        <form action={deleteBlogTag}>
          <input type="hidden" name="id" value={Number(tag.id)} />
          <button type="submit" className="danger-btn">Smazat tento tag</button>
        </form>
      </div>
    </>
  );
}
