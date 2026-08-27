import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { applyDBOverride } from '@/lib/seo/db-override';
import { getGirlsForListing, getTopServicesForFilter, getActivePricingPlans } from '@/lib/queries';
import { getSiteFacts, districtList } from '@/lib/site-facts';
import { verifiedCompanions } from '@/lib/plural';
import GirlCardGrid from '@/components/girl/GirlCardGrid';
import FiltersBar from '@/components/divky/FiltersBar';
// Pagination removed — show all girls on one page
import PageHeader from '@/components/ui/PageHeader';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { collectionPageJsonLd, breadcrumbListJsonLd } from '@/lib/seo/jsonld';
import { getCanonicalUrl, getAlternates, ogLocale } from '@/lib/seo/meta';

const APARTMENTS_LBL: Record<string, string> = {
  cs: 'Naše apartmány', en: 'Our apartments', de: 'Unsere Apartments', uk: 'Наші апартаменти',
};

/** Short answers to what people actually search before booking. */
const SEO_BLOCKS: Record<string, { h: string; body: string; href: string; cta: string }[]> = {
  cs: [
    { h: 'Jak domluvit schůzku', body: 'Vyberete dívku, napíšete na WhatsApp nebo zavoláte. Potvrdíme termín a pošleme adresu apartmánu. Žádná registrace, žádná záloha — platí se hotově až na místě.', href: '/kontakt', cta: 'Kontakt' },
    { h: 'Kolik to stojí', body: 'Programy od 30 do 120 minut. Cena je konečná a zahrnuje apartmán, žádné poplatky navíc se nepřipočítávají.', href: '/cenik', cta: 'Celý ceník' },
    { h: 'Kdo pracuje dnes', body: 'Rozvrh ukazuje den po dni, kdo má směnu, od kolika do kolika a ve kterém apartmánu. Aktualizuje se průběžně, takže vidíte reálnou dostupnost.', href: '/rozvrh', cta: 'Rozvrh' },
    { h: 'Ověřené fotky', body: 'Každá společnice prochází osobním pohovorem a verifikací fotek. Co je v profilu, to potkáte — proto u nás nenajdete profily bez schválení.', href: '/faq', cta: 'Časté dotazy' },
  ],
  en: [
    { h: 'How to arrange a meeting', body: 'Pick a companion, message us on WhatsApp or call. We confirm the time and send the apartment address. No registration, no deposit — you pay cash on arrival.', href: '/kontakt', cta: 'Contact' },
    { h: 'What it costs', body: 'Programs run from 30 to 120 minutes. The price is final and includes the apartment; nothing is added on top.', href: '/cenik', cta: 'Full pricing' },
    { h: 'Who is working today', body: 'The schedule lists every day: who is on shift, the hours and which apartment. It updates continuously, so what you see is real availability.', href: '/rozvrh', cta: 'Schedule' },
    { h: 'Verified photos', body: 'Every companion is interviewed in person and her photos are verified. Who you see in the profile is who you meet — no profile goes live unapproved.', href: '/faq', cta: 'FAQ' },
  ],
  de: [
    { h: 'So vereinbaren Sie einen Termin', body: 'Wählen Sie eine Begleiterin, schreiben Sie per WhatsApp oder rufen Sie an. Wir bestätigen den Termin und senden die Adresse. Keine Registrierung, keine Anzahlung — Barzahlung vor Ort.', href: '/kontakt', cta: 'Kontakt' },
    { h: 'Was es kostet', body: 'Programme von 30 bis 120 Minuten. Der Preis ist endgültig und beinhaltet das Apartment, ohne Zusatzgebühren.', href: '/cenik', cta: 'Preisliste' },
    { h: 'Wer heute arbeitet', body: 'Der Zeitplan zeigt Tag für Tag, wer Schicht hat, von wann bis wann und in welchem Apartment. Er wird laufend aktualisiert.', href: '/rozvrh', cta: 'Zeitplan' },
    { h: 'Verifizierte Fotos', body: 'Jede Begleiterin wird persönlich interviewt, ihre Fotos werden verifiziert. Wen Sie im Profil sehen, den treffen Sie auch.', href: '/faq', cta: 'FAQ' },
  ],
  uk: [
    { h: 'Як домовитися про зустріч', body: 'Оберіть супутницю, напишіть у WhatsApp або зателефонуйте. Ми підтвердимо час і надішлемо адресу апартаменту. Без реєстрації та передоплати — оплата готівкою на місці.', href: '/kontakt', cta: 'Контакт' },
    { h: 'Скільки це коштує', body: 'Програми від 30 до 120 хвилин. Ціна остаточна і включає апартамент, без додаткових зборів.', href: '/cenik', cta: 'Повний прайс' },
    { h: 'Хто працює сьогодні', body: 'Графік показує день за днем: хто на зміні, з котрої до котрої та в якому апартаменті. Оновлюється постійно.', href: '/rozvrh', cta: 'Графік' },
    { h: 'Перевірені фото', body: 'Кожна супутниця проходить особисту співбесіду та верифікацію фото. Кого бачите в профілі, ту і зустрінете.', href: '/faq', cta: 'FAQ' },
  ],
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; q?: string; sort?: string; service?: string; page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'girls' });
  const canonical = getCanonicalUrl(locale, '/divky');
  const languages = getAlternates('/divky');
  const { buildOgImages } = await import('@/lib/seo/og');
  const ogImages = await buildOgImages('divky', locale, '/divky', t('h1'));
  const { companionsCount } = await getSiteFacts();
  const sub = t('sub', { count: companionsCount });

  return applyDBOverride(`/${locale}/divky`, {
    title: t('h1'),
    description: sub,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      images: ogImages,
      title: t('h1'),
      description: sub,
      url: canonical,
      locale: ogLocale(locale),
    },
  });

}

export default async function DivkyPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'girls' });

  const { girls, total } = await getGirlsForListing({
    status: sp.status,
    q: sp.q,
    sort: sp.sort,
    service: sp.service,
    page: 1,
    pageSize: 999,
  }).catch(() => ({ girls: [] as Awaited<ReturnType<typeof getGirlsForListing>>['girls'], total: 0 }));

  const services = await getTopServicesForFilter(12).catch(() => []);
  // Same source as the footer trust strip — the SEO paragraph must not contradict it
  const facts = await getSiteFacts();
  const { companionsCount } = facts;
  const plans = await getActivePricingPlans().catch(() => []);
  const cheapest = plans.reduce<{ duration: number; price: number } | null>((min, p) => {
    const price = Number(p.price ?? 0);
    const duration = Number(p.duration ?? 0);
    if (!price || !duration) return min;
    return !min || price < min.price ? { duration, price } : min;
  }, null);
  const districts = districtList(facts, locale);
  const tGeo = await getTranslations({ locale, namespace: 'geo' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const collectionSchema = collectionPageJsonLd(
    t('h1'),
    getCanonicalUrl(locale, '/divky'),
    girls.map((g) => g.slug),
    locale
  );

  const breadcrumbSchema = breadcrumbListJsonLd([
    { name: tNav('girls'), url: getCanonicalUrl(locale, '/divky') },
  ]);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <p data-geo-lead className="sr-only">{tGeo('divky_lead', { count: companionsCount })}</p>
      <Breadcrumbs items={[{ label: tNav('girls') }]} locale={locale} />
      <PageHeader title={t('h1')} subtitle={t('sub', { count: companionsCount })} />

      {/* Quick category chips → SEO landing pages */}
      <div className="container">
        <nav className="divky-quick-tags" aria-label={locale === 'cs' ? 'Kategorie' : 'Categories'}>
          {(() => {
            const items = [
              { slug: 'spolecnice-praha', cs: 'Společnice Praha', en: 'Companions', de: 'Begleiterinnen', uk: 'Супутниці' },
              { slug: 'blondynky-praha', cs: 'Blondýnky', en: 'Blondes', de: 'Blondinen', uk: 'Блондинки' },
              { slug: 'brunetky-praha', cs: 'Brunetky', en: 'Brunettes', de: 'Brünette', uk: 'Брюнетки' },
              { slug: 'gfe-praha', cs: 'GFE', en: 'GFE', de: 'GFE', uk: 'GFE' },
              { slug: 'studentky-praha', cs: 'Studentky', en: 'Students', de: 'Studentinnen', uk: 'Студентки' },
              { slug: 'cernovlasky-praha', cs: 'Černovlásky', en: 'Dark hair', de: 'Schwarzhaarig', uk: 'Темне волосся' },
              { slug: 'prirodni-poprsi', cs: 'Přírodní poprsí', en: 'Natural', de: 'Natürlich', uk: 'Натуральні' },
              { slug: 'fit-holky', cs: 'Fit', en: 'Fit', de: 'Fit', uk: 'Підтягнуті' },
              { slug: 'elegantni-holky', cs: 'Elegantní', en: 'Elegant', de: 'Elegant', uk: 'Елегантні' },
              { slug: 'luxusni-sluzby', cs: 'Luxus', en: 'Luxury', de: 'Luxus', uk: 'Люкс' },
            ];
            const prefix = locale === 'en' ? '' : `/${locale}`;
            return items.map((tag) => (
              <a
                key={tag.slug}
                href={`${prefix}/hashtag/${tag.slug}`}
                className="divky-quick-tag"
              >
                #{tag[locale as 'cs' | 'en' | 'de' | 'uk'] ?? tag.cs}
              </a>
            ));
          })()}
        </nav>
      </div>

      <FiltersBar
        searchParams={sp}
        searchPlaceholder={t('search_placeholder')}
        labelAll={t('filter.all')}
        labelAvailable={t('filter.available')}
        sortNewest={t('sort.newest')}
        sortName={t('sort.name')}
        sortAvailableFirst={t('sort.available_first')}
        labelFilter={locale === 'cs' ? 'Filtrovat' : locale === 'de' ? 'Filtern' : locale === 'uk' ? 'Фільтр' : 'Filter'}
        services={services}
        locale={locale}
      />
      <div className="container">
        <div className="filter-results-bar">
          <span>
            <strong>{girls.length}</strong> {t('results_count', { count: girls.length })}
          </span>
        </div>
        {girls.length === 0 ? (
          <p className="no-results">{t('no_results')}</p>
        ) : (
          <GirlCardGrid girls={girls} priorityCount={4} />
        )}
        {/* All girls shown on single page */}
      </div>

      <section className="seo-content">
        <h2>{locale === 'cs' ? 'O naší agentuře' : locale === 'en' ? 'About our agency' : locale === 'de' ? 'Über unsere Agentur' : 'Про нашу агенцію'}</h2>
        <p>{locale === 'cs'
          ? `LovelyGirls je prémiová escort agentura v Praze s ${companionsCount} ověřenými společnicemi. Nabízíme setkání v diskrétních privátních apartmánech v centru Prahy — ${districts}. Všechny společnice procházejí osobním pohovorem a verifikací fotek. Otevřeno denně 10:00–22:30, rychlá rezervace přes WhatsApp.`
          : locale === 'en'
          ? `LovelyGirls is a premium escort agency in Prague with ${companionsCount} ${verifiedCompanions(companionsCount, 'en')}. We offer meetings in discreet private apartments in central Prague — ${districts}. All companions undergo personal interviews and photo verification. Open daily 10:00–22:30, instant WhatsApp booking.`
          : locale === 'de'
          ? `LovelyGirls ist eine Premium-Escort-Agentur in Prag mit ${companionsCount} verifizierten Begleiterinnen. Wir bieten Treffen in diskreten privaten Apartments im Zentrum von Prag — ${districts}. Alle Begleiterinnen durchlaufen ein persönliches Gespräch und Fotoverifizierung. Täglich geöffnet 10:00–22:30, sofortige WhatsApp-Buchung.`
          : `LovelyGirls — преміальна ескорт-агенція у Празі з ${companionsCount} перевіреними супутницями. Ми пропонуємо зустрічі в дискретних приватних апартаментах у центрі Праги — ${districts}. Усі супутниці проходять особисту співбесіду та верифікацію фото. Відкрито щодня 10:00–22:30, швидке бронювання через WhatsApp.`
        }</p>

        {/* Short answers to the questions people search before booking. One
            thin paragraph was not enough for a page drawing 5,400 impressions
            a quarter, and each block links onward to the page that owns it. */}
        <div className="seo-content-grid">
          {(SEO_BLOCKS[locale] ?? SEO_BLOCKS.en).map((blk) => (
            <div key={blk.h} className="seo-content-block">
              <h3>{blk.h}</h3>
              <p>
                {blk.body}
                {blk.href === '/cenik' && cheapest
                  ? ` ${locale === 'cs' ? 'Nejkratší program' : locale === 'de' ? 'Kürzestes Programm' : locale === 'uk' ? 'Найкоротша програма' : 'The shortest program is'} ${cheapest.duration} ${locale === 'en' ? 'min' : 'min'} — ${cheapest.price.toLocaleString(locale === 'en' ? 'en-US' : 'cs-CZ')} ${locale === 'cs' ? 'Kč' : 'CZK'}.`
                  : ''}
              </p>
              {/* Localised Link, not a hand-built href: /cenik on an English
                  page only 307s to /pricing, and this block renders on every
                  locale of the listing. */}
              <Link href={blk.href as '/cenik'} className="seo-content-more">
                {blk.cta} →
              </Link>
            </div>
          ))}
        </div>

        {/* Contextual links to the apartment pages. The footer already links
            them sitewide, but boilerplate links carry little weight — these sit
            in copy, on the page that actually ranks, with the district in the
            anchor text people search for. */}
        {facts.apartments.length > 0 && (
          <nav className="seo-content-links" aria-label={APARTMENTS_LBL[locale] ?? APARTMENTS_LBL.en}>
            {facts.apartments.map((a) => (
              <a
                key={a.slug}
                href={`${locale === 'en' ? '' : `/${locale}`}/pobocka/${a.slug}`}
                className="seo-content-link"
              >
                <strong>Escort {a.district ?? a.name}</strong>
                <span>{a.name}</span>
              </a>
            ))}
          </nav>
        )}
      </section>
    </main>
  );
}
