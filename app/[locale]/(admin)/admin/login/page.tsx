import { setRequestLocale } from 'next-intl/server';
import { loginAdmin } from '@/lib/auth-actions';
import LogoMark from '@/components/ui/LogoMark';

export const dynamic = 'force-dynamic';

const LOGIN_STYLES = `
.escx-login-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  background:
    radial-gradient(80% 60% at 15% 10%, rgba(154, 29, 81, 0.45), transparent 70%),
    radial-gradient(60% 50% at 90% 95%, rgba(242, 125, 141, 0.30), transparent 70%),
    radial-gradient(45% 40% at 50% 50%, rgba(200, 75, 139, 0.18), transparent 70%),
    linear-gradient(180deg, #0c0610 0%, #050208 100%);
  overflow: hidden;
  z-index: 1000;
}
.escx-login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0);
  background-size: 34px 34px;
  mask-image: radial-gradient(ellipse at center, #000 35%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, #000 35%, transparent 75%);
  pointer-events: none;
}
.escx-login-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(242, 125, 141, 0.18), transparent 60%);
  filter: blur(80px);
  pointer-events: none;
}
.escx-login-glow.top { top: -200px; left: -150px; }
.escx-login-glow.bot { bottom: -250px; right: -200px; background: radial-gradient(circle, rgba(200, 75, 139, 0.22), transparent 60%); }

.escx-login-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: linear-gradient(180deg, rgba(32, 16, 24, 0.85) 0%, rgba(18, 9, 14, 0.92) 100%);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  padding: 44px 40px 32px;
  box-shadow:
    0 28px 80px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(242, 125, 141, 0.06) inset,
    0 -1px 0 rgba(255, 255, 255, 0.05) inset;
  z-index: 1;
}

.escx-login-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}
.escx-login-logo {
  width: 88px;
  height: 88px;
  border-radius: 22px;
  background:
    radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18), transparent 55%),
    linear-gradient(135deg, #f9a8b8 0%, #f27d8d 30%, #c84b8b 70%, #9a1d51 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 16px 40px rgba(200, 75, 139, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset,
    0 -3px 0 rgba(0, 0, 0, 0.18) inset;
  position: relative;
}
.escx-login-logo svg {
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
}
.escx-login-logo svg path {
  fill: #fff !important;
}
.escx-login-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(242, 125, 141, 0.75);
}
.escx-login-h1 {
  font-family: var(--font-display, 'Cormorant Garamond', serif);
  font-size: 32px;
  font-weight: 500;
  font-style: italic;
  color: #fff;
  margin: 0;
  text-align: center;
  line-height: 1.1;
  letter-spacing: -0.01em;
}
.escx-login-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin: 10px 0 30px;
  font-weight: 400;
}

.escx-login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.escx-login-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.escx-login-field label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  display: block;
}
.escx-login-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 11px;
  padding: 14px 16px;
  font-size: 14px;
  color: #fff;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  -webkit-appearance: none;
  appearance: none;
}
.escx-login-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}
.escx-login-input:hover {
  border-color: rgba(255, 255, 255, 0.16);
}
.escx-login-input:focus {
  outline: none;
  border-color: rgba(242, 125, 141, 0.6);
  background: rgba(0, 0, 0, 0.55);
  box-shadow: 0 0 0 4px rgba(242, 125, 141, 0.1);
}

.escx-login-submit {
  margin-top: 10px;
  width: 100%;
  padding: 15px 20px;
  border: none;
  border-radius: 11px;
  background: linear-gradient(135deg, #f27d8d 0%, #c84b8b 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 0 10px 28px rgba(200, 75, 139, 0.4);
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}
.escx-login-submit:hover {
  opacity: 0.96;
  transform: translateY(-1px);
  box-shadow: 0 14px 36px rgba(200, 75, 139, 0.5);
}
.escx-login-submit:active { transform: translateY(0); }

.escx-login-error {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fca5a5;
  font-size: 13px;
  margin: 0 0 8px;
  padding: 13px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.28);
  border-radius: 11px;
}
.escx-login-error-icon {
  flex-shrink: 0;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  color: #ef4444;
}

.escx-login-foot {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.32);
  text-transform: uppercase;
}
.escx-login-foot strong {
  color: rgba(242, 125, 141, 0.8);
  font-weight: 600;
}

.escx-login-remember {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}
.escx-login-remember input[type="checkbox"] {
  accent-color: var(--color-coral, #f27d8d);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* Kill app-wide chrome on login page */
body:has(.escx-login-page) { overflow: hidden; }
`;

export default async function AdminLoginPage({
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
    <div className="escx-login-page">
      <style dangerouslySetInnerHTML={{ __html: LOGIN_STYLES }} />

      <div className="escx-login-glow top" aria-hidden="true" />
      <div className="escx-login-glow bot" aria-hidden="true" />

      <div className="escx-login-card">
        <div className="escx-login-brand">
          <div className="escx-login-logo" aria-hidden="true">
            <LogoMark size={88} />
          </div>
          <span className="escx-login-tag">LovelyGirls · Admin</span>
        </div>

        <h1 className="escx-login-h1">Vítej zpět</h1>
        <p className="escx-login-sub">Přihlaš se do administrace</p>

        {error === 'invalid' && (
          <div className="escx-login-error">
            <span className="escx-login-error-icon">!</span>
            <span>Nesprávný email nebo heslo.</span>
          </div>
        )}

        <form action={loginAdmin} className="escx-login-form">
          <div className="escx-login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="info@lovelygirls.cz"
              autoComplete="email"
              autoFocus
              className="escx-login-input"
            />
          </div>

          <div className="escx-login-field">
            <label htmlFor="password">Heslo</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              autoComplete="current-password"
              className="escx-login-input"
            />
          </div>

          <label className="escx-login-remember">
            <input type="checkbox" name="remember" />
            <span>Zapamatovat si mě (7 dní)</span>
          </label>

          <button type="submit" className="escx-login-submit">
            Přihlásit →
          </button>
        </form>

        <div className="escx-login-foot">
          Pouze pro autorizovaný personál · <strong>v2.0</strong>
        </div>
      </div>
    </div>
  );
}
