'use client';

import { useTransition, useState } from 'react';
import { addClientContact } from '@/lib/client-actions';
import { useRouter } from 'next/navigation';

const CHANNELS = [
  { key: 'phone', label: 'Telefon', icon: 'T', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'WA', color: '#25D366', bg: 'rgba(37,211,102,0.12)' },
  { key: 'telegram', label: 'Telegram', icon: 'TG', color: '#229ED9', bg: 'rgba(34,158,217,0.12)' },
  { key: 'email', label: 'Email', icon: '@', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
];

const STYLES = `
.acf-card {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: 10px; padding: 14px; margin-top: -4px;
}
.acf-title {
  font-size: 11px; color: var(--dim); text-transform: uppercase;
  letter-spacing: 0.05em; margin-bottom: 10px; font-weight: 600;
}
.acf-channels {
  display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap;
}
.acf-ch-btn {
  padding: 6px 12px; border-radius: 8px;
  background: var(--bg); border: 1px solid var(--line);
  color: var(--muted); font-size: 11px; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all 0.1s;
}
.acf-ch-btn:hover { border-color: var(--coral); color: var(--coral); }
.acf-ch-btn.active { border-color: var(--coral); color: var(--coral); background: rgba(242,125,141,0.08); }
.acf-input {
  width: 100%; padding: 8px 10px;
  background: var(--bg); border: 1px solid var(--line);
  border-radius: 6px; color: var(--text); font-size: 13px;
  font-family: inherit; outline: none; margin-bottom: 8px;
}
.acf-input:focus { border-color: var(--coral); }
.acf-label-row {
  display: flex; gap: 8px; align-items: center; margin-bottom: 8px;
}
.acf-label-input {
  flex: 1; padding: 8px 10px;
  background: var(--bg); border: 1px solid var(--line);
  border-radius: 6px; color: var(--text); font-size: 13px;
  font-family: inherit; outline: none;
}
.acf-label-input:focus { border-color: var(--coral); }
.acf-check {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--muted); margin-bottom: 10px;
  cursor: pointer;
}
.acf-btn-row { display: flex; gap: 8px; }
.acf-save {
  padding: 6px 14px; border-radius: 6px;
  background: var(--coral); color: #fff; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.acf-save:disabled { opacity: 0.5; }
.acf-cancel {
  padding: 6px 14px; border-radius: 6px;
  background: transparent; color: var(--muted); border: 1px solid var(--line);
  font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.acf-error { color: #ef4444; font-size: 12px; margin-top: 6px; }
`;

export default function AddContactForm({
  clientId,
  onClose,
}: {
  clientId: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [channel, setChannel] = useState('phone');
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState('');

  function handleSave() {
    if (!value.trim()) {
      setError('Vyplnte hodnotu.');
      return;
    }
    setError('');
    startTransition(async () => {
      const result = await addClientContact(
        clientId,
        channel,
        value.trim(),
        label.trim() || undefined,
        isPrimary,
      );
      if ('error' in result) {
        setError(result.error);
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  const placeholder =
    channel === 'phone' || channel === 'whatsapp'
      ? '+420 777 123 456'
      : channel === 'telegram'
        ? '@username nebo chat ID'
        : 'email@priklad.cz';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="acf-card">
        <div className="acf-title">Pridat kontakt</div>

        <div className="acf-channels">
          {CHANNELS.map((ch) => (
            <button
              key={ch.key}
              type="button"
              className={`acf-ch-btn${channel === ch.key ? ' active' : ''}`}
              onClick={() => setChannel(ch.key)}
            >
              {ch.label}
            </button>
          ))}
        </div>

        <input
          className="acf-input"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <div className="acf-label-row">
          <input
            className="acf-label-input"
            type="text"
            placeholder='Popisek (volitelny: "Osobni", "Pracovni")'
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        <label className="acf-check">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
          />
          Primarni kontakt
        </label>

        <div className="acf-btn-row">
          <button
            type="button"
            className="acf-save"
            disabled={isPending}
            onClick={handleSave}
          >
            {isPending ? 'Ukladam...' : 'Ulozit'}
          </button>
          <button type="button" className="acf-cancel" onClick={onClose}>
            Zrusit
          </button>
        </div>

        {error && <div className="acf-error">{error}</div>}
      </div>
    </>
  );
}
