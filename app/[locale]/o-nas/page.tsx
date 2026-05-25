import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const revalidate = 86400;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'onas' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  return {
    title: `${t('h1')} — ${tCommon('siteName')}`,
    description: t('lead'),
  };
}

export default async function ONasPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'onas' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <main>
      <Breadcrumbs items={[{ label: tNav('about') }]} locale={locale} />
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
