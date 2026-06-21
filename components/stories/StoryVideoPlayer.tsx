'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  src: string;
  nextUrl: string; // next story or close URL
}

/**
 * Client component that auto-plays a story video muted,
 * shows progress, and auto-advances when the video ends.
 */
export default function StoryVideoPlayer({ src, nextUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Update progress bar based on video time
    const onTimeUpdate = () => {
      if (!video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;
      const fill = document.querySelector('.story-progress-fill') as HTMLElement | null;
      if (fill) {
        fill.style.transition = 'none';
        fill.style.width = `${pct}%`;
      }
    };

    // Auto-advance when video ends
    const onEnded = () => {
      router.push(nextUrl);
    };

    // Force mute and play
    video.muted = true;
    video.volume = 0;
    video.play().catch(() => {
      // Autoplay blocked — user will need to tap
    });

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
  }, [src, nextUrl, router]);

  return (
    <video
      ref={videoRef}
      className="story-media story-video"
      src={src}
      autoPlay
      muted
      playsInline
      preload="auto"
    />
  );
}
