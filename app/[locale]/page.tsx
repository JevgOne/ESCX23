import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import Hero from '@/components/home/Hero';
import StoriesRow from '@/components/home/StoriesRow';
import FeaturedNew from '@/components/home/FeaturedNew';
import GirlsGridSection from '@/components/home/GirlsGridSection';
import ActivityFeed from '@/components/home/ActivityFeed';
import TrustRow from '@/components/home/TrustRow';
import ReviewsStrip from '@/components/home/ReviewsStrip';
import HashtagCloud from '@/components/home/HashtagCloud';
import LocationsRow from '@/components/home/LocationsRow';
import ContactSteps from '@/components/home/ContactSteps';
import FinalCta from '@/components/home/FinalCta';
import QuickLinks from '@/components/home/QuickLinks';
import {
  homepageLocalBusiness,
  organizationJsonLd,
  websiteJsonLd,
} from '@/lib/seo/jsonld';
import { getCanonicalUrl, getAlternates, ogLocale } from '@/lib/seo/meta';
import { getHomepageStats } from '@/lib/queries';
import { getSiteFacts } from '@/lib/site-facts';
import { verifiedCompanions } from '@/lib/plural';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TITLES: Record<string, string> = {
  cs: 'Escort Praha — Ověřené společnice v privátním apartmánu | LovelyGirls',
  en: 'Escort Prague — Verified Companions in Private Apartments | LovelyGirls',
  de: 'Escort Prag — Verifizierte Begleiterinnen in privaten Apartments | LovelyGirls',
  uk: 'Ескорт Прага — Перевірені супутниці у приватних апартаментах | LovelyGirls',
};

const describe = (n: number): Record<string, string> => ({
  cs: `${n} ${verifiedCompanions(n, 'cs')} v Praze. Diskrétní apartmány v centru, transparentní ceník od 2 000 Kč, otevřeno denně 10–22:30. Rychlý kontakt přes WhatsApp.`,
  en: `${n} ${verifiedCompanions(n, 'en')} in Prague. Discreet central apartments, transparent pricing from 2,000 CZK, open daily 10–22:30. Instant WhatsApp booking.`,
  de: `${n} ${verifiedCompanions(n, 'de')} in Prag. Diskrete Apartments im Zentrum, transparente Preise ab 2.000 CZK, täglich 10–22:30. WhatsApp-Buchung.`,
  uk: `${n} ${verifiedCompanions(n, 'uk')} у Празі. Дискретні апартаменти в центрі, прозорі ціни від 2 000 CZK, щодня 10–22:30. Бронювання через WhatsApp.`,
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = getCanonicalUrl(locale, '/');
  const languages = getAlternates('/');
  const { getCustomOgImage } = await import('@/lib/seo/og');
  const customOg = await getCustomOgImage('home');
  const { companionsCount } = await getSiteFacts();
  const DESCRIPTIONS = describe(companionsCount);

  return applyDBOverride(`/${locale}`, {
    title: TITLES[locale] ?? TITLES.en,
    description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.en,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: TITLES[locale] ?? TITLES.en,
      description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.en,
      url: canonical,
      locale: ogLocale(locale),
      ...(customOg ? { images: [{ url: customOg, width: 1200, height: 630, alt: TITLES[locale] ?? TITLES.en }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLES[locale] ?? TITLES.en,
      description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.en,
      ...(customOg ? { images: [customOg] } : {}),
    },
  });

}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'geo' });
  const { companionsCount } = await getSiteFacts();
  const stats = await getHomepageStats().catch(() => ({
    totalLive: 0,
    workingNow: 0,
    totalReviews: 0,
    avgRating: 0,
  }));
  const localBusinessSchema = homepageLocalBusiness(locale, {
    avg: stats.avgRating,
    count: stats.totalReviews,
  });
  const orgSchema = organizationJsonLd();
  const websiteSchema = websiteJsonLd(locale);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <p data-geo-lead className="sr-only">{t('home_lead', { count: companionsCount })}</p>
      <Hero locale={locale} />
      <StoriesRow locale={locale} />
      <FeaturedNew locale={locale} />
      <GirlsGridSection locale={locale} />
      <ActivityFeed locale={locale} />
      <TrustRow locale={locale} />
      <ReviewsStrip locale={locale} />
      <HashtagCloud locale={locale} />
      <LocationsRow locale={locale} />
      <QuickLinks locale={locale} />
      <ContactSteps locale={locale} />
      <FinalCta locale={locale} />
    </main>
  );
}
