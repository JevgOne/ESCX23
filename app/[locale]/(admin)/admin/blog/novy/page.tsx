import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { createBlogPost } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TagRow {
  id: number;
  slug: string;
  name_cs: string;
}

export default async function AdminNewBlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  const tagResult = await db.execute('SELECT id, slug, name_cs FROM blog_tags ORDER BY name_cs ASC');
  const allTags = tagResult.rows as unknown as TagRow[];

  return (
    <>
      <AdminTopbar title="Nový článek" />

      <div style={{ marginBottom: '16px' }}>
        <a href="/cs/admin/blog" style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na seznam
        </a>
      </div>

      <form action={createBlogPost} className="admin-form">
        <fieldset>
          <legend>Základní info</legend>
          <div className="admin-form-row">
            <div className="admin-form-field" style={{ flex: 2 }}>
              <label htmlFor="slug">Slug *</label>
              <input id="slug" name="slug" type="text" required placeholder="muj-clanek"
                style={{ fontFamily: 'monospace', fontSize: '13px' }} />
            </div>
            <div className="admin-form-field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue="draft">
                <option value="draft">Koncept</option>
                <option value="published">Publikováno</option>
              </select>
            </div>
            <div className="admin-form-field">
              <label htmlFor="reading_time_min">Čtení (min)</label>
              <input id="reading_time_min" name="reading_time_min" type="number" min="1" max="60" defaultValue={5} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="author">Autor</label>
              <input id="author" name="author" type="text" defaultValue="Redakce" />
            </div>
            <div className="admin-form-field">
              <label htmlFor="published_at">Datum publikace</label>
              <input id="published_at" name="published_at" type="datetime-local" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Titulek</legend>
          <div className="admin-form-field">
            <label htmlFor="title_cs">CS *</label>
            <input id="title_cs" name="title_cs" type="text" required />
          </div>
          <div className="admin-form-field">
            <label htmlFor="title_en">EN *</label>
            <input id="title_en" name="title_en" type="text" required />
          </div>
        </fieldset>

        <fieldset>
          <legend>Excerpt (krátký popis)</legend>
          <div className="admin-form-field">
            <label htmlFor="excerpt_cs">CS</label>
            <textarea id="excerpt_cs" name="excerpt_cs" rows={2} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="excerpt_en">EN</label>
            <textarea id="excerpt_en" name="excerpt_en" rows={2} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Meta description (SEO)</legend>
          <div className="admin-form-field">
            <label htmlFor="meta_description_cs">CS</label>
            <textarea id="meta_description_cs" name="meta_description_cs" rows={2} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="meta_description_en">EN</label>
            <textarea id="meta_description_en" name="meta_description_en" rows={2} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Obsah (HTML)</legend>
          <div className="admin-form-field">
            <label htmlFor="content_cs">CS</label>
            <textarea id="content_cs" name="content_cs" rows={16}
              style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="content_en">EN</label>
            <textarea id="content_en" name="content_en" rows={16}
              style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Tagy</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {allTags.map((tag) => (
              <label key={tag.id} className="admin-checkbox-label" style={{ fontSize: '13px' }}>
                <input type="checkbox" name="tag_ids" value={tag.id} />
                {tag.name_cs}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="admin-submit-row">
          <button type="submit" className="admin-btn-submit">Vytvořit článek</button>
          <a href="/cs/admin/blog" className="admin-btn-secondary">Zrušit</a>
        </div>
      </form>
    </>
  );
}
