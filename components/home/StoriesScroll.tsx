'use client';

import { useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'lg_seen_stories';

function getSeenIds(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as number[];
    return new Set(parsed);
  } catch { return new Set(); }
}

function markSeen(id: number) {
  try {
    const seen = getSeenIds();
    seen.add(id);
    // Keep last 200 to avoid localStorage bloat
    const arr = [...seen].slice(-200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

interface Props {
  children: React.ReactNode;
}

export default function StoriesScroll({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const seen = getSeenIds();
    // Mark already-seen stories
    el.querySelectorAll<HTMLAnchorElement>('[data-story-id]').forEach((link) => {
      const id = Number(link.dataset.storyId);
      if (seen.has(id)) {
        link.querySelector('.sr-ring')?.classList.add('sr-ring-seen');
      }
    });
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-story-id]');
    if (!link) return;
    const id = Number(link.dataset.storyId);
    if (id) markSeen(id);
  }, []);

  return (
    <div className="sr-scroll" role="list" ref={ref} onClick={handleClick}>
      {children}
    </div>
  );
}
