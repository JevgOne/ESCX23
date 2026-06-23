import { headers } from 'next/headers';

const T: Record<string, { h: string; p: string; btn: string }> = {
  cs: { h: 'Stránka nenalezena', p: 'Stránka, kterou hledáte, neexistuje nebo byla odstraněna.', btn: 'Zpět na hlavní stránku' },
  en: { h: 'Page not found', p: 'The page you are looking for does not exist or has been removed.', btn: 'Back to homepage' },
  de: { h: 'Seite nicht gefunden', p: 'Die Seite, die Sie suchen, existiert nicht oder wurde entfernt.', btn: 'Zurück zur Startseite' },
  uk: { h: 'Сторінку не знайдено', p: 'Сторінка, яку ви шукаєте, не існує або була видалена.', btn: 'На головну' },
};

const LOCALES = new Set(['cs', 'en', 'de', 'uk']);

export default async function NotFoundPage() {
  const h = await headers();
  const url = h.get('x-next-url') ?? h.get('x-invoke-path') ?? '';
  const seg = url.split('/')[1] ?? 'cs';
  const locale = LOCALES.has(seg) ? seg : 'cs';
  const t = T[locale] ?? T.cs;

  return (
    <main>
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>{t.h}</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>{t.p}</p>
        <a href={`/${locale}/`} className="btn btn-primary">{t.btn}</a>
      </div>
    </main>
  );
}
