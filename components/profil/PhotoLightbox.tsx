'use client';

import { useState, useCallback, useEffect } from 'react';
import { photoUrl } from '@/lib/photoUrl';

interface PhotoLightboxProps {
  photos: { url: string; id: number | string }[];
  girlName: string;
}

export default function PhotoLightbox({ photos, girlName }: PhotoLightboxProps) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const close = useCallback(() => setOpen(false), []);
  const prev = useCallback(() => setIdx((i) => (i > 0 ? i - 1 : photos.length - 1)), [photos.length]);
  const next = useCallback(() => setIdx((i) => (i < photos.length - 1 ? i + 1 : 0)), [photos.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, close, prev, next]);

  if (photos.length === 0) return null;

  return (
    <>
      {/* Thumbnail triggers — rendered as invisible overlay on each gallery tile */}
      <div className="lightbox-triggers" data-count={photos.length}>
        {photos.map((photo, i) => (
          <button
            key={String(photo.id)}
            className="lightbox-trigger"
            onClick={() => { setIdx(i); setOpen(true); }}
            aria-label={`${girlName} foto ${i + 1}`}
          />
        ))}
      </div>

      {/* Lightbox overlay */}
      {open && (
        <div className="lightbox-overlay" onClick={close}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={close} aria-label="Zavřít">
              &times;
            </button>

            <button className="lightbox-nav lightbox-prev" onClick={prev} aria-label="Předchozí">
              &#8249;
            </button>

            <img
              src={photoUrl(photos[idx]?.url ?? null)}
              alt={`${girlName} — ${idx + 1} / ${photos.length}`}
              className="lightbox-img"
            />

            <button className="lightbox-nav lightbox-next" onClick={next} aria-label="Další">
              &#8250;
            </button>

            <div className="lightbox-counter">
              {idx + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
