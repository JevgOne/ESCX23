import { Link } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import { photoUrl } from '@/lib/photoUrl';
import { prettyDistrict } from '@/lib/utils';
import type { GirlCard as GirlCardType } from '@/lib/queries';

const FLAG_MAP: Record<string, string> = {
  cs: '🇨🇿', en: '🇬🇧', de: '🇩🇪', uk: '🇺🇦', fr: '🇫🇷',
  it: '🇮🇹', es: '🇪🇸', ru: '🇷🇺', pl: '🇵🇱', sk: '🇸🇰',
};

const CITY: Record<string, string> = { en: 'Prague', de: 'Prag', uk: 'Прага', cs: 'Praha' };
const LATER_LABEL: Record<string, string> = { cs: 'Později', en: 'Later', de: 'Später', uk: 'Пізніше' };
const STAT_LABELS: Record<string, { height: string; breasts: string; weight: string; age: string }> = {
  cs: { height: 'Výška', breasts: 'Prsa', weight: 'Váha', age: 'Věk' },
  en: { height: 'Height', breasts: 'Breasts', weight: 'Weight', age: 'Age' },
  de: { height: 'Größe', breasts: 'Brust', weight: 'Gewicht', age: 'Alter' },
  uk: { height: 'Зріст', breasts: 'Груди', weight: 'Вага', age: 'Вік' },
};
const ALT_NOUN: Record<string, string> = {
  en: 'escort companion',
  cs: 'společnice',
  de: 'Escort-Begleiterin',
  uk: 'супутниця',
};
const NEW_LABEL: Record<string, string> = { cs: 'NOVÁ', en: 'NEW', de: 'NEU', uk: 'НОВА' };

interface GirlCardProps {
  girl: GirlCardType;
}

export default async function GirlCard({ girl }: GirlCardProps) {
  const locale = await getLocale();
  const city = CITY[locale] ?? 'Prague';
  const laterLabel = LATER_LABEL[locale] ?? LATER_LABEL.en;
  const labels = STAT_LABELS[locale] ?? STAT_LABELS.en;
  const altNoun = ALT_NOUN[locale] ?? ALT_NOUN.en;
  const altText = `${girl.name}, ${girl.age}, ${city} ${altNoun}`;
  const isAway = girl.status === 'later';
  const district = prettyDistrict(girl.location);
  const address = district ? `${district}, ${girl.location}` : girl.location;

  return (
    <Link
      href={{ pathname: '/profil/[slug]', params: { slug: girl.slug } }}
      className={`girl-card${girl.isPaused ? ' girl-card-paused' : ''}`}
      data-status={isAway ? 'away' : 'available'}
    >
      <div className="girl-photo-wrap">
        <img className="girl-photo girl-photo-front" src={photoUrl(girl.primaryPhoto)} alt={altText} loading="lazy" />
        {girl.secondaryPhoto && (
          <img className="girl-photo girl-photo-back" src={photoUrl(girl.secondaryPhoto)} alt="" loading="lazy" aria-hidden="true" />
        )}

        {girl.isVip && (
          <span className="girl-tag-pill vip">★ VIP</span>
        )}
        {!girl.isVip && girl.isNew && (
          <span className="girl-tag-pill new">{NEW_LABEL[locale] ?? NEW_LABEL.en}</span>
        )}

        <div className="girl-media-pills">
          {girl.videoCount > 0 && (
            <span className="girl-media-pill">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              {girl.videoCount}
            </span>
          )}
          <span className="girl-media-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {girl.photoCount}
          </span>
        </div>

        {girl.status === 'working' && girl.shiftFrom && girl.shiftTo && (
          <span className="girl-photo-time">
            <span className="girl-photo-dot" />
            {girl.shiftFrom} — {girl.shiftTo}
          </span>
        )}
        {girl.status === 'later' && girl.shiftFrom && (
          <span className="girl-photo-time girl-photo-time-later">
            <span className="girl-photo-dot" />
            {laterLabel} {girl.shiftFrom}
          </span>
        )}
      </div>

      <div className="girl-info">
        <div className="girl-name-row">
          <div className="girl-name-left">
            <span
              className={`girl-online-dot${
                girl.isPaused
                  ? ' girl-online-dot-paused'
                  : girl.status === 'working'
                    ? ' girl-online-dot-working'
                    : girl.status === 'later'
                      ? ' girl-online-dot-later'
                      : ' girl-online-dot-off'
              }`}
            />
            <span className="girl-name">{girl.name}</span>
          </div>
        </div>

        <div className="girl-loc-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{address}</span>
        </div>

        <div className="girl-statline">
          <div className="girl-stat-cell">
            <span className="label">{labels.height}:</span>
            <span className="num">{girl.height ?? '—'}</span>
          </div>
          <div className="girl-stat-cell">
            <span className="label">{labels.breasts}:</span>
            <span className="num">{girl.bust ?? '—'}</span>
          </div>
          <div className="girl-stat-cell">
            <span className="label">{labels.weight}:</span>
            <span className="num">{girl.weight ?? '—'}</span>
          </div>
          <div className="girl-stat-cell">
            <span className="label">{labels.age}:</span>
            <span className="num">{girl.age}</span>
          </div>
        </div>

        {(girl.languages.length > 0 || girl.rating > 0) && (
          <div className="girl-bottom-row">
            <div className="girl-langs">
              {girl.languages.map((lang) => (
                <span key={lang} title={lang}>
                  {FLAG_MAP[lang] ?? lang.toUpperCase()}
                </span>
              ))}
            </div>
            {girl.rating > 0 && (
              <div className="girl-rating">
                <span className="girl-rating-star">★</span>
                <span className="girl-rating-value">{girl.rating.toFixed(1)}</span>
                <span className="girl-rating-count">· {girl.reviewsCount}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
