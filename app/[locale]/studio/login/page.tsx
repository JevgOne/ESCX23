import { setRequestLocale } from 'next-intl/server';
import { loginGirl } from '@/lib/auth-actions';

export const dynamic = 'force-dynamic';

export default async function StudioLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { error } = await searchParams;

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Studio přihlášení</h1>
        {error === 'invalid' && (
          <p className="login-error">Nesprávný email nebo heslo.</p>
        )}
        {error === 'ratelimit' && (
          <p className="login-error">Příliš mnoho pokusů. Zkuste to za 15 minut.</p>
        )}
        <form action={loginGirl}>
          <input name="email" type="email" required placeholder="Email" autoComplete="email" />
          <input name="password" type="password" required placeholder="Heslo" autoComplete="current-password" />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', margin: '4px 0' }}>
            <input type="checkbox" name="remember" style={{ accentColor: '#f27d8d', width: '16px', height: '16px', cursor: 'pointer' }} />
            <span>Zapamatovat si mě (7 dní)</span>
          </label>
          <button type="submit" className="btn-pink">Přihlásit</button>
        </form>
      </div>
    </div>
  );
}
