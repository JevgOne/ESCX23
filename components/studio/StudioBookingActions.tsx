'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { markClientArrived, markBookingCompleted } from '@/lib/studio-booking-actions';

const STYLES = `
  .nd-actions { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
  .nd-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px; border-radius: 10px; border: none;
    font-size: 14px; font-weight: 700; cursor: pointer; width: 100%;
  }
  .nd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .nd-btn-primary { background: var(--green); color: #000; }
  .nd-btn-complete { background: var(--coral); color: #fff; }
  .nd-btn-secondary {
    background: var(--bg-elev); border: 1px solid var(--line);
    color: var(--text); font-size: 13px; font-weight: 600;
  }
  .nd-error { margin-top: 8px; font-size: 12px; color: var(--red); text-align: center; }
  .nd-success { margin-top: 8px; font-size: 12px; color: var(--green); text-align: center; }
`;

export default function StudioBookingActions({
  bookingId,
  status,
}: {
  bookingId: number;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  function handleArrived() {
    setMessage(null);
    startTransition(async () => {
      const result = await markClientArrived(bookingId);
      if ('error' in result) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Klient dorazil — booking probiha.' });
        router.refresh();
      }
    });
  }

  function handleCompleted() {
    setMessage(null);
    startTransition(async () => {
      const result = await markBookingCompleted(bookingId);
      if ('error' in result) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Booking dokoncen.' });
        router.refresh();
      }
    });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="nd-actions">
        {status === 'confirmed' && (
          <button
            className="nd-btn nd-btn-primary"
            onClick={handleArrived}
            disabled={pending}
          >
            {pending ? 'Zpracovavam...' : '\u2713 Klient dorazil'}
          </button>
        )}
        {status === 'in_progress' && (
          <button
            className="nd-btn nd-btn-complete"
            onClick={handleCompleted}
            disabled={pending}
          >
            {pending ? 'Zpracovavam...' : '\u2713 Booking dokoncen'}
          </button>
        )}
        <a
          href="https://t.me/lovelygirls_studio_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="nd-btn nd-btn-secondary"
          style={{ textDecoration: 'none', textAlign: 'center' }}
        >
          &#9888; Problem — kontaktovat operatorku
        </a>
      </div>
      {message && (
        <div className={message.type === 'error' ? 'nd-error' : 'nd-success'}>
          {message.text}
        </div>
      )}
    </>
  );
}
