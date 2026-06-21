import { getPublicStoriesFiltered } from '@/lib/story-schedule';
import NextLink from 'next/link';
import StoriesScroll from './StoriesScroll';

interface Props {
  locale: string;
}

const STORIES_STYLES = `
.sr-section {
  padding: 8px 0 24px;
}
.sr-inner {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 24px;
  text-align: center;
}
.sr-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 18px;
}
.sr-h2 {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  margin: 0;
  letter-spacing: -0.01em;
}
.sr-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.45);
  letter-spacing: 0.06em;
}
.sr-scroll {
  display: flex;
  justify-content: center;
  gap: 18px;
  overflow-x: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 4px 0 8px;
}
.sr-scroll::-webkit-scrollbar { display: none; }
.sr-item {
  flex-shrink: 0;
  width: 88px;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.sr-ring {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, #f9a8b8 0%, #f27d8d 35%, #c84b8b 70%, #9a1d51 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.18s;
}
.sr-item:hover .sr-ring { transform: scale(1.05); }
.sr-ring-seen {
  background: linear-gradient(135deg, #555 0%, #3a3a3a 50%, #555 100%);
}
.sr-photo {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #1a1a1a;
  border: 2px solid #0a0a0a;
}
.sr-name {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255,255,255,0.78);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 88px;
}
.sr-video-badge {
  position: absolute;
  bottom: -2px; right: -2px;
  width: 20px; height: 20px;
  background: #1a1a1a;
  border-radius: 50%;
  border: 2px solid #0a0a0a;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px;
}
.sr-ring-wrap { position: relative; }
@media (max-width: 640px) {
  .sr-section { padding: 4px 0 20px; }
  .sr-inner { padding: 0 16px; }
  .sr-item { width: 72px; }
  .sr-ring { width: 64px; height: 64px; }
  .sr-name { font-size: 10px; max-width: 72px; }
}
`;

export default async function StoriesRow({ locale }: Props) {
  const stories = await getPublicStoriesFiltered();
  if (stories.length === 0) return null;

  const headingMap: Record<string, { title: string; sub: string }> = {
    cs: { title: 'Stories', sub: 'Aktuálně' },
    en: { title: 'Stories', sub: 'Live now' },
    de: { title: 'Stories', sub: 'Aktuell' },
    uk: { title: 'Stories', sub: 'Зараз' },
  };
  const L = headingMap[locale] ?? headingMap.en;

  return (
    <section className="sr-section">
      <style dangerouslySetInnerHTML={{ __html: STORIES_STYLES }} />
      <div className="sr-inner">
        <div className="sr-head">
          <h2 className="sr-h2">{L.title}</h2>
          <span className="sr-sub">{L.sub}</span>
        </div>
        <StoriesScroll>
          {stories.map((story) => (
            <NextLink
              key={story.id}
              href={`/${locale}/stories/${story.id}`}
              className="sr-item"
              role="listitem"
              aria-label={`Story ${story.girlName}`}
              data-story-id={story.id}
            >
              <div className="sr-ring-wrap">
                <div className="sr-ring">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={story.girlPhoto ?? story.mediaUrl}
                    alt={story.girlName}
                    className="sr-photo"
                    loading="lazy"
                  />
                </div>
                {story.mediaType === 'video' && (
                  <span className="sr-video-badge" aria-hidden="true">▶</span>
                )}
              </div>
              <span className="sr-name">{story.girlName}</span>
            </NextLink>
          ))}
        </StoriesScroll>
      </div>
    </section>
  );
}
