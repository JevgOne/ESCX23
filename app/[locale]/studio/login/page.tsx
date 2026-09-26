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
        <div className="login-card-brand">
          <div className="login-card-logo">SF</div>
          <span className="login-card-tag">STUDIOFLOW</span>
        </div>
        <h1>Přihlášení</h1>
        <p className="login-card-sub">Interní systém pro členky studia</p>

        {error === 'invalid' && (
          <p className="login-error">Nesprávný email nebo heslo.</p>
        )}
        {error === 'ratelimit' && (
          <p className="login-error">Příliš mnoho pokusů. Zkuste to za 15 minut.</p>
        )}

        <form action={loginGirl}>
          <div className="login-card-field">
            <label htmlFor="email">EMAIL</label>
            <input id="email" name="email" type="email" required placeholder="vas@email.cz" autoComplete="email" />
          </div>
          <div className="login-card-field">
            <label htmlFor="password">HESLO</label>
            <input id="password" name="password" type="password" required placeholder="••••••••" autoComplete="current-password" />
          </div>
          <label className="login-card-remember">
            <input type="checkbox" name="remember" />
            <span>Zapamatovat si mě (7 dní)</span>
          </label>
          <button type="submit" className="login-card-submit">Přihlásit se</button>
        </form>

        <div className="login-card-foot">
          Pouze pro autorizovaný personál
        </div>
      </div>
    </div>
  );
}
