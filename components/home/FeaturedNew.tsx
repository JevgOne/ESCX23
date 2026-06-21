import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getNewGirl } from '@/lib/queries';
import { photoUrl } from '@/lib/photoUrl';

interface FeaturedNewProps {
  locale: string;
}

const META: Record<string, { yo: string; bust: string }> = {
  cs: { yo: 'let', bust: 'Prsa' },
  en: { yo: 'y/o', bust: 'Bust' },
  de: { yo: 'Jahre', bust: 'Brust' },
  uk: { yo: 'років', bust: 'Бюст' },
};

export default async function FeaturedNew({ locale }: FeaturedNewProps) {
  const t = await getTranslations({ locale, namespace: 'homepage.featuredNew' });
  const girl = await getNewGirl();
  const M = META[locale] ?? META.en;

  if (!girl) return null;

  return (
    <div className="featured-new">
      <Link
        href={{ pathname: '/profil/[slug]', params: { slug: girl.slug } }}
        className="featured-card"
      >
        <div className="featured-photo-wrap">
          <img
            src={photoUrl(girl.primaryPhoto)}
            className="featured-photo"
            alt={girl.name}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            sizes="(max-width: 768px) 50vw, 280px"
          />
          <span className="featured-new-badge">{t('badge')}</span>
        </div>
        <div className="featured-info">
          <div className="featured-name">{girl.name}</div>
          <div className="featured-meta">
            {girl.age} {M.yo}
            {girl.height ? <><span className="sep">•</span>{girl.height} cm</> : null}
            {girl.weight ? <><span className="sep">•</span>{girl.weight} kg</> : null}
            {girl.bust ? <><span className="sep">•</span>{M.bust} {girl.bust}</> : null}
          </div>
          <div className="featured-desc">{t('sub')}</div>
          <span className="featured-link">{t('link_text')} →</span>
        </div>
      </Link>
    </div>
  );
}
