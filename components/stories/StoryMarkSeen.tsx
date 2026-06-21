'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'lg_seen_stories';

export default function StoryMarkSeen({ storyId }: { storyId: number }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr: number[] = raw ? JSON.parse(raw) : [];
      if (!arr.includes(storyId)) {
        arr.push(storyId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-200)));
      }
    } catch {}
  }, [storyId]);

  return null;
}
