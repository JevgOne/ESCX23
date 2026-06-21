'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  src: string;
  nextUrl: string;
}

function guessVideoType(url: string): string {
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (ext === 'webm') return 'video/webm';
  if (ext === 'mov') return 'video/mp4'; // Chrome can play H.264 mov if served as mp4
  return 'video/mp4';
}

export default function StoryVideoPlayer({ src, nextUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (!video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;
      const fill = document.querySelector('.story-progress-fill') as HTMLElement | null;
      if (fill) {
        fill.style.transition = 'none';
        fill.style.width = `${pct}%`;
      }
    };

    const onEnded = () => {
      router.push(nextUrl);
    };

    const onError = () => {
      // Video can't play (unsupported codec) — skip to next
      router.push(nextUrl);
    };

    video.muted = true;
    video.volume = 0;
    video.play().catch(() => {});

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, [src, nextUrl, router]);

  const mimeType = guessVideoType(src);

  return (
    <video
      ref={videoRef}
      className="story-media story-video"
      autoPlay
      muted
      playsInline
      preload="auto"
      crossOrigin="anonymous"
    >
      <source src={src} type={mimeType} />
    </video>
  );
}
