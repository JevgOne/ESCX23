import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

interface HashtagCloudProps {
  locale: string;
}

type LabelMap = Record<string, string>;
const TAG_LABELS: Record<string, LabelMap> = {
  cs: {
    'blondynky-praha': 'Blondýnky', 'brunetky-praha': 'Brunetky', 'gfe-praha': 'GFE',
    'mlade-do-22-praha': 'Mladé do 22', 'natural-praha': 'Přírodní prsa',
    'bisexualni-praha': 'Bisexuální', 'velka-prsa-praha': 'Velká prsa', 'studentky-praha': 'Studentky',
    'milf-praha': 'MILF', 'tetovane-praha': 'Tetované', 'duo-praha': 'Duo',
    'masaze-praha': 'Masáže', 'zrzky-praha': 'Zrzky',
  },
  en: {
    'blondynky-praha': 'Blondes', 'brunetky-praha': 'Brunettes', 'gfe-praha': 'GFE',
    'mlade-do-22-praha': 'Under 22', 'natural-praha': 'Natural breasts',
    'bisexualni-praha': 'Bisexual', 'velka-prsa-praha': 'Big breasts', 'studentky-praha': 'Students',
    'milf-praha': 'MILF', 'tetovane-praha': 'Tattooed', 'duo-praha': 'Duo',
    'masaze-praha': 'Massage', 'zrzky-praha': 'Redheads',
  },
  de: {
    'blondynky-praha': 'Blondinen', 'brunetky-praha': 'Brünette', 'gfe-praha': 'GFE',
    'mlade-do-22-praha': 'Unter 22', 'natural-praha': 'Natürlicher Busen',
    'bisexualni-praha': 'Bisexuell', 'velka-prsa-praha': 'Großer Busen', 'studentky-praha': 'Studentinnen',
    'milf-praha': 'MILF', 'tetovane-praha': 'Tätowiert', 'duo-praha': 'Duo',
    'masaze-praha': 'Massagen', 'zrzky-praha': 'Rothaarige',
  },
  uk: {
    'blondynky-praha': 'Блондинки', 'brunetky-praha': 'Брюнетки', 'gfe-praha': 'GFE',
    'mlade-do-22-praha': 'До 22 років', 'natural-praha': 'Натуральний бюст',
    'bisexualni-praha': 'Бісексуальні', 'velka-prsa-praha': 'Великий бюст', 'studentky-praha': 'Студентки',
    'milf-praha': 'MILF', 'tetovane-praha': 'Татуйовані', 'duo-praha': 'Duo',
    'masaze-praha': 'Масаж', 'zrzky-praha': 'Руді',
  },
};

const TAG_GROUPS = [
  { tier: 'top', slugs: ['blondynky-praha', 'brunetky-praha', 'gfe-praha'] },
  { tier: 'mid', slugs: ['mlade-do-22-praha', 'natural-praha', 'bisexualni-praha', 'velka-prsa-praha', 'studentky-praha'] },
  { tier: 'small', slugs: ['milf-praha', 'tetovane-praha', 'duo-praha', 'masaze-praha', 'zrzky-praha'] },
];

export default async function HashtagCloud({ locale }: HashtagCloudProps) {
  const t = await getTranslations({ locale, namespace: 'homepage.hashtags' });
  const labels = TAG_LABELS[locale] ?? TAG_LABELS.en;

  return (
    <section className="section hashtag-section">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">— {t('eyebrow')}</div>
          <h2 className="section-h2">{t('h2')}</h2>
          <p className="section-sub">{t('sub')}</p>
        </div>
        <div className="hashtag-cloud-tiered">
          {TAG_GROUPS.map((group) => (
            <div key={group.tier} className="hashtag-row">
              {group.slugs.map((slug) => (
                <Link
                  key={slug}
                  href={{ pathname: '/divky', query: { tag: slug } }}
                  className={`hashtag-pill-${group.tier}`}
                >
                  #{labels[slug] ?? slug}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
