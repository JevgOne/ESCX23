'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { changePassword, logoutBookingAction } from '@/lib/auth-actions';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

interface Props {
  telegramLink: string;
  hasTelegram: boolean;
}

export default function StudioSettingsClient({ telegramLink, hasTelegram }: Props) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [done, setDone] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const isForced = searchParams.get('force') === '1';

  // Push notification state
  const [pushState, setPushState] = useState<'loading' | 'unsupported' | 'denied' | 'on' | 'off'>('loading');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setPushState('denied');
      return;
    }
    navigator.serviceWorker.getRegistration('/sw-push.js').then(async (reg) => {
      if (!reg) { setPushState('off'); return; }
      const sub = await reg.pushManager.getSubscription();
      setPushState(sub ? 'on' : 'off');
    });
  }, []);

  async function handleTogglePush() {
    if (pushState === 'on') {
      const reg = await navigator.serviceWorker.getRegistration('/sw-push.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setPushState('off');
    } else {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setPushState('denied'); return; }

      const reg = await navigator.serviceWorker.register('/sw-push.js');
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });

      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      setPushState('on');
    }
  }

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await changePassword(formData);
      if ('error' in result && result.error) {
        setMessage({ type: 'err', text: String(result.error) });
      } else {
        setMessage({ type: 'ok', text: 'Heslo bylo zmeneno! Zapamatuj si ho.' });
        setDone(true);
        const form = document.querySelector('.sp-form') as HTMLFormElement | null;
        form?.reset();
      }
    });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="sp-page">
        <h1 className="sp-title">Nastaveni</h1>

        {isForced && !done && (
          <div className="sp-warning">
            <div className="sp-warning-title">Musis si zmenit heslo</div>
            <div className="sp-warning-text">
              Pred pouzitim aplikace si nastav vlastni heslo.
              Zapamatuj si ho — nikdo ti ho nemuze pripomenout!
            </div>
          </div>
        )}

        {/* Password change */}
        <div className="sp-section">
          <h2 className="sp-section-title">Zmena hesla</h2>

          <form action={handleSubmit} className="sp-form">
            <label className="sp-label">
              Soucasne heslo
              <input type="password" name="currentPassword" required className="sp-input" autoComplete="current-password" />
            </label>
            <label className="sp-label">
              Nove heslo
              <input type="password" name="newPassword" required minLength={6} className="sp-input" autoComplete="new-password" />
            </label>
            <label className="sp-label">
              Zopakovat nove heslo
              <input type="password" name="confirmPassword" required minLength={6} className="sp-input" autoComplete="new-password" />
            </label>

            <div className="sp-remember">
              Zapamatuj si heslo! Nikdo ti ho nemuze pripomenout.
            </div>

            {message && (
              <div className={`sp-msg sp-msg-${message.type}`}>{message.text}</div>
            )}

            <button type="submit" className="sp-btn" disabled={isPending}>
              {isPending ? 'Menim...' : 'Zmenit heslo'}
            </button>
          </form>

          {done && isForced && (
            <button className="sp-btn-continue" onClick={() => router.push('/studio/dashboard')}>
              Pokracovat do aplikace
            </button>
          )}
        </div>

        {/* Notifications */}
        <div className="sp-section">
          <h2 className="sp-section-title">Notifikace</h2>

          {/* Telegram */}
          <div className="sp-notif-row">
            <div>
              <div className="sp-notif-label">Telegram</div>
              <div className="sp-notif-desc">
                {hasTelegram
                  ? 'Propojeno — notifikace chodi na Telegram'
                  : 'Propoj Telegram pro notifikace o rezervacich'
                }
              </div>
            </div>
            {hasTelegram ? (
              <span className="sp-notif-badge sp-notif-on">Aktivni</span>
            ) : (
              <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="sp-notif-link">
                Propojit
              </a>
            )}
          </div>

          {/* Push notifications */}
          <div className="sp-notif-row" style={{ marginTop: 12 }}>
            <div>
              <div className="sp-notif-label">Push notifikace</div>
              <div className="sp-notif-desc">
                {pushState === 'unsupported' && 'Tvuj prohlizec nepodporuje push notifikace'}
                {pushState === 'denied' && 'Zablokovano — povol v nastaveni prohlizece'}
                {pushState === 'loading' && 'Nacitam...'}
                {pushState === 'on' && 'Zapnuto — upozorneni chodi na toto zarizeni'}
                {pushState === 'off' && 'Zapni pro upozorneni primo na mobil'}
              </div>
            </div>
            {(pushState === 'on' || pushState === 'off') && (
              <button
                className={`sp-push-toggle ${pushState === 'on' ? 'active' : ''}`}
                onClick={handleTogglePush}
                type="button"
              >
                <span className="sp-push-knob" />
              </button>
            )}
          </div>
        </div>

        {/* Logout */}
        <div className="sp-section">
          <form action={logoutBookingAction}>
            <button type="submit" className="sp-logout">Odhlasit se</button>
          </form>
        </div>
      </div>
    </>
  );
}

const STYLES = `
.sp-page { padding: 20px; }
.sp-title { font-size: 18px; font-weight: 800; margin-bottom: 20px; }

.sp-warning {
  background: rgba(251,191,36,0.12); border: 2px solid rgba(251,191,36,0.4);
  border-radius: 12px; padding: 16px; margin-bottom: 16px;
}
.sp-warning-title { font-size: 16px; font-weight: 800; color: var(--yellow); margin-bottom: 6px; }
.sp-warning-text { font-size: 13px; color: var(--yellow); line-height: 1.5; }

.sp-section {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 12px; padding: 16px; margin-bottom: 12px;
}
.sp-section-title {
  font-size: 13px; font-weight: 700; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px;
}

.sp-form { display: flex; flex-direction: column; gap: 12px; }
.sp-label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 600; color: var(--muted); }
.sp-input {
  padding: 10px 12px; background: var(--bg); border: 1px solid var(--line);
  border-radius: 8px; color: var(--text); font-size: 14px; font-family: inherit; outline: none; width: 100%;
}
.sp-input:focus { border-color: var(--coral); }
.sp-remember {
  padding: 10px 12px; background: rgba(242,125,141,0.1); border: 1px solid rgba(242,125,141,0.3);
  border-radius: 8px; font-size: 12px; font-weight: 700; color: var(--coral); text-align: center;
}

.sp-btn {
  padding: 10px 20px; background: var(--coral); color: #fff; border: none;
  border-radius: 8px; font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; margin-top: 4px;
}
.sp-btn:hover { opacity: 0.9; }
.sp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.sp-btn-continue {
  width: 100%; padding: 12px; background: var(--green); color: #000; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer; margin-top: 12px;
}
.sp-btn-continue:hover { opacity: 0.9; }

.sp-msg { padding: 10px 12px; border-radius: 8px; font-size: 13px; }
.sp-msg-ok { background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.3); color: var(--green); }
.sp-msg-err { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }

/* Notifications */
.sp-notif-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}
.sp-notif-row:last-child { border-bottom: none; }
.sp-notif-label { font-size: 14px; font-weight: 600; }
.sp-notif-desc { font-size: 11px; color: var(--dim); margin-top: 2px; }
.sp-notif-badge {
  font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 6px;
  text-transform: uppercase; white-space: nowrap;
}
.sp-notif-on { background: rgba(74,222,128,0.15); color: var(--green); }
.sp-notif-link {
  padding: 8px 16px; border-radius: 8px; background: #229ED9; color: #fff;
  font-size: 12px; font-weight: 700; text-decoration: none; white-space: nowrap;
}
.sp-notif-link:hover { opacity: 0.9; }

/* Push toggle */
.sp-push-toggle {
  width: 48px; height: 28px; border-radius: 14px; background: var(--bg);
  border: 1px solid var(--line); cursor: pointer; position: relative; flex-shrink: 0;
  transition: background 0.2s;
}
.sp-push-toggle.active { background: var(--green); border-color: var(--green); }
.sp-push-knob {
  position: absolute; top: 3px; left: 3px; width: 20px; height: 20px;
  border-radius: 50%; background: var(--muted); transition: transform 0.2s, background 0.2s;
}
.sp-push-toggle.active .sp-push-knob { transform: translateX(20px); background: #fff; }

.sp-logout {
  width: 100%; padding: 10px; background: transparent; border: 1px solid var(--red);
  border-radius: 8px; color: var(--red); font-size: 13px; font-weight: 600;
  font-family: inherit; cursor: pointer;
}
.sp-logout:hover { background: rgba(239,68,68,0.08); }
`;
