import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import { getCanonicalUrl, getAlternates, ogLocale } from '@/lib/seo/meta';
import { buildOgImages } from '@/lib/seo/og';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const revalidate = 86400;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'soukromi' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const title = `${t('h1')} — ${tCommon('siteName')}`;
  const canonical = getCanonicalUrl(locale, '/soukromi');
  const ogImages = await buildOgImages('soukromi', locale, '/soukromi', title);

  return applyDBOverride(`/${locale}/soukromi`, {
    title,
    description: t('lead'),
    robots: { index: false, follow: false },
    alternates: {
      canonical,
      languages: getAlternates('/soukromi'),
    },
    openGraph: {
      images: ogImages,
      title,
      description: t('lead'),
      url: canonical,
      locale: ogLocale(locale),
    },
  });
}

export default async function SoukromiPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'soukromi' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <main>
      <Breadcrumbs items={[{ label: tNav('privacy') }]} locale={locale} />
      <div className="container">
        <div className="static-page">
          <div className="static-page-eyebrow">{t('eyebrow')}</div>
          <h1 className="static-page-h1">{t('h1')}</h1>
          <p className="static-page-lead">{t('lead')}</p>

          <div className="static-section">
            <h2 className="static-section-h2">{t('s1_h2')}</h2>
            <p className="static-section-text">{t('s1_text')}</p>
          </div>

          <div className="static-section">
            <h2 className="static-section-h2">{t('s2_h2')}</h2>
            <p className="static-section-text">{t('s2_text')}</p>
          </div>

          <div className="static-section">
            <h2 className="static-section-h2">{t('s3_h2')}</h2>
            <p className="static-section-text">{t('s3_text')}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
