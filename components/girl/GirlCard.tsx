import { Link } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import { photoUrl } from '@/lib/photoUrl';
import { translateLocation } from '@/lib/utils';
import type { GirlCard as GirlCardType } from '@/lib/queries';

const FLAG_MAP: Record<string, string> = {
  cs: '🇨🇿', en: '🇬🇧', de: '🇩🇪', uk: '🇺🇦', fr: '🇫🇷',
  it: '🇮🇹', es: '🇪🇸', ru: '🇷🇺', pl: '🇵🇱', sk: '🇸🇰',
};

const CITY: Record<string, string> = { en: 'Prague', de: 'Prag', uk: 'Прага', cs: 'Praha' };
const PAUSED_LABEL: Record<string, string> = { cs: 'Dočasně nedostupná', en: 'Temporarily unavailable', de: 'Vorübergehend nicht verfügbar', uk: 'Тимчасово недоступна' };
const LATER_LABEL: Record<string, string> = { cs: 'Později', en: 'Later', de: 'Später', uk: 'Пізніше' };
const TMRW_LABEL: Record<string, string> = { cs: 'Zítra', en: 'Tmrw', de: 'Morgen', uk: 'Завтра' };
const TODAY_LABEL: Record<string, string> = { cs: 'Dnes', en: 'Today', de: 'Heute', uk: 'Сьогодні' };
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

const BADGE_CONFIG: Record<string, { label: Record<string, string>; css: string }> = {
  top: {
    label: { cs: 'TOP', en: 'TOP', de: 'TOP', uk: 'TOP' },
    css: 'top',
  },
  top_reviews: {
    label: { cs: 'TOP HODNOCENÍ', en: 'TOP REVIEWS', de: 'TOP BEWERTUNG', uk: 'ТОП ВІДГУКИ' },
    css: 'top-reviews',
  },
  recommended: {
    label: { cs: 'DOPORUČUJEME', en: 'RECOMMENDED', de: 'EMPFOHLEN', uk: 'РЕКОМЕНДУЄМО' },
    css: 'recommended',
  },
  hot: {
    label: { cs: 'HOT', en: 'HOT', de: 'HOT', uk: 'HOT' },
    css: 'hot',
  },
  asian: {
    label: { cs: 'ASIATKA', en: 'ASIAN', de: 'ASIATIN', uk: 'АЗІАТКА' },
    css: 'asian',
  },
  ebony: {
    label: { cs: 'EBONY', en: 'EBONY', de: 'EBONY', uk: 'EBONY' },
    css: 'ebony',
  },
  mulatto: {
    label: { cs: 'MULATKA', en: 'MIXED', de: 'MULATTIN', uk: 'МУЛАТКА' },
    css: 'mulatto',
  },
  latina: {
    label: { cs: 'LATINA', en: 'LATINA', de: 'LATINA', uk: 'ЛАТИНА' },
    css: 'latina',
  },
};

interface GirlCardProps {
  girl: GirlCardType;
  priority?: boolean;
}

export default async function GirlCard({ girl, priority }: GirlCardProps) {
  const locale = await getLocale();
  const city = CITY[locale] ?? 'Prague';
  const laterLabel = LATER_LABEL[locale] ?? LATER_LABEL.en;
  const todayLabel = TODAY_LABEL[locale] ?? TODAY_LABEL.en;
  const labels = STAT_LABELS[locale] ?? STAT_LABELS.en;
  const altNoun = ALT_NOUN[locale] ?? ALT_NOUN.en;
  const altText = `${girl.name}, ${girl.age}, ${city} ${altNoun}`;
  const isAway = girl.status === 'later';

  return (
    <Link
      href={{ pathname: '/profil/[slug]', params: { slug: girl.slug } }}
      className={`girl-card${girl.isPaused ? ' girl-card-paused' : ''}`}
      data-status={isAway ? 'away' : 'available'}
    >
      <div className="girl-photo-wrap">
        <img className="girl-photo girl-photo-front" src={photoUrl(girl.primaryPhoto)} alt={altText} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 280px" />
        {girl.secondaryPhoto && (
          <img className="girl-photo girl-photo-back" src={photoUrl(girl.secondaryPhoto)} alt="" loading="lazy" aria-hidden="true" />
        )}

        {girl.isVip ? (
          <span className="girl-tag-pill vip">★ VIP</span>
        ) : girl.badgeType && BADGE_CONFIG[girl.badgeType] ? (
          <span className={`girl-tag-pill ${BADGE_CONFIG[girl.badgeType].css}`}>
            {BADGE_CONFIG[girl.badgeType].label[locale] ?? BADGE_CONFIG[girl.badgeType].label.en}
          </span>
        ) : girl.isNew ? (
          <span className="girl-tag-pill new">{NEW_LABEL[locale] ?? NEW_LABEL.en}</span>
        ) : girl.ethnicity && BADGE_CONFIG[girl.ethnicity] ? (
          <span className={`girl-tag-pill ${BADGE_CONFIG[girl.ethnicity].css}`}>
            {BADGE_CONFIG[girl.ethnicity].label[locale] ?? BADGE_CONFIG[girl.ethnicity].label.en}
          </span>
        ) : null}
        {girl.isPaused && (
          <span className="girl-paused-badge">{PAUSED_LABEL[locale] ?? PAUSED_LABEL.en}</span>
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
            {todayLabel} {girl.shiftFrom} — {girl.shiftTo}
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
            {(girl.shiftCategory === 'night' || girl.shiftCategory === 'allevening') && girl.status === 'working' ? (
              <span className="girl-online-moon" aria-label="Night shift">&#127769;</span>
            ) : (
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
            )}
            <span className="girl-name">{girl.name}</span>
          </div>
        </div>

        <div className="girl-loc-row">
          {girl.location ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{translateLocation(girl.location, locale)}</span>
            </>
          ) : (
            <span>&nbsp;</span>
          )}
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
