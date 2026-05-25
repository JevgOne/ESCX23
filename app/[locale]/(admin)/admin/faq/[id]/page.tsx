import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { updateFaq, deleteFaq } from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface FaqRow {
  id: number;
  category: string;
  display_order: number;
  is_active: number;
  question_cs: string;
  question_en: string;
  question_de: string;
  question_uk: string;
  answer_cs: string;
  answer_en: string;
  answer_de: string;
  answer_uk: string;
}

const CATEGORIES = ['booking', 'services', 'payment', 'discretion', 'general'];

export default async function AdminEditFaqPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await db.execute({ sql: 'SELECT * FROM faq_items WHERE id=?', args: [Number(id)] });
  if (result.rows.length === 0) notFound();

  const faq = result.rows[0] as unknown as FaqRow;

  return (
    <>
      <AdminTopbar title={`Editace FAQ: ${faq.question_cs.slice(0, 60)}…`} />

      <div style={{ marginBottom: '16px' }}>
        <a href="/cs/admin/faq" style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          ← Zpět na seznam
        </a>
      </div>

      <form action={updateFaq} className="admin-form">
        <input type="hidden" name="id" value={faq.id} />

        <fieldset>
          <legend>Základní info</legend>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="category">Kategorie *</label>
              <select id="category" name="category" defaultValue={faq.category}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-field">
              <label htmlFor="display_order">Pořadí</label>
              <input id="display_order" name="display_order" type="number" defaultValue={faq.display_order} />
            </div>
            <div className="admin-form-field">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="is_active" defaultChecked={Boolean(faq.is_active)} />
                Aktivní
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Otázka (4 jazyky)</legend>
          <div className="admin-form-field">
            <label htmlFor="question_cs">CS *</label>
            <input id="question_cs" name="question_cs" type="text" required defaultValue={faq.question_cs} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="question_en">EN *</label>
            <input id="question_en" name="question_en" type="text" required defaultValue={faq.question_en} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="question_de">DE *</label>
            <input id="question_de" name="question_de" type="text" required defaultValue={faq.question_de} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="question_uk">UK *</label>
            <input id="question_uk" name="question_uk" type="text" required defaultValue={faq.question_uk} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Odpověď (4 jazyky — HTML povoleno)</legend>
          <div className="admin-form-field">
            <label htmlFor="answer_cs">CS *</label>
            <textarea id="answer_cs" name="answer_cs" rows={5} required defaultValue={faq.answer_cs} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="answer_en">EN *</label>
            <textarea id="answer_en" name="answer_en" rows={5} required defaultValue={faq.answer_en} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="answer_de">DE *</label>
            <textarea id="answer_de" name="answer_de" rows={5} required defaultValue={faq.answer_de} />
          </div>
          <div className="admin-form-field">
            <label htmlFor="answer_uk">UK *</label>
            <textarea id="answer_uk" name="answer_uk" rows={5} required defaultValue={faq.answer_uk} />
          </div>
        </fieldset>

        <div className="admin-submit-row">
          <button type="submit" className="admin-btn-submit">Uložit změny</button>
          <a href="/cs/admin/faq" className="admin-btn-secondary">Zrušit</a>
        </div>
      </form>

      <div style={{ marginTop: '48px', padding: '20px', border: '1px solid var(--color-red)', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-red)', marginBottom: '12px' }}>
          Nebezpečná zóna
        </div>
        <form action={deleteFaq}>
          <input type="hidden" name="id" value={faq.id} />
          <button type="submit" className="danger-btn">Smazat tuto otázku</button>
        </form>
      </div>
    </>
  );
}
