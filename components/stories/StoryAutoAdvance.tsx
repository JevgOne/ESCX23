'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  nextUrl: string;
  durationMs: number;
}

/**
 * Client component that auto-advances to the next story after `durationMs`.
 * Also animates the progress bar fill via CSS custom property.
 * This is the ONLY 'use client' in the story viewer — keeps the rest server-rendered.
 */
export default function StoryAutoAdvance({ nextUrl, durationMs }: Props) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Animate the progress bar
    const fill = document.querySelector('.story-progress-fill') as HTMLElement | null;
    if (fill) {
      fill.style.transition = `width ${durationMs}ms linear`;
      // Force reflow to ensure transition plays from 0
      void fill.offsetWidth;
      fill.style.width = '100%';
    }

    timerRef.current = setTimeout(() => {
      router.push(nextUrl);
    }, durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [nextUrl, durationMs, router]);

  return null;
}
