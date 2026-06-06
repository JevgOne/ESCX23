import { setRequestLocale } from 'next-intl/server';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { createFaq } from '@/lib/admin-actions';
import { requireFullAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CATEGORIES = ['booking', 'services', 'payment', 'discretion', 'general'];

export default async function AdminNovaFaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireFullAdmin();

  return (
    <>
      <AdminTopbar title="Nová FAQ otázka" />

      <div style={{ marginBottom: '16px' }}>
        <a href="/cs/admin/faq" style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na seznam
        </a>
      </div>

      <form action={createFaq} className="admin-form">
        <fieldset>
          <legend>Základní info</legend>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="category">Kategorie *</label>
              <select id="category" name="category">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-field">
              <label htmlFor="display_order">Pořadí</label>
              <input id="display_order" name="display_order" type="number" defaultValue={0} />
            </div>
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_active" defaultChecked />
                Aktivní
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Otázka (4 jazyky)</legend>
          <div className="admin-form-field">
            <label htmlFor="question_cs">CS *</label>
            <input id="question_cs" name="question_cs" type="text" required />
          </div>
          <div className="admin-form-field">
            <label htmlFor="question_en">EN *</label>
            <input id="question_en" name="question_en" type="text" required />
          </div>
          <div className="admin-form-field">
            <label htmlFor="question_de">DE *</label>
            <input id="question_de" name="question_de" type="text" required />
          </div>
          <div className="admin-form-field">
            <label htmlFor="question_uk">UK *</label>
            <input id="question_uk" name="question_uk" type="text" required />
          </div>
        </fieldset>

        <fieldset>
          <legend>Odpověď (4 jazyky — HTML povoleno)</legend>
          <div className="admin-form-field">
            <label htmlFor="answer_cs">CS *</label>
            <textarea id="answer_cs" name="answer_cs" rows={5} required />
          </div>
          <div className="admin-form-field">
            <label htmlFor="answer_en">EN *</label>
            <textarea id="answer_en" name="answer_en" rows={5} required />
          </div>
          <div className="admin-form-field">
            <label htmlFor="answer_de">DE *</label>
            <textarea id="answer_de" name="answer_de" rows={5} required />
          </div>
          <div className="admin-form-field">
            <label htmlFor="answer_uk">UK *</label>
            <textarea id="answer_uk" name="answer_uk" rows={5} required />
          </div>
        </fieldset>

        <div className="admin-submit-row">
          <button type="submit" className="admin-btn-submit">Vytvořit otázku</button>
          <a href="/cs/admin/faq" className="admin-btn-secondary">Zrušit</a>
        </div>
      </form>
    </>
  );
}
