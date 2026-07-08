import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getCanonicalUrl, getAlternates } from '@/lib/seo/meta';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    robots: { index: false, follow: false },
    alternates: {
      canonical: getCanonicalUrl(locale, '/join/success'),
      languages: getAlternates('/join/success'),
    },
  };
}

export default async function JoinSuccessPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'join' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  return (
    <main>
      <div className="container" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div className="success-icon" style={{ fontSize: '64px', marginBottom: '24px' }}>✓</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', marginBottom: '16px' }}>
          {t('success.title')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', fontSize: '16px' }}>
          {t('success.body')}
        </p>
        <Link href="/" className="btn btn-pink">
          {tCommon('back_home')}
        </Link>
      </div>
    </main>
  );
}
