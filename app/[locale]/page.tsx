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
  cs: 'Escort Praha — Ověřené společnice v privátním apartmánu | LovelyGirls',
  en: 'Escort Prague — Verified Companions, Private Apartments | LovelyGirls',
  de: 'Escort Prag — Verifizierte Begleiterinnen, Diskrete Apartments | LovelyGirls',
  uk: 'Ескорт Прага — Перевірені супутниці, Приватні апартаменти | LovelyGirls',
};

const DESCRIPTIONS: Record<string, string> = {
  cs: '13 ověřených společnic v Praze. 4 diskrétní apartmány, transparentní ceník, otevřeno denně 10–22:30. Kontakt přes WhatsApp.',
  en: '13 verified companions in Prague. 4 discreet apartments, transparent pricing, open daily 10–22:30. Instant WhatsApp booking.',
  de: '13 verifizierte Begleiterinnen in Prag. 4 diskrete Apartments, transparente Preise, täglich 10–22:30. WhatsApp-Buchung.',
  uk: '13 перевірених супутниць у Празі. 4 дискретних апартаменти, прозорі ціни, щодня 10–22:30. Бронювання через WhatsApp.',
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
      <StoriesRow locale={locale} />
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
