'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PhotoActionsProps {
  photoId: number;
  girlId: number;
  isPrimary: boolean;
  isSecondary: boolean;
  locale: string;
}

export default function PhotoActions({ photoId, girlId, isPrimary, isSecondary, locale }: PhotoActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(action: string) {
    if (action === 'delete' && !confirm('Opravdu smazat tuto fotku?')) return;
    setLoading(action);
    try {
      const res = await fetch('/api/admin/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, photoId, girlId, locale }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Chyba');
      }
      router.refresh();
    } catch (e) {
      alert('Chyba: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="photo-actions-bar">
      {!isPrimary && (
        <button
          onClick={() => handleAction('setPrimary')}
          disabled={loading !== null}
          className="admin-btn-sm"
          title="Nastavit jako hlavní (zepředu)"
        >
          {loading === 'setPrimary' ? '…' : '① Hlavní'}
        </button>
      )}
      {!isSecondary && (
        <button
          onClick={() => handleAction('setSecondary')}
          disabled={loading !== null}
          className="admin-btn-sm"
          title="Nastavit jako druhou (zezadu)"
        >
          {loading === 'setSecondary' ? '…' : '② Druhá'}
        </button>
      )}
      <button
        onClick={() => handleAction('delete')}
        disabled={loading !== null}
        className="admin-btn-sm admin-btn-danger"
        title="Smazat fotku"
      >
        {loading === 'delete' ? '…' : 'Smazat'}
      </button>
    </div>
  );
}
