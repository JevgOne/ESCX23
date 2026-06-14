import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import { getActivePricingPlans } from '@/lib/queries';
import { offerListJsonLd, breadcrumbListJsonLd } from '@/lib/seo/jsonld';
import { getCanonicalUrl, getAlternates, ogLocale } from '@/lib/seo/meta';
import ProgramsGrid from '@/components/cenik/ProgramsGrid';
import ExtrasGrid from '@/components/cenik/ExtrasGrid';
import PricingNotes from '@/components/cenik/PricingNotes';
import FaqTeaser from '@/components/cenik/FaqTeaser';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const revalidate = 3600;

const TITLES: Record<string, string> = {
  cs: 'Ceník společnic Praha — Programy a ceny | LovelyGirls',
  en: 'Escort Pricing Prague — Packages & Rates | LovelyGirls',
  de: 'Escort Preise Prag — Programme und Preise | LovelyGirls',
  uk: 'Ціни ескорт Прага — Програми та тарифи | LovelyGirls',
};

const DESCRIPTIONS: Record<string, string> = {
  cs: 'Transparentní ceník LovelyGirls Praha. 5 programů od 30 do 120 minut, platba v hotovosti, žádné skryté poplatky. Extra služby na výběr.',
  en: 'Transparent pricing at LovelyGirls Prague. 5 packages from 30 to 120 minutes, cash payment, no hidden fees. Extra services available.',
  de: 'Transparente Preise bei LovelyGirls Prag. 5 Programme von 30 bis 120 Minuten, Barzahlung, keine versteckten Gebühren.',
  uk: 'Прозорі ціни LovelyGirls Прага. 5 програм від 30 до 120 хвилин, готівка, без прихованих платежів.',
};

const GEO_LEADS: Record<string, string> = {
  en: 'At LovelyGirls Prague, companion programs start at 2,500 CZK for 30 minutes, 2,500 CZK for 60 minutes, and 4,500 CZK for 2 hours; all prices include the apartment fee.',
  cs: 'U LovelyGirls Praha začínají programy na 2 500 Kč za 30 minut, 2 500 Kč za 60 minut a 4 500 Kč za 2 hodiny; ceny zahrnují poplatek za apartmán.',
  de: 'Bei LovelyGirls Prag beginnen die Programme bei 2 500 CZK für 30 Minuten, 2 500 CZK für 60 Minuten und 4 500 CZK für 2 Stunden; Apartmentgebühr inklusive.',
  uk: 'У LovelyGirls Прага програми починаються від 2 500 CZK за 30 хвилин, 2 500 CZK за годину та 4 500 CZK за 2 години; вартість апартаменту включена.',
};

const CANONICAL_PATH: Record<string, string> = {
  cs: '/cenik',
  en: '/pricing',
  de: '/preise',
  uk: '/tsiny',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = CANONICAL_PATH[locale] ?? '/cenik';
  const canonical = getCanonicalUrl(locale, path);
  const { buildOgImages } = await import('@/lib/seo/og');
  const ogImages = await buildOgImages('cenik', locale, '/cenik', TITLES[locale] ?? TITLES.en);

  return applyDBOverride(`/${locale}/cenik`, {
    title: TITLES[locale] ?? TITLES.en,
    description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.en,
    alternates: {
      canonical,
      languages: getAlternates('/cenik'),
    },
    openGraph: {
      images: ogImages,
      title: TITLES[locale] ?? TITLES.en,
      description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.en,
      url: canonical,
      locale: ogLocale(locale),
    },
  });

}

export default async function CenikPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const programs = await getActivePricingPlans();
  const schema = offerListJsonLd(
    programs.map((p) => ({
      title_cs: p.title_cs,
      price: p.price,
      duration: p.duration,
      is_popular: p.is_popular,
    })),
    locale
  );

  const geoLead = GEO_LEADS[locale] ?? GEO_LEADS.cs;

  const cenikLabel = locale === 'en' ? 'Pricing' : locale === 'de' ? 'Preise' : locale === 'uk' ? 'Ціни' : 'Ceník';
  const cenikPath = CANONICAL_PATH[locale] ?? '/cenik';
  const breadcrumbSchema = breadcrumbListJsonLd([
    { name: cenikLabel, url: getCanonicalUrl(locale, cenikPath) },
  ]);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Breadcrumbs
        items={[{ label: locale === 'en' ? 'Pricing' : locale === 'de' ? 'Preise' : locale === 'uk' ? 'Ціни' : 'Ceník' }]}
        locale={locale}
      />

      <section className="page-header">
        <div className="container">
          <h1>
            {locale === 'en' ? 'Pricing' : locale === 'de' ? 'Preise' : locale === 'uk' ? 'Ціни' : 'Ceník'}
          </h1>
          <p>
            {locale === 'en'
              ? 'Transparent prices with no hidden fees. Choose the program that suits you.'
              : locale === 'de'
                ? 'Transparente Preise ohne versteckte Gebühren. Wählen Sie Ihr Programm.'
                : locale === 'uk'
                  ? 'Прозорі ціни без прихованих зборів. Оберіть програму для себе.'
                  : 'Transparentní ceny bez skrytých poplatků. Vyberte si program, který vám vyhovuje.'}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p data-geo-lead className="sr-only">{geoLead}</p>

          <ProgramsGrid programs={programs} locale={locale} />

          <h2 className="section-h2" style={{ fontSize: '28px', margin: '48px 0 16px' }}>
            {locale === 'en' ? 'Extra services' : locale === 'de' ? 'Zusatzleistungen' : locale === 'uk' ? 'Додаткові послуги' : 'Extra služby'}
          </h2>
          <ExtrasGrid locale={locale} />

          <PricingNotes locale={locale} />

          <div style={{ marginTop: '64px' }}>
            <FaqTeaser locale={locale} />
          </div>
        </div>
      </section>
    </main>
  );
}
