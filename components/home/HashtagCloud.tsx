import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

interface HashtagCloudProps {
  locale: string;
}

type LabelMap = Record<string, string>;
const TAG_LABELS: Record<string, LabelMap> = {
  cs: {
    'spolecnice-praha': 'Společnice Praha', 'blondynky-praha': 'Blondýnky', 'brunetky-praha': 'Brunetky',
    'gfe-praha': 'GFE', 'studentky-praha': 'Studentky', 'cernovlasky-praha': 'Černovlásky',
    'prirodni-poprsi': 'Přírodní poprsí', 'tetovani': 'Tetované', 'piercing-holky': 'Piercing',
    'fit-holky': 'Fit', 'elegantni-holky': 'Elegantní', 'luxusni-sluzby': 'Luxus',
    'ceske-holky': 'České',
  },
  en: {
    'spolecnice-praha': 'Prague companions', 'blondynky-praha': 'Blondes', 'brunetky-praha': 'Brunettes',
    'gfe-praha': 'GFE', 'studentky-praha': 'Students', 'cernovlasky-praha': 'Dark hair',
    'prirodni-poprsi': 'Natural', 'tetovani': 'Tattooed', 'piercing-holky': 'Piercing',
    'fit-holky': 'Fit', 'elegantni-holky': 'Elegant', 'luxusni-sluzby': 'Luxury',
    'ceske-holky': 'Czech',
  },
  de: {
    'spolecnice-praha': 'Begleiterinnen Prag', 'blondynky-praha': 'Blondinen', 'brunetky-praha': 'Brünette',
    'gfe-praha': 'GFE', 'studentky-praha': 'Studentinnen', 'cernovlasky-praha': 'Schwarzhaarig',
    'prirodni-poprsi': 'Natürlich', 'tetovani': 'Tätowiert', 'piercing-holky': 'Piercing',
    'fit-holky': 'Fit', 'elegantni-holky': 'Elegant', 'luxusni-sluzby': 'Luxus',
    'ceske-holky': 'Tschechisch',
  },
  uk: {
    'spolecnice-praha': 'Супутниці Прага', 'blondynky-praha': 'Блондинки', 'brunetky-praha': 'Брюнетки',
    'gfe-praha': 'GFE', 'studentky-praha': 'Студентки', 'cernovlasky-praha': 'Темне волосся',
    'prirodni-poprsi': 'Натуральний', 'tetovani': 'Татуйовані', 'piercing-holky': 'Пірсинг',
    'fit-holky': 'Підтягнуті', 'elegantni-holky': 'Елегантні', 'luxusni-sluzby': 'Люкс',
    'ceske-holky': 'Чеські',
  },
};

const TAG_GROUPS = [
  { tier: 'top', slugs: ['spolecnice-praha', 'blondynky-praha', 'brunetky-praha', 'gfe-praha'] },
  { tier: 'mid', slugs: ['studentky-praha', 'cernovlasky-praha', 'prirodni-poprsi', 'fit-holky', 'elegantni-holky'] },
  { tier: 'small', slugs: ['tetovani', 'piercing-holky', 'luxusni-sluzby', 'ceske-holky'] },
];

export default async function HashtagCloud({ locale }: HashtagCloudProps) {
  const t = await getTranslations({ locale, namespace: 'homepage.hashtags' });
  const labels = TAG_LABELS[locale] ?? TAG_LABELS.en;

  return (
    <section className="section hashtag-section">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">{t('eyebrow')}</div>
          <h2 className="section-h2">{t('h2')}</h2>
          <p className="section-sub">{t('sub')}</p>
        </div>
        <div className="hashtag-cloud-tiered">
          {TAG_GROUPS.map((group) => (
            <div key={group.tier} className="hashtag-row">
              {group.slugs.map((slug) => (
                <a
                  key={slug}
                  href={`${locale === 'en' ? '' : '/' + locale}/hashtag/${slug}`}
                  className={`hashtag-pill-${group.tier}`}
                >
                  #{labels[slug] ?? slug}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
