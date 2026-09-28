'use client';

import { useEffect, useState, useTransition } from 'react';
import { findDuplicates } from '@/lib/client-actions';
import MergeConfirmDialog from './MergeConfirmDialog';

const STYLES = `
.cd-panel {
  background: rgba(251,191,36,0.06); border: 1px solid rgba(251,191,36,0.25);
  border-radius: 10px; padding: 14px; margin-bottom: 16px;
}
.cd-title {
  font-size: 11px; color: #fbbf24; text-transform: uppercase;
  letter-spacing: 0.05em; font-weight: 700; margin-bottom: 10px;
  display: flex; align-items: center; gap: 6px;
}
.cd-warn { font-size: 14px; }
.cd-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px;
  background: rgba(251,191,36,0.06);
  margin-bottom: 6px;
}
.cd-row:last-child { margin-bottom: 0; }
.cd-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--bg-elev); border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; color: var(--coral); font-size: 12px;
  flex-shrink: 0;
}
.cd-info { flex: 1; min-width: 0; }
.cd-name { font-size: 13px; font-weight: 600; color: var(--text); }
.cd-code { font-size: 11px; color: var(--dim); }
.cd-match { font-size: 11px; color: #fbbf24; margin-top: 2px; }
.cd-merge-btn {
  padding: 4px 10px; border-radius: 6px;
  background: transparent; border: 1px solid rgba(251,191,36,0.4);
  color: #fbbf24; font-size: 11px; font-weight: 600;
  cursor: pointer; font-family: inherit; white-space: nowrap;
}
.cd-merge-btn:hover { background: rgba(251,191,36,0.1); }
`;

interface Duplicate {
  clientId: number;
  clientNumber: string;
  nickname: string;
  matchType: 'phone' | 'telegram' | 'name';
  matchDetail: string;
}

export default function ClientDuplicates({
  clientId,
  clientNickname,
  clientNumber,
}: {
  clientId: number;
  clientNickname: string;
  clientNumber: string;
}) {
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [mergeTarget, setMergeTarget] = useState<Duplicate | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const results = await findDuplicates(clientId);
      setDuplicates(results);
    });
  }, [clientId]);

  if (duplicates.length === 0) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="cd-panel">
        <div className="cd-title">
          <span className="cd-warn">!</span>
          Mozne duplicity ({duplicates.length})
        </div>
        {duplicates.map((d) => (
          <div key={d.clientId} className="cd-row">
            <div className="cd-avatar">{d.nickname.charAt(0).toUpperCase()}</div>
            <div className="cd-info">
              <div className="cd-name">{d.nickname} ({d.clientNumber})</div>
              <div className="cd-match">{d.matchDetail}</div>
            </div>
            <button
              type="button"
              className="cd-merge-btn"
              onClick={() => setMergeTarget(d)}
            >
              Sloucit
            </button>
          </div>
        ))}
      </div>

      {mergeTarget && (
        <MergeConfirmDialog
          keepId={clientId}
          keepNickname={clientNickname}
          keepNumber={clientNumber}
          mergeId={mergeTarget.clientId}
          mergeNickname={mergeTarget.nickname}
          mergeNumber={mergeTarget.clientNumber}
          matchDetail={mergeTarget.matchDetail}
          onClose={() => setMergeTarget(null)}
        />
      )}
    </>
  );
}
