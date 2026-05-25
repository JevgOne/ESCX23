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
        <form action={loginGirl}>
          <input name="email" type="email" required placeholder="Email" autoComplete="email" />
          <input name="password" type="password" required placeholder="Heslo" autoComplete="current-password" />
          <button type="submit" className="btn-pink">Přihlásit</button>
        </form>
      </div>
    </div>
  );
}
