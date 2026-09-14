'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateClientTrustLevel, toggleClientBan } from '@/lib/client-actions';

const STYLES = `
.cta-card {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 10px; padding: 14px; margin-bottom: 20px;
}
.cta-title {
  font-size: 11px; color: var(--dim); text-transform: uppercase;
  letter-spacing: 0.05em; margin-bottom: 10px; font-weight: 600;
}
.cta-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.cta-trust-btn {
  padding: 6px 12px; border-radius: 6px;
  border: 1px solid var(--line); background: transparent;
  font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit;
  color: var(--muted);
}
.cta-trust-btn:hover { border-color: var(--coral); color: var(--coral); }
.cta-trust-btn.active { border-color: var(--coral); color: var(--coral); background: rgba(242,125,141,0.08); }
.cta-trust-btn:disabled { opacity: 0.5; cursor: default; }
.cta-sep {
  width: 1px; height: 24px; background: var(--line);
  margin: 0 4px;
}
.cta-ban-btn {
  padding: 6px 12px; border-radius: 6px;
  border: 1px solid rgba(239,68,68,0.3); background: transparent;
  font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit;
  color: var(--red);
}
.cta-ban-btn:hover { background: rgba(239,68,68,0.08); }
.cta-ban-btn:disabled { opacity: 0.5; cursor: default; }
.cta-unban-btn {
  padding: 6px 12px; border-radius: 6px;
  border: 1px solid rgba(74,222,128,0.3); background: transparent;
  font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit;
  color: var(--green);
}
.cta-unban-btn:hover { background: rgba(74,222,128,0.08); }
.cta-ban-reason {
  font-size: 11px; color: var(--red); margin-top: 6px;
}
.cta-msg {
  font-size: 11px; margin-top: 8px; padding: 4px 8px;
  border-radius: 4px;
}
.cta-msg.ok { background: rgba(74,222,128,0.1); color: var(--green); }
.cta-msg.err { background: rgba(239,68,68,0.1); color: var(--red); }
`;

const TRUST_LEVELS = [
  { key: 'new', label: 'Novy' },
  { key: 'verified', label: 'Overeny' },
  { key: 'regular', label: 'Staly' },
  { key: 'vip', label: 'VIP' },
];

export default function ClientTrustActions({
  clientId,
  currentTrustLevel,
  isBanned,
  banReason,
}: {
  clientId: number;
  currentTrustLevel: string;
  isBanned: boolean;
  banReason: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function handleTrustChange(level: string) {
    if (level === currentTrustLevel) return;
    setMessage(null);
    startTransition(async () => {
      const result = await updateClientTrustLevel(clientId, level);
      if ('ok' in result) {
        setMessage({ text: `Trust level zmenen na ${level}`, ok: true });
        router.refresh();
      } else {
        setMessage({ text: result.error, ok: false });
      }
    });
  }

  function handleBanToggle() {
    setMessage(null);
    startTransition(async () => {
      const result = await toggleClientBan(clientId, !isBanned);
      if ('ok' in result) {
        setMessage({ text: isBanned ? 'Klient odbanovan' : 'Klient zabanovan', ok: true });
        router.refresh();
      } else {
        setMessage({ text: result.error, ok: false });
      }
    });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="cta-card">
        <div className="cta-title">Sprava klienta (admin)</div>
        <div className="cta-row">
          {TRUST_LEVELS.map((tl) => (
            <button
              key={tl.key}
              className={`cta-trust-btn${currentTrustLevel === tl.key ? ' active' : ''}`}
              onClick={() => handleTrustChange(tl.key)}
              disabled={isPending || currentTrustLevel === tl.key}
            >
              {tl.label}
            </button>
          ))}
          <div className="cta-sep" />
          {isBanned ? (
            <button
              className="cta-unban-btn"
              onClick={handleBanToggle}
              disabled={isPending}
            >
              Odbanovat
            </button>
          ) : (
            <button
              className="cta-ban-btn"
              onClick={handleBanToggle}
              disabled={isPending}
            >
              Banovat
            </button>
          )}
        </div>
        {isBanned && banReason && (
          <div className="cta-ban-reason">Duvod banu: {banReason}</div>
        )}
        {message && (
          <div className={`cta-msg${message.ok ? ' ok' : ' err'}`}>{message.text}</div>
        )}
      </div>
    </>
  );
}
