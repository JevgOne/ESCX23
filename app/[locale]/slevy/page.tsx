import { setRequestLocale } from 'next-intl/server';
// Only reads `discounts`, which changes when someone toggles one in the admin
// — and that route already calls revalidatePath('/cs/slevy'), so the cache is
// dropped on save rather than waited out.
export const revalidate = 3600;
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import { getActiveDiscounts } from '@/lib/queries';
import { discountOffersJsonLd, breadcrumbListJsonLd, faqPageJsonLd } from '@/lib/seo/jsonld';
import { getCanonicalUrl, getAlternates, ogLocale } from '@/lib/seo/meta';
import DiscountsGrid from '@/components/slevy/DiscountsGrid';
import LoyaltyExplainer from '@/components/slevy/LoyaltyExplainer';
import HowToUse from '@/components/slevy/HowToUse';
import Breadcrumbs from '@/components/ui/Breadcrumbs';


type DiscountRow = Record<string, unknown>;

const CURRENCY: Record<string, string> = { cs: 'Kč', en: 'CZK', de: 'CZK', uk: 'CZK' };
const NO_DISCOUNTS: Record<string, string> = {
  cs: 'Momentálně neběží žádná sleva. Aktuální ceny najdete v ceníku.',
  en: 'No discount is running right now. Current prices are on the pricing page.',
  de: 'Derzeit läuft kein Rabatt. Aktuelle Preise finden Sie in der Preisliste.',
  uk: 'Наразі знижок немає. Актуальні ціни — на сторінці цін.',
};
const PAGE_LABEL: Record<string, string> = { cs: 'Slevy', en: 'Discounts', de: 'Rabatte', uk: 'Знижки' };
const BRAND: Record<string, string> = { cs: 'LovelyGirls Praha', en: 'LovelyGirls Prague', de: 'LovelyGirls Prag', uk: 'LovelyGirls Прага' };

function loc(d: DiscountRow, field: string, locale: string): string {
  return String(d[`${field}_${locale}`] ?? d[`${field}_en`] ?? d[`${field}_cs`] ?? '').trim();
}

/** "20 %" or "200 Kč" — empty when the discount carries no number. */
function amountLabel(d: DiscountRow, locale: string): string {
  const value = Number(d.discount_value ?? 0);
  if (!value) return '';
  return String(d.discount_type) === 'percentage'
    ? `${value} %`
    : `${value} ${CURRENCY[locale] ?? CURRENCY.en}`;
}

/**
 * Every claim on this page is built from the discounts table.
 *
 * It used to hardcode a loyalty program (10/12/15 % after 3/5/10 visits), a
 * morning discount and a 20 % birthday discount in the title, description, GEO
 * lead, FAQ and FAQ JSON-LD — none of which the agency offers. Staff then had
 * to turn those promises down at the door, and Google was being told about
 * them in structured data. Derived copy cannot promise a discount that is not
 * in the table.
 */
function discountCopy(discounts: DiscountRow[], locale: string) {
  const brand = BRAND[locale] ?? BRAND.en;
  const label = PAGE_LABEL[locale] ?? PAGE_LABEL.en;
  const items = discounts.map((d) => ({
    name: loc(d, 'name', locale),
    amount: amountLabel(d, locale),
    desc: loc(d, 'description', locale),
  })).filter((i) => i.name);

  if (items.length === 0) {
    return {
      title: label,
      description: NO_DISCOUNTS[locale] ?? NO_DISCOUNTS.en,
      geoLead: NO_DISCOUNTS[locale] ?? NO_DISCOUNTS.en,
      items,
    };
  }

  const short = (i: { name: string; amount: string }) => (i.amount ? `${i.name} ${i.amount}` : i.name);
  // The root template appends " · LovelyGirls", so the built part has to leave
  // room for it — two Ukrainian discount names alone pushed the title to 70,
  // past what Google shows. Take names while they still fit.
  const BRAND_SUFFIX = ' · LovelyGirls'.length;
  const title = (() => {
    let out = label;
    for (const item of items.slice(0, 2)) {
      const next = out === label ? `${label} — ${short(item)}` : `${out}, ${short(item)}`;
      if (next.length + BRAND_SUFFIX > 65) break;
      out = next;
    }
    return out;
  })();
  const listed = items.map(short).join(', ');
  const intro: Record<string, string> = {
    cs: `Aktuální slevy u ${brand}: ${listed}. Slevu stačí zmínit při domluvě přes WhatsApp nebo telefon.`,
    en: `Current discounts at ${brand}: ${listed}. Just mention the discount when booking via WhatsApp or phone.`,
    de: `Aktuelle Rabatte bei ${brand}: ${listed}. Erwähnen Sie den Rabatt einfach bei der Buchung.`,
    uk: `Актуальні знижки в ${brand}: ${listed}. Просто згадайте знижку під час бронювання.`,
  };
  const text = intro[locale] ?? intro.en;
  return { title, description: text, geoLead: text, items };
}

const CANONICAL_PATH: Record<string, string> = {
  cs: '/slevy',
  en: '/discounts',
  de: '/rabatte',
  uk: '/znyzhky',
};

interface FaqItem { q: string; a: string }

const FAQ_HEADING: Record<string, string> = {
  cs: 'Časté dotazy ke slevám',
  en: 'Discount FAQ',
  de: 'Häufige Fragen zu Rabatten',
  uk: 'Часті запитання про знижки',
};
const HOW_Q: Record<string, string> = {
  cs: 'Jak slevu uplatním?',
  en: 'How do I claim a discount?',
  de: 'Wie erhalte ich den Rabatt?',
  uk: 'Як отримати знижку?',
};
const HOW_A: Record<string, string> = {
  cs: 'Stačí ji zmínit při domluvě přes WhatsApp nebo telefon. Sleva se odečte na místě, nic předem neplatíte.',
  en: 'Mention it when you book via WhatsApp or phone. It is deducted on arrival — nothing is paid in advance.',
  de: 'Erwähnen Sie ihn bei der Buchung über WhatsApp oder Telefon. Er wird vor Ort abgezogen.',
  uk: 'Згадайте її під час бронювання через WhatsApp або телефон. Знижка віднімається на місці.',
};
const HOW_WORKS: Record<string, string> = {
  cs: 'Jak funguje sleva', en: 'How does the', de: 'Wie funktioniert der Rabatt', uk: 'Як працює знижка',
};

/** One question per real discount, answered with that discount's own description. */
function buildFaq(items: { name: string; amount: string; desc: string }[], locale: string): FaqItem[] {
  const lead = HOW_WORKS[locale] ?? HOW_WORKS.en;
  const out: FaqItem[] = items
    .filter((i) => i.desc)
    .map((i) => ({
      q: locale === 'en' ? `${lead} "${i.name}" discount work?` : `${lead} „${i.name}"?`,
      a: i.amount ? `${i.desc} (${i.amount})` : i.desc,
    }));
  out.push({ q: HOW_Q[locale] ?? HOW_Q.en, a: HOW_A[locale] ?? HOW_A.en });
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = CANONICAL_PATH[locale] ?? '/slevy';
  const canonical = getCanonicalUrl(locale, path);
  const { buildOgImages } = await import('@/lib/seo/og');
  const copy = discountCopy(await getActiveDiscounts().catch(() => []), locale);
  const ogImages = await buildOgImages('slevy', locale, '/slevy', copy.title);

  return applyDBOverride(`/${locale}/slevy`, {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: getAlternates('/slevy'),
    },
    openGraph: {
      images: ogImages,
      title: copy.title,
      description: copy.description,
      url: canonical,
      locale: ogLocale(locale),
    },
  });

}

export default async function SlevyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const discounts = await getActiveDiscounts().catch(() => []);
  const schema = discountOffersJsonLd(
    discounts.map((d) => ({
      name_cs: d.name_cs,
      name_en: d.name_en,
      description: d.description,
      amount_value: d.amount_value,
      amount_type: d.amount_type,
    }))
  );
  const copy = discountCopy(discounts, locale);
  const geoLead = copy.geoLead;
  const bcLabel = locale === 'en' ? 'Discounts' : locale === 'de' ? 'Rabatte' : locale === 'uk' ? 'Знижки' : 'Slevy';
  const breadcrumbSchema = breadcrumbListJsonLd([
    { name: bcLabel, url: getCanonicalUrl(locale, '/slevy') },
  ]);

  const faqItems = buildFaq(copy.items, locale);
  const faqSchema = faqPageJsonLd(
    faqItems.map((f) => ({ q: f.q, a: f.a })),
    locale
  );

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
        items={[{ label: bcLabel }]}
        locale={locale}
      />

      <section className="page-header">
        <div className="container">
          <h1>
            {locale === 'en' ? (
              <>Discounts &amp; <span className="accent">packages</span></>
            ) : locale === 'de' ? (
              <>Rabatte &amp; <span className="accent">Angebote</span></>
            ) : locale === 'uk' ? (
              <>Знижки та <span className="accent">пакети</span></>
            ) : (
              <>Slevy a <span className="accent">balíčky</span></>
            )}
          </h1>
          <p>
            {locale === 'en'
              ? 'Loyalty rewards for regular clients and great packages for everyone.'
              : locale === 'de'
                ? 'Treueprämien für Stammkunden und attraktive Pakete für jeden.'
                : locale === 'uk'
                  ? 'Програма лояльності для постійних клієнтів та вигідні пакети для всіх.'
                  : 'Věrnostní program pro stálé klienty a výhodné balíčky pro každého.'}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p data-geo-lead className="sr-only">{geoLead}</p>

          {discounts.length > 0 ? (
            <DiscountsGrid discounts={discounts} locale={locale} />
          ) : (
            <p className="no-results">{NO_DISCOUNTS[locale] ?? NO_DISCOUNTS.en}</p>
          )}

          <HowToUse locale={locale} />

          <div style={{ marginTop: '48px' }}>
            <h2 className="section-h2 faq-section-title" style={{ fontSize: '28px', marginBottom: '16px' }}>
              {FAQ_HEADING[locale] ?? FAQ_HEADING.en}
            </h2>
            <div className="faq-list">
              {faqItems.map((f, i) => (
                <details key={i} className="faq-item">
                  <summary>{f.q}</summary>
                  <div className="faq-item-body">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

