'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { photoUrl } from '@/lib/photoUrl';

interface PhotoLightboxProps {
  photos: { url: string; id: number | string }[];
  girlName: string;
}

export default function PhotoLightbox({ photos, girlName }: PhotoLightboxProps) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('lightbox-active');
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      document.documentElement.classList.remove('lightbox-active');
      window.removeEventListener('keydown', handler);
    };
  }, [open, close, prev, next]);

  const openAt = useCallback((i: number) => {
    setIdx(i);
    setOpen(true);
  }, []);

  if (photos.length === 0) return null;

  const overlay = open && mounted ? createPortal(
    <div
      className="lightbox-overlay"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <button className="lightbox-close" onClick={close} aria-label="Zavřít">
        &times;
      </button>

      {photos.length > 1 && (
        <button
          className="lightbox-nav lightbox-prev"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Předchozí"
        >
          &#8249;
        </button>
      )}

      <img
        src={photoUrl(photos[idx]?.url ?? null)}
        alt={`${girlName} — ${idx + 1} / ${photos.length}`}
        className="lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />

      {photos.length > 1 && (
        <button
          className="lightbox-nav lightbox-next"
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Další"
        >
          &#8250;
        </button>
      )}

      <div className="lightbox-counter">
        {idx + 1} / {photos.length}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <div className="lightbox-gallery">
        {photos.map((photo, i) => (
          <button
            key={String(photo.id)}
            className="lightbox-thumb"
            onClick={() => openAt(i)}
            type="button"
          >
            <img
              src={photoUrl(photo.url || null)}
              alt={`${girlName} — ${i + 1}`}
              loading="lazy"
            />
          </button>
        ))}
      </div>
      {overlay}
    </>
  );
}
