import { setRequestLocale } from 'next-intl/server';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { createBlogTag } from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminNewBlogTagPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <AdminTopbar title="Nový tag" />

      <div style={{ marginBottom: '16px' }}>
        <a href="/cs/admin/blog/tagy" style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na tagy
        </a>
      </div>

      <form action={createBlogTag} className="admin-form">
        <fieldset>
          <legend>Tag</legend>
          <div className="admin-form-field">
            <label htmlFor="slug">Slug *</label>
            <input id="slug" name="slug" type="text" required placeholder="muj-tag"
              style={{ fontFamily: 'monospace', fontSize: '13px' }} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="name_cs">Název CS *</label>
            <input id="name_cs" name="name_cs" type="text" required />
          </div>
          <div className="admin-form-field">
            <label htmlFor="name_en">Název EN *</label>
            <input id="name_en" name="name_en" type="text" required />
          </div>
        </fieldset>

        <div className="admin-submit-row">
          <button type="submit" className="admin-btn-submit">Vytvořit tag</button>
          <a href="/cs/admin/blog/tagy" className="admin-btn-secondary">Zrušit</a>
        </div>
      </form>
    </>
  );
}
