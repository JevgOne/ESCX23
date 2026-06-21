import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import NextLink from 'next/link';
import { getRecentActivity } from '@/lib/queries';
import { photoUrl } from '@/lib/photoUrl';
import { relativeTime } from '@/lib/utils';

interface ActivityFeedProps {
  locale: string;
}

export default async function ActivityFeed({ locale }: ActivityFeedProps) {
  const t = await getTranslations({ locale, namespace: 'homepage.activity' });
  const items = await getRecentActivity(6);

  return (
    <section className="section activity-feed">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">{t('eyebrow')}</div>
          <h2 className="section-h2">{t('h2')}</h2>
          <p className="section-sub">{t('sub')}</p>
        </div>

        {items.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('no_recent')}</p>
        ) : (
          <div className="activity-list">
            {items.map((item, i) => {
              if (item.kind === 'apartment_review') {
                return (
                  <NextLink key={i} href={`/${locale}/pobocka/${item.locationSlug ?? ''}`} className="activity-item">
                    <div className="activity-avatar activity-avatar-apt">🏠</div>
                    <div className="activity-icon">🏠</div>
                    <div className="activity-text">
                      {t('apartment_review', { location: item.locationName ?? '' })}
                    </div>
                    <div className="activity-time">{relativeTime(item.when)}</div>
                  </NextLink>
                );
              }
              return (
                <Link key={i} href={{ pathname: '/profil/[slug]', params: { slug: item.girlSlug } }} className="activity-item">
                  <img
                    src={photoUrl(item.girlPhoto)}
                    className="activity-avatar"
                    alt={item.girlName}
                    loading="lazy"
                  />
                  <div className="activity-icon">
                    {item.kind === 'photo' ? '📷' :
                     item.kind === 'video' ? '🎬' :
                     item.kind === 'profile_update' ? '✨' : '⭐'}
                  </div>
                  <div className="activity-text">
                    <strong>{item.girlName}</strong>{' '}
                    {item.kind === 'photo'
                      ? (item.photoCount === 1 ? t('added_photo') : t('added_photos', { count: item.photoCount ?? 1 }))
                      : item.kind === 'video'
                        ? ((item.videoCount ?? 1) === 1 ? t('added_video') : t('added_videos', { count: item.videoCount ?? 1 }))
                        : item.kind === 'profile_update'
                          ? t('updated_profile')
                          : t('received_review', { rating: item.rating ?? 5 })}
                  </div>
                  <div className="activity-time">{relativeTime(item.when)}</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
