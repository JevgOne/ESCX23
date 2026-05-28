import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { getActiveDiscounts } from '@/lib/queries';
import { discountOffersJsonLd } from '@/lib/seo/jsonld';
import { getCanonicalUrl, ogLocale } from '@/lib/seo/meta';
import DiscountsGrid from '@/components/slevy/DiscountsGrid';
import LoyaltyExplainer from '@/components/slevy/LoyaltyExplainer';
import HowToUse from '@/components/slevy/HowToUse';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

const TITLES: Record<string, string> = {
  en: 'Discounts — LovelyGirls Prague',
  cs: 'Slevy — LovelyGirls Praha',
  de: 'Rabatte — LovelyGirls Prag',
  uk: 'Знижки — LovelyGirls Прага',
};

const DESCRIPTIONS: Record<string, string> = {
  en: 'LovelyGirls Prague loyalty program, morning discounts, birthday and referral offers. Up to 15 % off.',
  cs: 'Věrnostní program LovelyGirls Praha, ranní slevy, narozeninové a doporučovací akce. Až 15 % sleva.',
  de: 'LovelyGirls Prag Treueprogramm, Morgenrabatt, Geburtstagsangebot. Bis zu 15 % Rabatt.',
  uk: 'Програма лояльності LovelyGirls Прага, ранні знижки, акції. До 15 % знижки.',
};

const GEO_LEADS: Record<string, string> = {
  en: 'LovelyGirls Prague offers a 10–15 % loyalty discount after 3, 5, and 10 visits, a morning discount from 10:00–13:00 on weekdays, and a birthday discount of 20 %.',
  cs: 'LovelyGirls Praha poskytuje věrnostní slevu 10–15 % po 3, 5 a 10 návštěvách, ranní slevu 10:00–13:00 v pracovní dny a narozeninovou slevu 20 %.',
  de: 'LovelyGirls Prag bietet 10–15 % Treuebonus nach 3, 5 und 10 Besuchen, Morgenrabatt 10:00–13:00 an Werktagen und 20 % Geburtstagsrabatt.',
  uk: 'LovelyGirls Прага дає знижку лояльності 10–15 % після 3, 5 і 10 відвідувань, ранню знижку 10:00–13:00 у будні та знижку до дня народження 20 %.',
};

const CANONICAL_PATH: Record<string, string> = {
  cs: '/slevy',
  en: '/discounts',
  de: '/rabatte',
  uk: '/znyzhky',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = CANONICAL_PATH[locale] ?? '/slevy';
  const canonical = getCanonicalUrl(locale, path);
  const { getCustomOgImage } = await import('@/lib/seo/og');
  const _customOg_slevy = await getCustomOgImage('slevy');

  return {
    title: TITLES[locale] ?? TITLES.en,
    description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.en,
    openGraph: {
      images: _customOg_slevy ? [{ url: _customOg_slevy, width: 1200, height: 630, alt: '' }] : undefined,
      title: TITLES[locale] ?? TITLES.en,
      description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.en,
      url: canonical,
      locale: ogLocale(locale),
    },
  };
}

export default async function SlevyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const discounts = await getActiveDiscounts();
  const schema = discountOffersJsonLd(
    discounts.map((d) => ({
      name_cs: d.name_cs,
      name_en: d.name_en,
      description: d.description,
      amount_value: d.amount_value,
      amount_type: d.amount_type,
    }))
  );
  const geoLead = GEO_LEADS[locale] ?? GEO_LEADS.cs;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Breadcrumbs
        items={[{ label: locale === 'en' ? 'Discounts' : locale === 'de' ? 'Rabatte' : locale === 'uk' ? 'Знижки' : 'Slevy' }]}
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
            <FallbackDiscountCards locale={locale} />
          )}

          <LoyaltyExplainer locale={locale} />
          <HowToUse locale={locale} />
        </div>
      </section>
    </main>
  );
}

interface FallbackBundle {
  loyaltyH: string; loyaltyIntro: string; tier3: string; tier5: string; tier10: string; tier_lasts: string;
  morningH: string; cur: string; morningIntro: string; monFri: string; minProgram: string;
  birthdayH: string; birthdayIntro: string; onceYearly: string; mentionBirthday: string;
}
const FALLBACK: Record<string, FallbackBundle> = {
  cs: {
    loyaltyH: 'Věrnostní program',
    loyaltyIntro: 'Stálí klienti získávají slevu automaticky. Čím častěji nás navštěvujete, tím větší výhoda.',
    tier3: 'Po 3. návštěvě: 10 %',
    tier5: 'Po 5. návštěvě: 12 %',
    tier10: 'Po 10. návštěvě: 15 %',
    tier_lasts: 'Sleva platí 12 měsíců od poslední návštěvy',
    morningH: 'Ranní sleva',
    cur: 'Kč',
    morningIntro: 'Sleva 300 Kč na program 60+ minut, pokud přijdete 10:00–13:00 (Po–Pá).',
    monFri: 'Pondělí — pátek',
    minProgram: 'Min. program 60 minut',
    birthdayH: 'Narozeninová sleva',
    birthdayIntro: 'V den narozenin nebo do 7 dnů od nich získáte slevu 20 % na libovolný program.',
    onceYearly: 'Platí 1× ročně',
    mentionBirthday: 'Při domluvě uveďte datum narozenin',
  },
  en: {
    loyaltyH: 'Loyalty program',
    loyaltyIntro: 'Regular clients receive an automatic discount. The more often you visit, the better the perk.',
    tier3: 'After visit 3: 10 %',
    tier5: 'After visit 5: 12 %',
    tier10: 'After visit 10: 15 %',
    tier_lasts: 'Discount valid 12 months from your last visit',
    morningH: 'Morning discount',
    cur: 'CZK',
    morningIntro: '300 CZK off any 60+ minute program when you arrive 10:00–13:00 (Mon–Fri).',
    monFri: 'Monday — Friday',
    minProgram: 'Minimum 60-minute program',
    birthdayH: 'Birthday discount',
    birthdayIntro: 'On your birthday or within 7 days you receive 20 % off any program.',
    onceYearly: 'Once per year',
    mentionBirthday: 'Please mention your birth date when booking',
  },
  de: {
    loyaltyH: 'Treueprogramm',
    loyaltyIntro: 'Stammkunden erhalten automatisch einen Rabatt. Je häufiger Sie zu Gast sind, desto höher der Vorteil.',
    tier3: 'Nach 3 Besuchen: 10 %',
    tier5: 'Nach 5 Besuchen: 12 %',
    tier10: 'Nach 10 Besuchen: 15 %',
    tier_lasts: 'Rabatt gilt 12 Monate ab Ihrem letzten Besuch',
    morningH: 'Morgenrabatt',
    cur: 'CZK',
    morningIntro: '300 CZK Rabatt auf Programme ab 60 Minuten bei Ankunft 10:00–13:00 (Mo–Fr).',
    monFri: 'Montag — Freitag',
    minProgram: 'Mindestens 60-Minuten-Programm',
    birthdayH: 'Geburtstagsrabatt',
    birthdayIntro: 'Am Geburtstag oder innerhalb von 7 Tagen erhalten Sie 20 % auf jedes Programm.',
    onceYearly: '1× pro Jahr',
    mentionBirthday: 'Bitte erwähnen Sie Ihr Geburtsdatum bei der Buchung',
  },
  uk: {
    loyaltyH: 'Програма лояльності',
    loyaltyIntro: 'Постійні клієнти отримують знижку автоматично. Чим частіше ви до нас приходите, тим більший бонус.',
    tier3: 'Після 3 візитів: 10 %',
    tier5: 'Після 5 візитів: 12 %',
    tier10: 'Після 10 візитів: 15 %',
    tier_lasts: 'Знижка діє 12 місяців з моменту останнього візиту',
    morningH: 'Ранкова знижка',
    cur: 'CZK',
    morningIntro: 'Знижка 300 CZK на програму 60+ хвилин, якщо приходите 10:00–13:00 (Пн–Пт).',
    monFri: 'Понеділок — п\'ятниця',
    minProgram: 'Мінімум 60 хвилин',
    birthdayH: 'Знижка до дня народження',
    birthdayIntro: 'У день народження або протягом 7 днів отримуєте 20 % на будь-яку програму.',
    onceYearly: '1 раз на рік',
    mentionBirthday: 'Під час бронювання назвіть дату народження',
  },
};

function FallbackDiscountCards({ locale }: { locale: string }) {
  const F = FALLBACK[locale] ?? FALLBACK.en;
  return (
    <div className="discounts-grid">
      <div className="discount-card featured">
        <div className="discount-card-icon">⭐</div>
        <h3>{F.loyaltyH}</h3>
        <div className="discount-card-amount">10—15 <small>%</small></div>
        <p>{F.loyaltyIntro}</p>
        <ul className="discount-conditions">
          <li>{F.tier3}</li>
          <li>{F.tier5}</li>
          <li>{F.tier10}</li>
          <li>{F.tier_lasts}</li>
        </ul>
      </div>
      <div className="discount-card">
        <div className="discount-card-icon">🌅</div>
        <h3>{F.morningH}</h3>
        <div className="discount-card-amount">300 <small>{F.cur}</small></div>
        <p>{F.morningIntro}</p>
        <ul className="discount-conditions">
          <li>{F.monFri}</li>
          <li>10:00 — 13:00</li>
          <li>{F.minProgram}</li>
        </ul>
      </div>
      <div className="discount-card">
        <div className="discount-card-icon">🎂</div>
        <h3>{F.birthdayH}</h3>
        <div className="discount-card-amount">20 <small>%</small></div>
        <p>{F.birthdayIntro}</p>
        <ul className="discount-conditions">
          <li>{F.onceYearly}</li>
          <li>{F.mentionBirthday}</li>
        </ul>
      </div>
    </div>
  );
}
