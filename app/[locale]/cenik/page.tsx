import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import { getActivePricingPlans } from '@/lib/queries';
import { offerListJsonLd, breadcrumbListJsonLd, faqPageJsonLd } from '@/lib/seo/jsonld';
import { getCanonicalUrl, getAlternates, ogLocale } from '@/lib/seo/meta';
import ProgramsGrid from '@/components/cenik/ProgramsGrid';
import NightPricingNote from '@/components/cenik/NightPricingNote';
import ExtrasGrid from '@/components/cenik/ExtrasGrid';
import PricingNotes from '@/components/cenik/PricingNotes';
import FaqTeaser from '@/components/cenik/FaqTeaser';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { Link } from '@/i18n/navigation';

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

interface FaqItem { q: string; a: string }
interface FaqBundle { heading: string; items: FaqItem[] }

const FAQ_DATA: Record<string, FaqBundle> = {
  cs: {
    heading: 'Často kladené dotazy k ceníku',
    items: [
      { q: 'Kolik stojí návštěva u LovelyGirls?', a: 'Programy začínají na 2 500 Kč za 30 minut. Kompletní ceník s pěti programy od 30 do 120 minut najdete na této stránce. Ceny zahrnují apartmán, žádné skryté poplatky.' },
      { q: 'Co je zahrnuto v ceně?', a: 'Cena zahrnuje čas se zvolenou společnicí v soukromém apartmánu, sprchu a diskrétní prostředí. Žádný příplatek za vstup ani pronájem pokoje.' },
      { q: 'Jaké platební metody přijímáte?', a: 'Přijímáme výhradně hotovost — CZK nebo EUR. Kartou, převodem ani jinak bezhotovostně platit nelze. Důvodem je maximální diskrétnost.' },
      { q: 'Jsou ceny stejné pro všechny společnice?', a: 'Ano, ceny programů jsou jednotné pro všechny dostupné společnice. Liší se pouze podle délky programu a případných extra služeb.' },
      { q: 'Nabízíte slevy?', a: 'Ano — máme věrnostní program (10–15 % sleva po 3, 5 a 10 návštěvách), ranní slevu 300 Kč (10:00–13:00, Po–Pá) a narozeninovou slevu 20 %. Podrobnosti najdete na stránce Slevy.' },
    ],
  },
  en: {
    heading: 'Pricing FAQ',
    items: [
      { q: 'How much does a visit to LovelyGirls cost?', a: 'Programs start at 2,500 CZK for 30 minutes. The full price list with five packages from 30 to 120 minutes is on this page. Prices include the apartment — no hidden fees.' },
      { q: 'What is included in the price?', a: 'The price covers time with your chosen companion in a private apartment, shower access and a discreet setting. No extra entry or room rental charge.' },
      { q: 'What payment methods do you accept?', a: 'We accept cash only — CZK or EUR. Cards, bank transfers and other cashless payments are not accepted. This ensures maximum discretion.' },
      { q: 'Are prices the same for all companions?', a: 'Yes, program prices are the same for every available companion. They only vary by program duration and optional extras.' },
      { q: 'Do you offer discounts?', a: 'Yes — we have a loyalty program (10–15 % off after 3, 5 and 10 visits), a morning discount of 300 CZK (10:00–13:00, Mon–Fri) and a 20 % birthday discount. See the Discounts page for details.' },
    ],
  },
  de: {
    heading: 'Häufige Fragen zu den Preisen',
    items: [
      { q: 'Wie viel kostet ein Besuch bei LovelyGirls?', a: 'Programme beginnen bei 2 500 CZK für 30 Minuten. Die vollständige Preisliste mit fünf Programmen von 30 bis 120 Minuten finden Sie auf dieser Seite. Die Preise beinhalten die Wohnung — keine versteckten Gebühren.' },
      { q: 'Was ist im Preis enthalten?', a: 'Der Preis umfasst die Zeit mit der gewählten Begleiterin in einer privaten Wohnung, Dusche und ein diskretes Ambiente. Kein Aufpreis für Eintritt oder Zimmermiete.' },
      { q: 'Welche Zahlungsmethoden akzeptieren Sie?', a: 'Wir akzeptieren ausschließlich Bargeld — CZK oder EUR. Karten, Überweisungen und andere bargeldlose Zahlungen werden nicht akzeptiert. Dies gewährleistet maximale Diskretion.' },
      { q: 'Sind die Preise für alle Begleiterinnen gleich?', a: 'Ja, die Programmpreise sind für alle verfügbaren Begleiterinnen identisch. Sie variieren nur nach Programmdauer und optionalen Extras.' },
      { q: 'Bieten Sie Rabatte an?', a: 'Ja — wir haben ein Treueprogramm (10–15 % nach 3, 5 und 10 Besuchen), einen Morgenrabatt von 300 CZK (10:00–13:00, Mo–Fr) und einen Geburtstagsrabatt von 20 %. Details auf der Seite Rabatte.' },
    ],
  },
  uk: {
    heading: 'Часті запитання про ціни',
    items: [
      { q: 'Скільки коштує візит до LovelyGirls?', a: 'Програми починаються від 2 500 CZK за 30 хвилин. Повний прайс із п\'ятьма програмами від 30 до 120 хвилин — на цій сторінці. Ціни включають апартамент, жодних прихованих платежів.' },
      { q: 'Що входить у вартість?', a: 'Ціна охоплює час з обраною супутницею у приватному апартаменті, душ та дискретне середовище. Жодних доплат за вхід чи оренду номера.' },
      { q: 'Які способи оплати ви приймаєте?', a: 'Ми приймаємо тільки готівку — CZK або EUR. Картки, перекази та інші безготівкові способи не приймаються. Це гарантує максимальну конфіденційність.' },
      { q: 'Ціни однакові для всіх супутниць?', a: 'Так, ціни програм однакові для всіх доступних супутниць. Вони різняться лише за тривалістю програми та додатковими послугами.' },
      { q: 'Чи є у вас знижки?', a: 'Так — у нас є програма лояльності (10–15 % після 3, 5 і 10 відвідувань), ранкова знижка 300 CZK (10:00–13:00, Пн–Пт) та знижка до дня народження 20 %. Деталі на сторінці Знижки.' },
    ],
  },
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

  const programs = await getActivePricingPlans().catch(() => []);
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

  const faqBundle = FAQ_DATA[locale] ?? FAQ_DATA.en;
  const faqSchema = faqPageJsonLd(
    faqBundle.items.map((f) => ({ q: f.q, a: f.a })),
    locale
  );

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
          <NightPricingNote locale={locale} />

          <h2 className="section-h2" style={{ fontSize: '28px', margin: '48px 0 16px' }}>
            {locale === 'en' ? 'Extra services' : locale === 'de' ? 'Zusatzleistungen' : locale === 'uk' ? 'Додаткові послуги' : 'Extra služby'}
          </h2>
          <ExtrasGrid locale={locale} />

          <PricingNotes locale={locale} />

          <div style={{ marginTop: '64px' }}>
            <FaqTeaser locale={locale} />
          </div>

          <div style={{ marginTop: '48px' }}>
            <h2 className="section-h2" style={{ fontSize: '28px', marginBottom: '16px' }}>
              {faqBundle.heading}
            </h2>
            <div className="faq-list">
              {faqBundle.items.map((f, i) => (
                <details key={i} className="faq-item">
                  <summary>{f.q}</summary>
                  <div className="faq-item-body">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2 className="section-h2" style={{ fontSize: '22px', marginBottom: '16px' }}>
            {locale === 'en' ? 'See also' : locale === 'de' ? 'Siehe auch' : locale === 'uk' ? 'Дивіться також' : 'Podívejte se také'}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Link href="/divky" className="btn btn-ghost btn-sm">
              {locale === 'en' ? 'Companions' : locale === 'de' ? 'Begleiterinnen' : locale === 'uk' ? 'Дівчата' : 'Dívky'}
            </Link>
            <Link href="/rozvrh" className="btn btn-ghost btn-sm">
              {locale === 'en' ? 'Schedule' : locale === 'de' ? 'Zeitplan' : locale === 'uk' ? 'Розклад' : 'Rozvrh'}
            </Link>
            <Link href="/slevy" className="btn btn-ghost btn-sm">
              {locale === 'en' ? 'Discounts' : locale === 'de' ? 'Rabatte' : locale === 'uk' ? 'Знижки' : 'Slevy'}
            </Link>
            <Link href="/faq" className="btn btn-ghost btn-sm">
              {locale === 'en' ? 'FAQ' : locale === 'de' ? 'FAQ' : locale === 'uk' ? 'Питання' : 'Časté dotazy'}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
