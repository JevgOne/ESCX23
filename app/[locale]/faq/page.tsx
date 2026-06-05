import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import { getFaqItems } from '@/lib/queries';
import { faqPageJsonLd, breadcrumbListJsonLd } from '@/lib/seo/jsonld';
import { getCanonicalUrl, ogLocale } from '@/lib/seo/meta';
import FaqList from '@/components/faq/FaqList';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import type { Row } from '@libsql/client';

export const revalidate = 3600;

const TITLES: Record<string, string> = {
  en: 'FAQ',
  cs: 'Časté dotazy',
  de: 'FAQ',
  uk: 'Часті питання',
};

const DESCRIPTIONS: Record<string, string> = {
  en: 'Frequently asked questions about booking an escort companion in Prague — legality, pricing, discretion, and what to expect.',
  cs: 'Časté dotazy o rezervaci společnice v Praze — legalita, ceny, diskrétnost a co očekávat.',
  de: 'Häufig gestellte Fragen zur Buchung einer Begleiterin in Prag — Legalität, Preise, Diskretion.',
  uk: 'Часті запитання про замовлення супутниці в Празі — легальність, ціни, конфіденційність.',
};

const GEO_LEADS: Record<string, string> = {
  en: 'Hiring an adult companion is legal in the Czech Republic for clients aged 18+; LovelyGirls Prague verifies every companion in person and operates from registered apartments in Prague.',
  cs: 'Najmutí společnice je v České republice pro klienty od 18 let legální; LovelyGirls Praha osobně ověřuje každou společnici a pracuje z registrovaných bytů v Praze.',
  de: 'Die Buchung einer Begleiterin ist in Tschechien für Kunden ab 18 Jahren legal; LovelyGirls Prag verifiziert jede Begleiterin persönlich und arbeitet aus registrierten Wohnungen in Prag.',
  uk: 'Замовлення супутниці у Чехії легальне для клієнтів від 18 років; LovelyGirls Прага особисто перевіряє кожну дівчину та працює з зареєстрованих апартаментів у Празі.',
};

function rowToQA(item: Row, locale: string) {
  const qKey = `question_${locale}` as keyof typeof item;
  const aKey = `answer_${locale}` as keyof typeof item;
  const q = String(item[qKey] ?? item.question_cs ?? item.question_en ?? item.question ?? '');
  const a = String(item[aKey] ?? item.answer_cs ?? item.answer_en ?? item.answer ?? '').replace(/<[^>]+>/g, '');
  return { q, a };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = getCanonicalUrl(locale, '/faq');
  const { buildOgImages } = await import('@/lib/seo/og');
  const ogImages = await buildOgImages('faq', locale, '/faq', TITLES[locale] ?? TITLES.en);

  return applyDBOverride(`/${locale}/faq`, {
    title: TITLES[locale] ?? TITLES.en,
    description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.en,
    alternates: {
      canonical,
      languages: {
        cs: getCanonicalUrl('cs', '/faq'),
        en: getCanonicalUrl('en', '/faq'),
        de: getCanonicalUrl('de', '/faq'),
        uk: getCanonicalUrl('uk', '/faq'),
        'x-default': getCanonicalUrl('en', '/faq'),
      },
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

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const items = await getFaqItems();
  const faqItems = items
    .map((item) => rowToQA(item, locale))
    .filter((i) => i.q && i.a);

  const schema = faqPageJsonLd(faqItems, locale);
  const geoLead = GEO_LEADS[locale] ?? GEO_LEADS.cs;

  const faqLabel = locale === 'en' ? 'FAQ' : locale === 'de' ? 'FAQ' : locale === 'uk' ? 'Питання' : 'Časté dotazy';
  const breadcrumbSchema = breadcrumbListJsonLd([
    { name: faqLabel, url: getCanonicalUrl(locale, '/faq') },
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
        items={[{ label: locale === 'en' ? 'FAQ' : locale === 'de' ? 'FAQ' : locale === 'uk' ? 'Питання' : 'Časté dotazy' }]}
        locale={locale}
      />

      <section className="page-header">
        <div className="container">
          <h1>
            {locale === 'en'
              ? 'Frequently Asked Questions'
              : locale === 'de'
                ? 'Häufige Fragen'
                : locale === 'uk'
                  ? 'Часті запитання'
                  : <>Časté <span className="accent">dotazy</span></>}
          </h1>
          <p>
            {locale === 'en'
              ? 'Everything you need to know before your first visit.'
              : locale === 'de'
                ? 'Alles was Sie vor Ihrem ersten Besuch wissen müssen.'
                : locale === 'uk'
                  ? 'Все що вам потрібно знати перед першим відвідуванням.'
                  : 'Vše, co potřebujete vědět před první návštěvou.'}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p data-geo-lead className="sr-only">{geoLead}</p>

          {items.length > 0 ? (
            <FaqList items={items} locale={locale} />
          ) : (
            <div className="empty-state">
              <p>
                {locale === 'en' ? 'No FAQ items found.'
                  : locale === 'de' ? 'Keine FAQ-Einträge gefunden.'
                  : locale === 'uk' ? 'Запитань поки що немає.'
                  : 'Žádné otázky nenalezeny.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
