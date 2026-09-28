'use client';

import { useTransition, useState } from 'react';
import { mergeClients } from '@/lib/client-actions';
import { useRouter } from 'next/navigation';

const STYLES = `
.mcd-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.mcd-dialog {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 14px; padding: 24px; width: 100%; max-width: 440px;
}
.mcd-title {
  font-size: 16px; font-weight: 700; color: var(--text);
  margin-bottom: 16px;
}
.mcd-desc {
  font-size: 13px; color: var(--muted); margin-bottom: 16px; line-height: 1.5;
}
.mcd-match {
  display: inline-block; padding: 2px 8px; border-radius: 4px;
  background: rgba(251,191,36,0.12); color: #fbbf24;
  font-size: 11px; font-weight: 600; margin-bottom: 16px;
}
.mcd-clients {
  display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px;
  align-items: center; margin-bottom: 20px;
}
.mcd-client {
  background: var(--bg); border: 1px solid var(--line);
  border-radius: 10px; padding: 14px; text-align: center;
}
.mcd-client.keep { border-color: #4ade80; }
.mcd-client-label {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em;
  font-weight: 700; margin-bottom: 6px;
}
.mcd-client.keep .mcd-client-label { color: #4ade80; }
.mcd-client.merge .mcd-client-label { color: #ef4444; }
.mcd-client-name { font-size: 14px; font-weight: 600; color: var(--text); }
.mcd-client-code { font-size: 11px; color: var(--dim); font-family: ui-monospace, monospace; }
.mcd-arrow { color: var(--dim); font-size: 20px; font-weight: 700; }
.mcd-warn {
  font-size: 12px; color: #ef4444; background: rgba(239,68,68,0.08);
  border-radius: 8px; padding: 10px; margin-bottom: 16px; line-height: 1.5;
}
.mcd-btns { display: flex; gap: 8px; justify-content: flex-end; }
.mcd-btn-merge {
  padding: 8px 16px; border-radius: 8px;
  background: #ef4444; color: #fff; border: none;
  font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.mcd-btn-merge:disabled { opacity: 0.5; }
.mcd-btn-cancel {
  padding: 8px 16px; border-radius: 8px;
  background: transparent; color: var(--muted); border: 1px solid var(--line);
  font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.mcd-error { color: #ef4444; font-size: 12px; margin-top: 8px; }
`;

export default function MergeConfirmDialog({
  keepId,
  keepNickname,
  keepNumber,
  mergeId,
  mergeNickname,
  mergeNumber,
  matchDetail,
  onClose,
}: {
  keepId: number;
  keepNickname: string;
  keepNumber: string;
  mergeId: number;
  mergeNickname: string;
  mergeNumber: string;
  matchDetail: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleMerge() {
    setError('');
    startTransition(async () => {
      const result = await mergeClients(keepId, mergeId);
      if ('error' in result) {
        setError(result.error);
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="mcd-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="mcd-dialog">
          <div className="mcd-title">Sloucit klienty</div>
          <div className="mcd-match">{matchDetail}</div>
          <div className="mcd-desc">
            Vsechny rezervace, kontakty a statistiky budou presunuty do zachovaneho profilu.
            Slouceny profil bude smazan.
          </div>

          <div className="mcd-clients">
            <div className="mcd-client keep">
              <div className="mcd-client-label">Zachovat</div>
              <div className="mcd-client-name">{keepNickname}</div>
              <div className="mcd-client-code">{keepNumber}</div>
            </div>
            <div className="mcd-arrow">&larr;</div>
            <div className="mcd-client merge">
              <div className="mcd-client-label">Smazat</div>
              <div className="mcd-client-name">{mergeNickname}</div>
              <div className="mcd-client-code">{mergeNumber}</div>
            </div>
          </div>

          <div className="mcd-warn">
            Tato akce je nevratna. Profil {mergeNickname} ({mergeNumber}) bude trvale smazan.
          </div>

          <div className="mcd-btns">
            <button type="button" className="mcd-btn-cancel" onClick={onClose}>
              Zrusit
            </button>
            <button
              type="button"
              className="mcd-btn-merge"
              disabled={isPending}
              onClick={handleMerge}
            >
              {isPending ? 'Slucuji...' : 'Sloucit a smazat'}
            </button>
          </div>

          {error && <div className="mcd-error">{error}</div>}
        </div>
      </div>
    </>
  );
}
