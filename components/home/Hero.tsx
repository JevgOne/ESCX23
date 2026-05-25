import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getHomepageStats } from '@/lib/queries';

interface HeroProps {
  locale: string;
}

export default async function Hero({ locale }: HeroProps) {
  const t = await getTranslations({ locale, namespace: 'homepage.hero' });
  const stats = await getHomepageStats();

  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-eyebrow">
          <span className="dot" />
          {t('eyebrow')}
        </div>
        <h1 className="hero-h1">
          {t('h1_main')}<br />
          <span className="accent">{t('h1_accent')}</span>
        </h1>
        <p className="hero-sub">{t('subtitle')}</p>
        <div className="hero-cta-row">
          <Link href="/divky" className="btn btn-pink btn-xl">{t('cta_browse')} →</Link>
          <Link href="/rozvrh" className="btn btn-ghost btn-xl">{t('cta_today')} →</Link>
        </div>
        <div className="hero-stats">
          <div className="hero-stat-item">
            <span className="num">{stats.totalLive}</span>
            {t('stats_girls')}
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <span className="num">{stats.workingNow}</span>
            {t('stats_now')}
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <span className="num">★ {stats.avgRating}</span>
            {' '}{stats.totalReviews}{' '}{t('stats_reviews')}
          </div>
        </div>
      </div>
    </section>
  );
}
