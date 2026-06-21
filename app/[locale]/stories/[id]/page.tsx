import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import NextLink from 'next/link';
import { getStoryById, getAllPublicStories } from '@/lib/queries';
import { incrementStoryViews } from '@/lib/admin-actions';
import { photoUrl } from '@/lib/photoUrl';
import StoryAutoAdvance from '@/components/stories/StoryAutoAdvance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

function timeAgoLocalized(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const labels: Record<string, { now: string; min: string; mins: string; hour: string; hours: string; day: string; days: string }> = {
    cs: { now: 'Nyni', min: 'min', mins: 'min', hour: 'hod', hours: 'hod', day: 'den', days: 'dny' },
    en: { now: 'Now', min: 'min', mins: 'mins', hour: 'hour', hours: 'hours', day: 'day', days: 'days' },
    de: { now: 'Jetzt', min: 'Min', mins: 'Min', hour: 'Std', hours: 'Std', day: 'Tag', days: 'Tage' },
    uk: { now: 'Zara', min: 'khv', mins: 'khv', hour: 'hod', hours: 'hod', day: 'den', days: 'dni' },
  };
  const L = labels[locale] ?? labels.en;

  if (diffMin < 1) return L.now;
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? L.min : L.mins}`;
  if (diffH < 24) return `${diffH} ${diffH === 1 ? L.hour : L.hours}`;
  return `${diffDays} ${diffDays === 1 ? L.day : L.days}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const story = await getStoryById(Number(id));
  if (!story) return { title: 'Story' };
  return {
    title: `Story — ${story.girlName}`,
    robots: { index: false, follow: false },
  };
}

export default async function StoryViewerPage({ params }: Props) {
  const { locale, id: rawId } = await params;
  setRequestLocale(locale);

  const storyId = Number(rawId);
  if (!storyId || isNaN(storyId)) {
    redirect(`/${locale}`);
  }

  const story = await getStoryById(storyId);
  if (!story) {
    redirect(`/${locale}`);
  }

  // Increment view count (fire-and-forget, no await needed for UX)
  incrementStoryViews(storyId).catch(() => {});

  // Get all stories for prev/next navigation
  const allStories = await getAllPublicStories();
  const currentIndex = allStories.findIndex((s) => s.id === storyId);
  const prevStory = currentIndex > 0 ? allStories[currentIndex - 1] : null;
  const nextStory = currentIndex < allStories.length - 1 ? allStories[currentIndex + 1] : null;

  const closeHref = `/${locale}`;
  const profileHref = story.girlSlug ? `/${locale}/profil/${story.girlSlug}` : closeHref;
  const prevHref = prevStory ? `/${locale}/stories/${prevStory.id}` : null;
  const nextHref = nextStory ? `/${locale}/stories/${nextStory.id}` : null;
  const timeAgo = timeAgoLocalized(story.createdAt, locale);

  return (
    <div className="story-viewer">
      {/* Close button */}
      <NextLink href={closeHref} className="story-close" aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </NextLink>

      {/* Progress bar (visual only for no-JS; auto-advance for JS) */}
      <div className="story-progress-bar">
        <div className="story-progress-track">
          {story.mediaType === 'image' && (
            <div className="story-progress-fill" />
          )}
        </div>
      </div>

      {/* Header: avatar + name + time */}
      <div className="story-header">
        <NextLink href={profileHref} className="story-header-link">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl(story.girlPhoto)}
            alt={story.girlName}
            className="story-avatar"
            width={36}
            height={36}
          />
          <span className="story-header-name">{story.girlName}</span>
        </NextLink>
        <span className="story-header-time">{timeAgo}</span>
      </div>

      {/* Media container */}
      <div className="story-media-wrap">
        {story.mediaType === 'video' ? (
          <video
            className="story-media story-video"
            src={story.mediaUrl}
            controls
            autoPlay
            playsInline
            preload="metadata"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={story.mediaUrl}
            alt={`Story by ${story.girlName}`}
            className="story-media"
          />
        )}
      </div>

      {/* Navigation zones (no-JS friendly as links) */}
      <div className="story-nav">
        {prevHref ? (
          <NextLink href={prevHref} className="story-nav-zone story-nav-prev" aria-label="Previous story">
            <svg className="story-nav-arrow" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </NextLink>
        ) : (
          <div className="story-nav-zone story-nav-prev story-nav-disabled" />
        )}
        {nextHref ? (
          <NextLink href={nextHref} className="story-nav-zone story-nav-next" aria-label="Next story">
            <svg className="story-nav-arrow" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </NextLink>
        ) : (
          <NextLink href={closeHref} className="story-nav-zone story-nav-next" aria-label="Close">
            <svg className="story-nav-arrow" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </NextLink>
        )}
      </div>

      {/* Client component for auto-advance (image stories only) */}
      {story.mediaType === 'image' && nextHref && (
        <StoryAutoAdvance nextUrl={nextHref} durationMs={5000} />
      )}
    </div>
  );
}
