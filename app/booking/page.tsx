import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { loginBooking } from '@/lib/auth-actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: 'Přihlášení · STUDIOFLOW' };
}

const LOGIN_STYLES = `
  :root {
    --bg: #0c0a0e;
    --bg-soft: #15101a;
    --bg-elev: #1f1726;
    --line: #2a2230;
    --text: #f4eef4;
    --muted: #a89cb0;
    --dim: #6a5e72;
    --coral: #f27d8d;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .login-card {
    width: 380px;
    max-width: calc(100vw - 48px);
    padding: 40px 36px;
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: 20px;
    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.6);
    text-align: center;
  }
  .login-logo {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin-bottom: 4px;
  }
  .login-logo span { color: var(--coral); }
  .login-subtitle {
    font-size: 13px;
    color: var(--dim);
    margin-bottom: 32px;
  }
  .login-field {
    margin-bottom: 16px;
    text-align: left;
  }
  .login-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .login-input {
    width: 100%;
    padding: 12px 14px;
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--text);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }
  .login-input:focus { border-color: var(--coral); }
  .login-input::placeholder { color: var(--dim); }
  .login-remember {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 13px;
    color: var(--muted);
    cursor: pointer;
    text-align: left;
  }
  .login-remember input[type="checkbox"] {
    accent-color: var(--coral);
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  .login-btn {
    width: 100%;
    padding: 14px;
    margin-top: 8px;
    background: var(--coral);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
  }
  .login-btn:hover { background: #e06a7a; }
  .login-error {
    padding: 12px 14px;
    margin-bottom: 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 10px;
    color: #fca5a5;
    font-size: 13px;
    text-align: left;
  }
  .login-hint {
    font-size: 11px;
    color: var(--dim);
    margin-top: 24px;
    line-height: 1.5;
  }
`;

export default async function BookingLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // If already logged in, redirect based on role
  const user = await getCurrentUser();
  if (user) {
    if (user.role === 'girl') redirect('/studio/dashboard');
    if (user.role === 'operator') redirect('/booking/calendar');
    if (user.role === 'admin' || user.role === 'manager') redirect('/booking/dashboard');
  }

  const { error } = await searchParams;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LOGIN_STYLES }} />
      <div className="login-card">
        <div className="login-logo">STUDIO<span>FLOW</span></div>
        <div className="login-subtitle">Rezervační systém</div>

        {error === 'invalid' && (
          <div className="login-error">Nesprávný email nebo heslo.</div>
        )}
        {error === 'ratelimit' && (
          <div className="login-error">Příliš mnoho pokusů. Zkuste to za 15 minut.</div>
        )}

        <form action={loginBooking} method="POST">
          <div className="login-field">
            <label className="login-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="operatorka@lovelygirls.cz"
              autoComplete="email"
              autoFocus
              className="login-input"
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">Heslo</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              autoComplete="current-password"
              className="login-input"
            />
          </div>

          <label className="login-remember">
            <input type="checkbox" name="remember" />
            <span>Zapamatovat si mě (7 dní)</span>
          </label>

          <button type="submit" className="login-btn">Přihlásit se</button>
        </form>

        <div className="login-hint">
          Pouze pro autorizovaný personál
        </div>
      </div>
    </>
  );
}
