import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import Hero from '@/components/home/Hero';
import FeaturedNew from '@/components/home/FeaturedNew';
import GirlsGridSection from '@/components/home/GirlsGridSection';
import ActivityFeed from '@/components/home/ActivityFeed';
import TrustRow from '@/components/home/TrustRow';
import ReviewsStrip from '@/components/home/ReviewsStrip';
import HashtagCloud from '@/components/home/HashtagCloud';
import LocationsRow from '@/components/home/LocationsRow';
import ContactSteps from '@/components/home/ContactSteps';
import FinalCta from '@/components/home/FinalCta';
import {
  homepageLocalBusiness,
  organizationJsonLd,
  websiteJsonLd,
  aggregateRatingJsonLd,
} from '@/lib/seo/jsonld';
import { getCanonicalUrl, getAlternates, ogLocale } from '@/lib/seo/meta';
import { getHomepageStats } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TITLES: Record<string, string> = {
  en: 'LovelyGirls Prague — Verified Companions',
  cs: 'LovelyGirls Praha — Ověřené společnice',
  de: 'LovelyGirls Prag — Verifizierte Begleiterinnen',
  uk: 'LovelyGirls Прага — Перевірені супутниці',
};

const DESCRIPTIONS: Record<string, string> = {
  en: 'LovelyGirls Prague: 13 verified companions, 4 private apartments in Prague 2, 8, 1 and 3, open daily 10:00–22:30. Fast WhatsApp/Telegram contact.',
  cs: 'LovelyGirls Praha: 13 ověřených společnic, 4 privátní byty na Vinohradech, v Karlíně, Starém Městě a Žižkově, otevřeno denně 10:00–22:30.',
  de: 'LovelyGirls Prag: 13 verifizierte Begleiterinnen, 4 private Apartments in Prag 2, 8, 1 und 3, täglich 10:00–22:30 geöffnet.',
  uk: 'LovelyGirls Прага: 13 перевірених супутниць, 4 приватних апартаменти (Виноградах, Карлін, Старе Місто, Жижков), щодня 10:00–22:30.',
};

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

  return {
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
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'geo' });
  const localBusinessSchema = homepageLocalBusiness(locale);
  const orgSchema = organizationJsonLd();
  const websiteSchema = websiteJsonLd(locale);
  const stats = await getHomepageStats().catch(() => ({
    totalLive: 0,
    workingNow: 0,
    totalReviews: 0,
    avgRating: 0,
  }));
  const ratingSchema = aggregateRatingJsonLd(stats.avgRating, stats.totalReviews);

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
      {ratingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ratingSchema) }}
        />
      )}
      <p data-geo-lead className="sr-only">{t('home_lead')}</p>
      <Hero locale={locale} />
      <FeaturedNew locale={locale} />
      <GirlsGridSection locale={locale} />
      <ActivityFeed locale={locale} />
      <TrustRow locale={locale} />
      <ReviewsStrip locale={locale} />
      <HashtagCloud locale={locale} />
      <LocationsRow locale={locale} />
      <ContactSteps locale={locale} />
      <FinalCta locale={locale} />
    </main>
  );
}
