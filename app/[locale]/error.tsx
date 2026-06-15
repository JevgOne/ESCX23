'use client';

const T: Record<string, { h: string; p: string; btn: string }> = {
  cs: { h: 'Něco se pokazilo', p: 'Zkuste to prosím znovu za chvíli.', btn: 'Zkusit znovu' },
  en: { h: 'Something went wrong', p: 'Please try again in a moment.', btn: 'Try again' },
  de: { h: 'Etwas ist schiefgelaufen', p: 'Bitte versuchen Sie es in einem Moment erneut.', btn: 'Erneut versuchen' },
  uk: { h: 'Щось пішло не так', p: 'Будь ласка, спробуйте ще раз через хвилину.', btn: 'Спробувати знову' },
};

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = typeof window !== 'undefined'
    ? (window.location.pathname.split('/')[1] ?? 'cs')
    : 'cs';
  const t = T[locale] ?? T.en;

  return (
    <main>
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>{t.h}</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>{t.p}</p>
        <button onClick={reset} className="btn btn-primary">{t.btn}</button>
      </div>
    </main>
  );
}
