'use client';

import { useTransition, useState } from 'react';
import { updateClientNotes } from '@/lib/client-actions';

const STYLES = `
.cn-card {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 10px; padding: 14px; margin-bottom: 20px;
}
.cn-title {
  font-size: 11px; color: var(--dim); text-transform: uppercase;
  letter-spacing: 0.05em; margin-bottom: 8px; font-weight: 600;
}
.cn-text {
  font-size: 13px; color: var(--text); line-height: 1.5;
  min-height: 20px;
}
.cn-empty { color: var(--dim); font-style: italic; }
.cn-edit-btn {
  margin-top: 8px; padding: 4px 10px; border-radius: 6px;
  background: transparent; border: 1px solid var(--line);
  color: var(--muted); font-size: 11px; font-weight: 600;
  cursor: pointer; font-family: inherit;
}
.cn-edit-btn:hover { border-color: var(--coral); color: var(--coral); }
.cn-textarea {
  width: 100%; min-height: 60px; padding: 8px;
  background: var(--bg); border: 1px solid var(--line);
  border-radius: 6px; color: var(--text); font-size: 13px;
  font-family: inherit; resize: vertical; outline: none;
}
.cn-textarea:focus { border-color: var(--coral); }
.cn-btn-row { display: flex; gap: 8px; margin-top: 8px; }
.cn-save-btn {
  padding: 6px 14px; border-radius: 6px;
  background: var(--coral); color: #fff; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.cn-save-btn:disabled { opacity: 0.5; }
.cn-cancel-btn {
  padding: 6px 14px; border-radius: 6px;
  background: transparent; color: var(--muted); border: 1px solid var(--line);
  font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
}
`;

export default function ClientNotes({
  clientId,
  initialNotes,
}: {
  clientId: number;
  initialNotes: string;
}) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateClientNotes(clientId, notes);
      if ('ok' in result) {
        setSaved(notes);
        setEditing(false);
      }
    });
  }

  function handleCancel() {
    setNotes(saved);
    setEditing(false);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="cn-card">
        <div className="cn-title">Interni poznamky</div>
        {editing ? (
          <>
            <textarea
              className="cn-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Poznamky o klientovi..."
            />
            <div className="cn-btn-row">
              <button
                className="cn-save-btn"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ? 'Ukladam...' : 'Ulozit'}
              </button>
              <button className="cn-cancel-btn" onClick={handleCancel}>
                Zrusit
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={`cn-text${!saved ? ' cn-empty' : ''}`}>
              {saved || 'Zadne poznamky'}
            </div>
            <button className="cn-edit-btn" onClick={() => setEditing(true)}>
              Upravit poznamky
            </button>
          </>
        )}
      </div>
    </>
  );
}
