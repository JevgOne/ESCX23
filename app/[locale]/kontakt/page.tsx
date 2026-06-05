import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const revalidate = 86400;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'kontakt' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  return applyDBOverride(`/${locale}/kontakt`, {
    title: t('h1'),
    description: t('lead'),
  });

}

export default async function KontaktPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'kontakt' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const PHONE = '+420734332131';
  const PHONE_DISPLAY = '+420 734 332 131';
  const waUrl = `https://wa.me/${PHONE.replace(/\s+/g, '').replace(/^\+/, '')}`;
  const tgUrl = `https://t.me/${PHONE.replace(/\s+/g, '')}`;
  const telUrl = `tel:${PHONE}`;

  return (
    <main>
      <Breadcrumbs items={[{ label: tNav('contact') }]} locale={locale} />
      <div className="container">
        <div className="static-page">
          <div className="static-page-eyebrow">{t('eyebrow')}</div>
          <h1 className="static-page-h1">{t('h1')}</h1>
          <p className="static-page-lead">{t('lead')}</p>

          <div className="kontakt-grid">
            <a href={waUrl} className="kontakt-card" target="_blank" rel="noopener noreferrer">
              <div className="kontakt-card-icon whatsapp">💬</div>
              <div className="kontakt-card-label">{t('whatsapp_label')}</div>
              <div className="kontakt-card-value">{t('whatsapp_value')}</div>
              <div className="kontakt-card-desc">{t('whatsapp_desc')}</div>
            </a>

            <a href={tgUrl} className="kontakt-card" target="_blank" rel="noopener noreferrer">
              <div className="kontakt-card-icon telegram">✈️</div>
              <div className="kontakt-card-label">{t('telegram_label')}</div>
              <div className="kontakt-card-value">{t('telegram_value')}</div>
              <div className="kontakt-card-desc">{t('telegram_desc')}</div>
            </a>

            <a href={telUrl} className="kontakt-card">
              <div className="kontakt-card-icon phone">📞</div>
              <div className="kontakt-card-label">{t('phone_label')}</div>
              <div className="kontakt-card-value">{t('phone_value')}</div>
              <div className="kontakt-card-desc">{t('phone_desc')}</div>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
