import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import type { Row } from '@libsql/client';
import { applyDBOverride } from '@/lib/seo/db-override';
import { getActivePricingPlans } from '@/lib/queries';
import { offerListJsonLd, breadcrumbListJsonLd, faqPageJsonLd } from '@/lib/seo/jsonld';
import { getCanonicalUrl, getAlternates, ogLocale } from '@/lib/seo/meta';
import ProgramsGrid from '@/components/cenik/ProgramsGrid';
import ExperienceFlow from '@/components/cenik/ExperienceFlow';
import NightPricingNote from '@/components/cenik/NightPricingNote';
import ExtrasGrid from '@/components/cenik/ExtrasGrid';
import PricingNotes from '@/components/cenik/PricingNotes';
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

/**
 * The sr-only lead an assistant quotes back when asked what we cost. It used to
 * be hardcoded and had drifted from the table right below it: it claimed 2,500
 * CZK for 30 minutes while the DB says 2,000, and repeated that same figure for
 * 60 minutes. Now it is built from the same rows ProgramsGrid renders, so the
 * two can only ever agree — and it states the night rate, which the cards show
 * but the old paragraph never mentioned.
 */
const GEO_CURRENCY: Record<string, string> = { cs: 'Kč', en: 'CZK', de: 'CZK', uk: 'CZK' };
const GEO_PRICE_LOCALE: Record<string, string> = { cs: 'cs-CZ', en: 'en-GB', de: 'de-DE', uk: 'uk-UA' };

const GEO_LEAD: Record<string, (list: string, night: string) => string> = {
  cs: (list, night) =>
    `U LovelyGirls Praha se platí za čas, ne za služby: ${list}. Cena zahrnuje privátní apartmán i sprchu, platí se hotově na místě a nic dalšího se nepřipočítává.${night}`,
  en: (list, night) =>
    `At LovelyGirls Prague you pay for time, not for services: ${list}. The price covers the private apartment and shower, is paid in cash on arrival, and nothing else is added.${night}`,
  de: (list, night) =>
    `Bei LovelyGirls Prag bezahlen Sie die Zeit, nicht die Leistungen: ${list}. Der Preis umfasst das private Apartment und die Dusche, wird bar vor Ort bezahlt, und es kommt nichts hinzu.${night}`,
  uk: (list, night) =>
    `У LovelyGirls Прага ви платите за час, а не за послуги: ${list}. Ціна включає приватні апартаменти й душ, оплата готівкою на місці, нічого не додається.${night}`,
};

const GEO_NIGHT: Record<string, (range: string) => string> = {
  cs: (range) => ` Od 23:00 do 7:00 platí noční sazba, o ${range} vyšší.`,
  en: (range) => ` Between 11 PM and 7 AM a night rate applies, ${range} higher.`,
  de: (range) => ` Zwischen 23:00 und 7:00 Uhr gilt ein Nachttarif, ${range} höher.`,
  uk: (range) => ` З 23:00 до 7:00 діє нічний тариф, на ${range} вищий.`,
};

function buildGeoLead(programs: Row[], locale: string): string {
  const cur = GEO_CURRENCY[locale] ?? GEO_CURRENCY.en;
  const priceLoc = GEO_PRICE_LOCALE[locale] ?? GEO_PRICE_LOCALE.en;
  const money = (n: number) => `${n.toLocaleString(priceLoc)} ${cur}`;

  const plans = programs
    .map((p) => ({
      duration: Number(p.duration),
      price: Number(p.price),
      night: p.night_price != null ? Number(p.night_price) : null,
    }))
    .filter((p) => Number.isFinite(p.duration) && Number.isFinite(p.price))
    .sort((a, b) => a.duration - b.duration);

  // The DB was unreachable — say nothing rather than quote a stale number.
  if (plans.length === 0) return '';

  const minLabel = locale === 'cs' ? 'min' : locale === 'uk' ? 'хв' : 'min';
  const list = plans.map((p) => `${p.duration} ${minLabel} ${money(p.price)}`).join(', ');

  const surcharges = plans
    .filter((p) => p.night !== null && Number.isFinite(p.night) && p.night > p.price)
    .map((p) => (p.night as number) - p.price);
  let night = '';
  if (surcharges.length > 0) {
    const lo = Math.min(...surcharges);
    const hi = Math.max(...surcharges);
    const range = lo === hi ? money(lo) : `${lo.toLocaleString(priceLoc)}–${money(hi)}`;
    night = (GEO_NIGHT[locale] ?? GEO_NIGHT.en)(range);
  }

  return (GEO_LEAD[locale] ?? GEO_LEAD.en)(list, night);
}

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
      { q: 'Kolik stojí návštěva u LovelyGirls?', a: 'Programy začínají na 2 000 Kč za 30 minut. Kompletní ceník s pěti programy od 30 do 120 minut najdete na této stránce. Ceny zahrnují apartmán, žádné skryté poplatky.' },
      { q: 'Co je zahrnuto v ceně?', a: 'Cena zahrnuje čas se zvolenou společnicí v soukromém apartmánu, sprchu a diskrétní prostředí. Žádný příplatek za vstup ani pronájem pokoje.' },
      { q: 'Jaké platební metody přijímáte?', a: 'Přijímáme výhradně hotovost — CZK nebo EUR. Kartou, převodem ani jinak bezhotovostně platit nelze. Důvodem je maximální diskrétnost.' },
      { q: 'Jsou ceny pevné, nebo lze smlouvat?', a: 'Ceny programů jsou stanovené a veřejně transparentní. Smlouvání není zvykem. Slevy získáte v rámci věrnostního programu — viz stránka Slevy.' },
      { q: 'Jsou ceny stejné pro všechny společnice?', a: 'Ano, ceny programů jsou jednotné pro všechny dostupné společnice. Liší se pouze podle délky programu a případných extra služeb.' },
      { q: 'Nabízíte slevy?', a: 'Ano — 200 Kč z první návštěvy a bonus v den narozenin. Aktuálně běžící slevy jsou vždy na stránce Slevy; co tam není, právě neběží.' },
    ],
  },
  en: {
    heading: 'Pricing FAQ',
    items: [
      { q: 'How much does a visit to LovelyGirls cost?', a: 'Programs start at 2,000 CZK for 30 minutes. The full price list with five packages from 30 to 120 minutes is on this page. Prices include the apartment — no hidden fees.' },
      { q: 'What is included in the price?', a: 'The price covers time with your chosen companion in a private apartment, shower access and a discreet setting. No extra entry or room rental charge.' },
      { q: 'What payment methods do you accept?', a: 'We accept cash only — CZK or EUR. Cards, bank transfers and other cashless payments are not accepted. This ensures maximum discretion.' },
      { q: 'Are the prices fixed, or can they be negotiated?', a: 'Program prices are fixed and publicly transparent. Bargaining is not customary. Discounts are available through our loyalty program — see the Discounts page.' },
      { q: 'Are prices the same for all companions?', a: 'Yes, program prices are the same for every available companion. They only vary by program duration and optional extras.' },
      { q: 'Do you offer discounts?', a: 'Yes — 200 CZK off your first visit, plus a bonus on your birthday. The Discounts page always lists what is currently running; anything not there is not active.' },
    ],
  },
  de: {
    heading: 'Häufige Fragen zu den Preisen',
    items: [
      { q: 'Wie viel kostet ein Besuch bei LovelyGirls?', a: 'Programme beginnen bei 2.000 CZK für 30 Minuten. Die vollständige Preisliste mit fünf Programmen von 30 bis 120 Minuten finden Sie auf dieser Seite. Die Preise beinhalten die Wohnung — keine versteckten Gebühren.' },
      { q: 'Was ist im Preis enthalten?', a: 'Der Preis umfasst die Zeit mit der gewählten Begleiterin in einer privaten Wohnung, Dusche und ein diskretes Ambiente. Kein Aufpreis für Eintritt oder Zimmermiete.' },
      { q: 'Welche Zahlungsmethoden akzeptieren Sie?', a: 'Wir akzeptieren ausschließlich Bargeld — CZK oder EUR. Karten, Überweisungen und andere bargeldlose Zahlungen werden nicht akzeptiert. Dies gewährleistet maximale Diskretion.' },
      { q: 'Sind die Preise fest oder verhandelbar?', a: 'Die Programmpreise sind festgelegt und öffentlich transparent. Feilschen ist nicht üblich. Rabatte erhalten Sie im Rahmen unseres Treueprogramms — siehe Seite Rabatte.' },
      { q: 'Sind die Preise für alle Begleiterinnen gleich?', a: 'Ja, die Programmpreise sind für alle verfügbaren Begleiterinnen identisch. Sie variieren nur nach Programmdauer und optionalen Extras.' },
      { q: 'Bieten Sie Rabatte an?', a: 'Ja — 200 CZK auf den ersten Besuch und einen Bonus am Geburtstag. Auf der Seite Rabatte steht immer, was gerade läuft; was dort fehlt, ist nicht aktiv.' },
    ],
  },
  uk: {
    heading: 'Часті запитання про ціни',
    items: [
      { q: 'Скільки коштує візит до LovelyGirls?', a: 'Програми починаються від 2 000 CZK за 30 хвилин. Повний прайс із п\'ятьма програмами від 30 до 120 хвилин — на цій сторінці. Ціни включають апартамент, жодних прихованих платежів.' },
      { q: 'Що входить у вартість?', a: 'Ціна охоплює час з обраною супутницею у приватному апартаменті, душ та дискретне середовище. Жодних доплат за вхід чи оренду номера.' },
      { q: 'Які способи оплати ви приймаєте?', a: 'Ми приймаємо тільки готівку — CZK або EUR. Картки, перекази та інші безготівкові способи не приймаються. Це гарантує максимальну конфіденційність.' },
      { q: 'Ціни фіксовані чи можна торгуватися?', a: 'Ціни на програми фіксовані та публічно прозорі. Торг не прийнятий. Знижки доступні в межах програми лояльності — див. сторінку Знижки.' },
      { q: 'Ціни однакові для всіх супутниць?', a: 'Так, ціни програм однакові для всіх доступних супутниць. Вони різняться лише за тривалістю програми та додатковими послугами.' },
      { q: 'Чи є у вас знижки?', a: 'Так — 200 Kč на перший візит і бонус у день народження. На сторінці Знижки завжди вказано, що діє зараз; чого там немає, те не діє.' },
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

  const geoLead = buildGeoLead(programs, locale);

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

      <section className="page-header cenik-header">
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
          {/* sr-only on purpose — same numbers appear in the cards right below,
              this exists so AI crawlers get a full-sentence answer (see docs/GEO-strategy.md).
              Do not make it visible again: it duplicated the cards and users flagged it. */}
          {geoLead && <p data-geo-lead className="sr-only">{geoLead}</p>}

          <ExperienceFlow locale={locale} />

          <h2 className="section-h2" style={{ fontSize: '28px', margin: '48px 0 24px' }}>
            {locale === 'en' ? 'Choose your program' : locale === 'de' ? 'Wählen Sie Ihr Programm' : locale === 'uk' ? 'Оберіть програму' : 'Vyberte si program'}
          </h2>
          <ProgramsGrid programs={programs} locale={locale} />
          <NightPricingNote locale={locale} />

          <h2 className="section-h2" style={{ fontSize: '28px', margin: '48px 0 16px' }}>
            {locale === 'en' ? 'Extra services' : locale === 'de' ? 'Zusatzleistungen' : locale === 'uk' ? 'Додаткові послуги' : 'Extra služby'}
          </h2>
          <ExtrasGrid locale={locale} />

          <PricingNotes locale={locale} />

          <div style={{ marginTop: '64px' }}>
            <h2 className="section-h2" style={{ fontSize: '28px', marginBottom: '16px' }}>
              {faqBundle.heading}
            </h2>
            <div className="faq-list wide-faq-list" style={{ marginBottom: '20px' }}>
              {faqBundle.items.map((f, i) => (
                <details key={i} className="faq-item">
                  <summary>{f.q}</summary>
                  <div className="faq-item-body">{f.a}</div>
                </details>
              ))}
            </div>
            <Link
              href="/faq"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-coral)',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              {locale === 'en' ? 'See all FAQs →' : locale === 'de' ? 'Alle Fragen ansehen →' : locale === 'uk' ? 'Подивитися всі запитання →' : 'Zobrazit všechny časté dotazy →'}
            </Link>
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
