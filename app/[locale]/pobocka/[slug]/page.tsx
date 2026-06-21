import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import { getLocationBySlug, getActiveLocations, getGirlsWithToday, getApartmentReviews, getApartmentRatingStats } from '@/lib/queries';
import { submitApartmentReview } from '@/lib/apartment-review-actions';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Link as I18nLink } from '@/i18n/navigation';
import { breadcrumbListJsonLd, localBusinessJsonLd, faqPageJsonLd, itemListPeopleJsonLd } from '@/lib/seo/jsonld';
import { getCanonicalUrl } from '@/lib/seo/meta';
import { getLocationContent } from '@/lib/seo/landing-content';
import { photoUrl } from '@/lib/photoUrl';
import { pragueDateISO, formatOpeningDate } from '@/lib/utils';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

interface MetaBundle { title: (n: string) => string; description: (n: string) => string }
const META: Record<string, MetaBundle> = {
  cs: {
    title: (n) => `Apartmán ${n} — LovelyGirls Praha`,
    description: (n) => `Diskrétní apartmán ${n} v Praze. Otevřeno denně 10:00 — 22:30.`,
  },
  en: {
    title: (n) => `${n} apartment — LovelyGirls Prague`,
    description: (n) => `Discreet ${n} apartment in Prague. Open daily 10:00 — 22:30.`,
  },
  de: {
    title: (n) => `Apartment ${n} — LovelyGirls Prag`,
    description: (n) => `Diskretes Apartment ${n} in Prag. Täglich 10:00 — 22:30 geöffnet.`,
  },
  uk: {
    title: (n) => `Апартамент ${n} — LovelyGirls Прага`,
    description: (n) => `Дискретний апартамент ${n} у Празі. Щодня 10:00 — 22:30.`,
  },
};

interface PageBundle {
  bcApartments: string;
  badgeMain: string;
  apartmentWord: string;
  cityFallback: string;
  subtitleMid: string;
  metaHours: string;
  metaLocation: string;
  metaDiscretion: string;
  metaPrivateEntrance: string;
  ctaWa: string;
  ctaCall: string;
  photoText: string;
  aboutH: string;
  defaultDesc: (district: string) => string;
  defaultFeatures: string[];
  inclEyebrow: string;
  inclH: string;
  inclIntro: string;
  inclTitle: string;
  inclItems: string[];
  inclCta: string;
  transportH: string;
  transportDefault: string;
  paymentH: string;
  paymentDefault: string;
  parkingH: string;
  parkingDefault: string;
  othersH: string;
  reviewsH: string;
  reviewsOf: string;
  reviewsCount: (n: number) => string;
  cleanlinessLbl: string;
  discretionLbl: string;
  comfortLbl: string;
  reviewFormH: string;
  reviewNameLbl: string;
  reviewNamePh: string;
  reviewRatingLbl: string;
  reviewCommentLbl: string;
  reviewCommentPh: string;
  reviewSubmit: string;
  reviewSent: string;
  reviewValidation: string;
  reviewRateLimit: string;
  starLabels: string[];
}

const T: Record<string, PageBundle> = {
  cs: {
    bcApartments: 'Apartmány',
    badgeMain: '★ Hlavní apartmán',
    apartmentWord: 'Apartmán',
    cityFallback: 'Praha',
    subtitleMid: 'diskrétní privát',
    metaHours: 'Otevírací doba',
    metaLocation: 'Lokace',
    metaDiscretion: 'Diskrétnost',
    metaPrivateEntrance: 'Soukromý vchod',
    ctaWa: 'Rezervace WhatsApp',
    ctaCall: 'Zavolat',
    photoText: 'Fotografie apartmánu',
    aboutH: 'O apartmánu',
    defaultDesc: (d) => `Plně vybavený diskrétní apartmán v lokalitě ${d}. Soukromý vchod, klidná lokalita, snadná dostupnost MHD.`,
    defaultFeatures: ['Soukromý vchod ze dvora', 'Plně zařízený byt', 'Sprcha & WC', 'Klimatizace', 'Wi-Fi', 'Diskrétní lokalita'],
    inclEyebrow: '— APARTMÁN V CENĚ',
    inclH: 'Vše je součástí rezervace',
    inclIntro: 'Apartmán nepronajímáme samostatně. Při rezervaci kterékoliv ze společnic je apartmán zahrnut v ceně — žádné skryté poplatky, vše připraveno.',
    inclTitle: 'K Vaší schůzce zahrnujeme:',
    inclItems: ['🛏️ Čerstvé lůžkoviny', '🧖 Ručníky & osušky', '🧼 Sprchové potřeby', '☕ Kávovar & nápoje', '🧹 Úklid mezi rezervacemi', '🔑 Bezkontaktní vstup'],
    inclCta: 'Vybrat společnici →',
    transportH: 'Doprava MHD',
    transportDefault: 'Výborná dostupnost — metro a tramvaj minutu pěšky.',
    paymentH: 'Platba',
    paymentDefault: 'Hotovost · Kč nebo EUR · žádné karty, plná diskrétnost.',
    parkingH: 'Možnost parkování',
    parkingDefault: 'Modré zóny v okolních ulicích, placené parkoviště do 2 minut.',
    othersH: 'Další apartmány',
    reviewsH: 'Hodnocení apartmánu',
    reviewsOf: 'z 5',
    reviewsCount: (n) => `${n} ${n === 1 ? 'hodnocení' : n < 5 ? 'hodnocení' : 'hodnocení'}`,
    cleanlinessLbl: 'Čistota',
    discretionLbl: 'Diskrétnost',
    comfortLbl: 'Komfort',
    reviewFormH: 'Ohodnoťte apartmán',
    reviewNameLbl: 'Vaše jméno',
    reviewNamePh: 'Jan',
    reviewRatingLbl: 'Celkové hodnocení',
    reviewCommentLbl: 'Váš komentář',
    reviewCommentPh: 'Napište svůj dojem z apartmánu...',
    reviewSubmit: 'Odeslat hodnocení',
    reviewSent: 'Děkujeme za hodnocení! Po schválení se zobrazí na stránce.',
    reviewValidation: 'Vyplňte prosím všechna povinná pole (jméno, hodnocení, komentář min. 10 znaků).',
    reviewRateLimit: 'Již jste odeslali hodnocení. Zkuste to znovu za 24 hodin.',
    starLabels: ['1 hvězda', '2 hvězdy', '3 hvězdy', '4 hvězdy', '5 hvězd'],
  },
  en: {
    bcApartments: 'Apartments',
    badgeMain: '★ Main apartment',
    apartmentWord: 'Apartment',
    cityFallback: 'Prague',
    subtitleMid: 'discreet private flat',
    metaHours: 'Opening hours',
    metaLocation: 'Location',
    metaDiscretion: 'Discretion',
    metaPrivateEntrance: 'Private entrance',
    ctaWa: 'WhatsApp booking',
    ctaCall: 'Call',
    photoText: 'Apartment photo',
    aboutH: 'About the apartment',
    defaultDesc: (d) => `Fully equipped discreet apartment in ${d}. Private entrance, quiet street, easy public transport access.`,
    defaultFeatures: ['Private entrance from the courtyard', 'Fully furnished flat', 'Shower & WC', 'Air conditioning', 'Wi-Fi', 'Discreet location'],
    inclEyebrow: '— APARTMENT INCLUDED',
    inclH: 'Everything is part of the booking',
    inclIntro: 'We do not rent the apartment separately. When you book any of our companions the apartment is included in the price — no hidden fees, everything ready.',
    inclTitle: 'Your appointment includes:',
    inclItems: ['🛏️ Fresh bed linen', '🧖 Towels & bath sheets', '🧼 Shower amenities', '☕ Coffee machine & drinks', '🧹 Cleaning between bookings', '🔑 Contactless entry'],
    inclCta: 'Choose a companion →',
    transportH: 'Public transport',
    transportDefault: 'Excellent access — metro and tram one minute on foot.',
    paymentH: 'Payment',
    paymentDefault: 'Cash · CZK or EUR · no cards, full discretion.',
    parkingH: 'Parking',
    parkingDefault: 'Blue zones in nearby streets, paid parking within 2 minutes.',
    othersH: 'Other apartments',
    reviewsH: 'Apartment reviews',
    reviewsOf: 'of 5',
    reviewsCount: (n) => `${n} ${n === 1 ? 'review' : 'reviews'}`,
    cleanlinessLbl: 'Cleanliness',
    discretionLbl: 'Discretion',
    comfortLbl: 'Comfort',
    reviewFormH: 'Rate this apartment',
    reviewNameLbl: 'Your name',
    reviewNamePh: 'John',
    reviewRatingLbl: 'Overall rating',
    reviewCommentLbl: 'Your comment',
    reviewCommentPh: 'Share your experience with this apartment...',
    reviewSubmit: 'Submit review',
    reviewSent: 'Thank you for your review! It will appear on the page after approval.',
    reviewValidation: 'Please fill in all required fields (name, rating, comment min. 10 characters).',
    reviewRateLimit: 'You have already submitted a review. Please try again in 24 hours.',
    starLabels: ['1 star', '2 stars', '3 stars', '4 stars', '5 stars'],
  },
  de: {
    bcApartments: 'Apartments',
    badgeMain: '★ Hauptapartment',
    apartmentWord: 'Apartment',
    cityFallback: 'Prag',
    subtitleMid: 'diskrete Privatwohnung',
    metaHours: 'Öffnungszeiten',
    metaLocation: 'Lage',
    metaDiscretion: 'Diskretion',
    metaPrivateEntrance: 'Privater Eingang',
    ctaWa: 'Buchung per WhatsApp',
    ctaCall: 'Anrufen',
    photoText: 'Foto des Apartments',
    aboutH: 'Über das Apartment',
    defaultDesc: (d) => `Vollausgestattetes diskretes Apartment in ${d}. Privater Eingang, ruhige Lage, gute Anbindung an den Nahverkehr.`,
    defaultFeatures: ['Privater Eingang vom Innenhof', 'Vollständig eingerichtete Wohnung', 'Dusche & WC', 'Klimaanlage', 'Wi-Fi', 'Diskrete Lage'],
    inclEyebrow: '— APARTMENT INKLUSIVE',
    inclH: 'Alles ist Teil der Buchung',
    inclIntro: 'Das Apartment vermieten wir nicht separat. Bei der Buchung einer unserer Begleiterinnen ist es im Preis enthalten — keine versteckten Kosten, alles vorbereitet.',
    inclTitle: 'In Ihrem Termin enthalten:',
    inclItems: ['🛏️ Frische Bettwäsche', '🧖 Hand- & Badetücher', '🧼 Duschartikel', '☕ Kaffeemaschine & Getränke', '🧹 Reinigung zwischen Terminen', '🔑 Kontaktloser Zutritt'],
    inclCta: 'Begleiterin wählen →',
    transportH: 'Öffentlicher Verkehr',
    transportDefault: 'Hervorragende Anbindung — Metro und Tram in einer Minute zu Fuß.',
    paymentH: 'Zahlung',
    paymentDefault: 'Bar · CZK oder EUR · keine Karten, volle Diskretion.',
    parkingH: 'Parkmöglichkeiten',
    parkingDefault: 'Blaue Zonen in den umliegenden Straßen, kostenpflichtiger Parkplatz in 2 Minuten erreichbar.',
    othersH: 'Weitere Apartments',
    reviewsH: 'Bewertungen des Apartments',
    reviewsOf: 'von 5',
    reviewsCount: (n) => `${n} ${n === 1 ? 'Bewertung' : 'Bewertungen'}`,
    cleanlinessLbl: 'Sauberkeit',
    discretionLbl: 'Diskretion',
    comfortLbl: 'Komfort',
    reviewFormH: 'Apartment bewerten',
    reviewNameLbl: 'Ihr Name',
    reviewNamePh: 'Max',
    reviewRatingLbl: 'Gesamtbewertung',
    reviewCommentLbl: 'Ihr Kommentar',
    reviewCommentPh: 'Teilen Sie Ihre Erfahrung mit diesem Apartment...',
    reviewSubmit: 'Bewertung absenden',
    reviewSent: 'Vielen Dank für Ihre Bewertung! Sie wird nach Genehmigung auf der Seite angezeigt.',
    reviewValidation: 'Bitte füllen Sie alle Pflichtfelder aus (Name, Bewertung, Kommentar mind. 10 Zeichen).',
    reviewRateLimit: 'Sie haben bereits eine Bewertung abgegeben. Bitte versuchen Sie es in 24 Stunden erneut.',
    starLabels: ['1 Stern', '2 Sterne', '3 Sterne', '4 Sterne', '5 Sterne'],
  },
  uk: {
    bcApartments: 'Апартаменти',
    badgeMain: '★ Головний апартамент',
    apartmentWord: 'Апартамент',
    cityFallback: 'Прага',
    subtitleMid: 'дискретна приватна квартира',
    metaHours: 'Години роботи',
    metaLocation: 'Локація',
    metaDiscretion: 'Конфіденційність',
    metaPrivateEntrance: 'Приватний вхід',
    ctaWa: 'Бронювання у WhatsApp',
    ctaCall: 'Зателефонувати',
    photoText: 'Фото апартаменту',
    aboutH: 'Про апартамент',
    defaultDesc: (d) => `Повністю облаштований дискретний апартамент у ${d}. Приватний вхід, тиха локація, зручний доступ міським транспортом.`,
    defaultFeatures: ['Приватний вхід із внутрішнього двору', 'Повністю обладнана квартира', 'Душ і WC', 'Кондиціонер', 'Wi-Fi', 'Дискретна локація'],
    inclEyebrow: '— АПАРТАМЕНТ У ВАРТОСТІ',
    inclH: 'Усе входить у бронювання',
    inclIntro: 'Апартамент окремо не здається. Під час бронювання будь-якої супутниці він уже включений у ціну — без прихованих платежів, усе готове.',
    inclTitle: 'У вашу зустріч входить:',
    inclItems: ['🛏️ Свіжа постільна білизна', '🧖 Рушники та банні простирадла', '🧼 Засоби для душу', '☕ Кавоварка та напої', '🧹 Прибирання між бронюваннями', '🔑 Безконтактний вхід'],
    inclCta: 'Обрати супутницю →',
    transportH: 'Громадський транспорт',
    transportDefault: 'Відмінна доступність — метро і трамвай за хвилину пішки.',
    paymentH: 'Оплата',
    paymentDefault: 'Готівка · CZK або EUR · без карток, повна конфіденційність.',
    parkingH: 'Паркування',
    parkingDefault: 'Сині зони на сусідніх вулицях, платне паркування за 2 хвилини.',
    othersH: 'Інші апартаменти',
    reviewsH: 'Відгуки про апартамент',
    reviewsOf: 'з 5',
    reviewsCount: (n) => `${n} ${n === 1 ? 'відгук' : n < 5 ? 'відгуки' : 'відгуків'}`,
    cleanlinessLbl: 'Чистота',
    discretionLbl: 'Конфіденційність',
    comfortLbl: 'Комфорт',
    reviewFormH: 'Оцініть апартамент',
    reviewNameLbl: 'Ваше ім\'я',
    reviewNamePh: 'Іван',
    reviewRatingLbl: 'Загальна оцінка',
    reviewCommentLbl: 'Ваш коментар',
    reviewCommentPh: 'Поділіться враженням від апартаменту...',
    reviewSubmit: 'Надіслати відгук',
    reviewSent: 'Дякуємо за відгук! Він з\'явиться на сторінці після схвалення.',
    reviewValidation: 'Будь ласка, заповніть усі обов\'язкові поля (ім\'я, оцінка, коментар мін. 10 символів).',
    reviewRateLimit: 'Ви вже надіслали відгук. Спробуйте знову через 24 години.',
    starLabels: ['1 зірка', '2 зірки', '3 зірки', '4 зірки', '5 зірок'],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const loc = await getLocationBySlug(slug).catch(() => null);
  if (!loc) return {};
  const M = META[locale] ?? META.en;
  const lc = getLocationContent(slug);
  const desc = lc?.metaDesc[locale as 'cs' | 'en' | 'de' | 'uk'] ?? M.description(loc.displayName);
  const canonical = getCanonicalUrl(locale, `/pobocka/${slug}`);
  return applyDBOverride(`/${locale}/pobocka/${slug}`, {
    title: M.title(loc.displayName),
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: M.title(loc.displayName),
      description: desc,
      url: canonical,
      type: 'website',
      locale: locale === 'cs' ? 'cs_CZ' : locale === 'de' ? 'de_DE' : locale === 'uk' ? 'uk_UA' : 'en_US',
    },
    robots: { index: true, follow: true },
  });

}

export default async function PobockaDetailPage({ params, searchParams }: Props & { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const loc = await getLocationBySlug(slug, locale).catch(() => null);
  if (!loc) notFound();

  /* Apartment reviews */
  const [reviews, ratingStats] = await Promise.all([
    getApartmentReviews(loc.id).catch(() => [] as Awaited<ReturnType<typeof getApartmentReviews>>),
    getApartmentRatingStats(loc.id).catch(() => ({ avgRating: 0, totalReviews: 0, avgCleanliness: null, avgDiscretion: null, avgComfort: null })),
  ]);

  const L = T[locale] ?? T.en;
  const others = (await getActiveLocations().catch(() => [])).filter((l) => l.name !== slug);
  const district = loc.district ?? L.cityFallback;
  const lc = getLocationContent(slug);
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lovelygirls.cz';
  const localePrefix = locale === 'en' ? '' : `/${locale}`;
  const canonical = getCanonicalUrl(locale, `/pobocka/${slug}`);

  /* JSON-LD blocks */
  const breadcrumbSchema = breadcrumbListJsonLd([
    { name: L.bcApartments, url: `${BASE}${localePrefix}/#pobocky` },
    { name: loc.displayName, url: canonical },
  ]);

  const localBusiness = localBusinessJsonLd({
    name: `LovelyGirls ${loc.displayName}`,
    url: canonical,
    description: loc.description ?? L.defaultDesc(district),
    streetAddress: loc.address ?? undefined,
    addressLocality: loc.city ?? 'Praha',
    postalCode: loc.postalCode ?? undefined,
    addressRegion: district,
    addressCountry: 'CZ',
    telephone: '+420734332131',
    priceRange: '$$$',
    openingHours: ['Mo-Su 10:00-22:30'],
    image: `${BASE}/og/default.jpg`,
    ratingValue: ratingStats.totalReviews > 0 ? ratingStats.avgRating : undefined,
    ratingCount: ratingStats.totalReviews > 0 ? ratingStats.totalReviews : undefined,
  });

  const faqJsonLd = lc && lc.faq.length > 0
    ? faqPageJsonLd(lc.faq.map((f) => ({
        q: f.q[locale as 'cs' | 'en' | 'de' | 'uk'] ?? f.q.cs,
        a: f.a[locale as 'cs' | 'en' | 'de' | 'uk'] ?? f.a.cs,
      })))
    : null;

  const today = pragueDateISO();
  const isUpcoming = loc.openingDate != null && loc.openingDate > today;

  const openingBanner: Record<string, { title: string; datePrefix: string }> = {
    cs: { title: 'Nový apartmán — otevíráme brzy!', datePrefix: 'Plánované otevření' },
    en: { title: 'New apartment — opening soon!', datePrefix: 'Planned opening' },
    de: { title: 'Neues Apartment — Eröffnung bald!', datePrefix: 'Geplante Eröffnung' },
    uk: { title: 'Новий апартамент — незабаром відкриття!', datePrefix: 'Планове відкриття' },
  };

  /* Show today's companions at this location */
  const allGirls = await getGirlsWithToday().catch(() => []);
  // Filter by district match
  const districtGirls = allGirls.filter((g) => {
    const gLoc = (g.location ?? '').toLowerCase();
    const districtLc = district.toLowerCase();
    const cityLc = (loc.city ?? 'praha').toLowerCase();
    return gLoc.includes(districtLc) || gLoc.includes(cityLc);
  });

  const girlsAtLocationLbl = locale === 'cs' ? 'Společnice v tomto apartmánu'
    : locale === 'de' ? 'Begleiterinnen in diesem Apartment'
    : locale === 'uk' ? 'Супутниці у цьому апартаменті'
    : 'Companions at this apartment';
  const chooseCompanionLbl = locale === 'cs' ? 'Vyber si společnici'
    : locale === 'de' ? 'Wähle deine Begleiterin'
    : locale === 'uk' ? 'Обери супутницю'
    : 'Choose your companion';
  const faqLbl = locale === 'cs' ? 'Časté dotazy o apartmánu'
    : locale === 'de' ? 'Häufige Fragen zum Apartment'
    : locale === 'uk' ? 'Часті питання про апартамент'
    : 'Apartment FAQ';
  const relatedHashtagsLbl = locale === 'cs' ? 'Populární kategorie zde'
    : locale === 'de' ? 'Beliebte Kategorien hier'
    : locale === 'uk' ? 'Популярні категорії тут'
    : 'Popular categories here';

  const itemList = districtGirls.length > 0
    ? itemListPeopleJsonLd(
        districtGirls.map((g) => ({
          slug: g.slug,
          name: g.name,
          url: `${BASE}${localePrefix}/${locale === 'en' ? 'profile' : 'profil'}/${g.slug}`,
          image: g.primaryPhoto ? photoUrl(g.primaryPhoto) : null,
        })),
        `${L.apartmentWord} ${loc.displayName} — ${girlsAtLocationLbl}`,
      )
    : null;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      {itemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
        />
      )}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <Breadcrumbs
        items={[
          { label: L.bcApartments, href: `/${locale}/#pobocky` },
          { label: loc.displayName },
        ]}
        locale={locale}
      />

      {isUpcoming && loc.openingDate && (
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="container">
            <div className="pobocka-opening-banner">
              <span className="pobocka-opening-icon">&#127881;</span>
              <div>
                <div className="pobocka-opening-title">
                  {(openingBanner[locale] ?? openingBanner.en).title}
                </div>
                <div className="pobocka-opening-date">
                  {(openingBanner[locale] ?? openingBanner.en).datePrefix}: {formatOpeningDate(loc.openingDate, locale)}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="pobocka-hero">
        <div className="pobocka-hero-bg" />
        <div className="container">
          <div className="pobocka-hero-grid">
            <div className="pobocka-hero-info">
              {loc.isPrimary && <span className="pobocka-badge">{L.badgeMain}</span>}
              <h1 className="pobocka-h1">
                {L.apartmentWord} <span className="accent">{loc.displayName}</span>
              </h1>
              <p className="pobocka-subtitle">
                {district} · {L.subtitleMid} · {loc.city}
              </p>
              <div className="pobocka-quick-meta">
                <div className="pobocka-meta-item">
                  <span className="pobocka-meta-icon">🕐</span>
                  <div>
                    <div className="pobocka-meta-label">{L.metaHours}</div>
                    <div className="pobocka-meta-value">{loc.hoursText}</div>
                  </div>
                </div>
                <div className="pobocka-meta-item">
                  <span className="pobocka-meta-icon">📍</span>
                  <div>
                    <div className="pobocka-meta-label">{L.metaLocation}</div>
                    <div className="pobocka-meta-value">{district}</div>
                  </div>
                </div>
                <div className="pobocka-meta-item">
                  <span className="pobocka-meta-icon">🔒</span>
                  <div>
                    <div className="pobocka-meta-label">{L.metaDiscretion}</div>
                    <div className="pobocka-meta-value">{L.metaPrivateEntrance}</div>
                  </div>
                </div>
              </div>
              {districtGirls.length > 0 && (
                <div className="pobocka-companions">
                  <div className="pobocka-companions-label">{chooseCompanionLbl}</div>
                  <div className="pobocka-companions-row">
                    {districtGirls.slice(0, 8).map((g) => (
                      <I18nLink
                        key={g.id}
                        href={{ pathname: '/profil/[slug]', params: { slug: g.slug } }}
                        className="pobocka-companion-circle"
                        title={g.name}
                      >
                        {g.primaryPhoto ? (
                          <img src={photoUrl(g.primaryPhoto)} alt={g.name} />
                        ) : (
                          <span className="pobocka-companion-initial">{g.name.charAt(0)}</span>
                        )}
                        <span className={`pobocka-companion-dot${g.status === 'working' ? ' dot-on' : g.status === 'later' ? ' dot-later' : ''}`} />
                      </I18nLink>
                    ))}
                  </div>
                  <Link href={`/${locale}/divky`} className="pobocka-companions-all">
                    {L.inclCta}
                  </Link>
                </div>
              )}
            </div>
            <div className="pobocka-hero-photo">
              <div className="pobocka-photo-placeholder">
                <span>🏠</span>
                <span className="pobocka-photo-text">{L.photoText}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pobocka-section">
        <div className="container">
          <div className="pobocka-grid-2col">
            <div className="pobocka-card">
              <h2 className="pobocka-card-h2">{L.aboutH}</h2>
              <p className="pobocka-card-text">
                {loc.description ?? L.defaultDesc(district)}
              </p>
              <ul className="pobocka-feature-list">
                {(loc.featuresText
                  ? loc.featuresText.split('\n').map((s) => s.trim()).filter(Boolean)
                  : L.defaultFeatures
                ).map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            </div>

            <div className="pobocka-card pobocka-card-pronajem">
              <span className="pobocka-card-eyebrow">{L.inclEyebrow}</span>
              <h2 className="pobocka-card-h2">{L.inclH}</h2>
              <p className="pobocka-card-text">{L.inclIntro}</p>
              <div className="pobocka-pronajem-includes">
                <div className="pobocka-include-title">{L.inclTitle}</div>
                <ul className="pobocka-include-list">
                  {L.inclItems.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
              <Link href={`/${locale}/divky`} className="pobocka-pronajem-cta">
                {L.inclCta}
              </Link>
            </div>
          </div>

          <div className="pobocka-info-grid">
            <div className="pobocka-info-card">
              <div className="pobocka-info-icon">🚇</div>
              <h3>{L.transportH}</h3>
              <p>{loc.transportText ?? L.transportDefault}</p>
            </div>
            <div className="pobocka-info-card">
              <div className="pobocka-info-icon">💳</div>
              <h3>{L.paymentH}</h3>
              <p>{loc.paymentText ?? L.paymentDefault}</p>
            </div>
            <div className="pobocka-info-card">
              <div className="pobocka-info-icon">🅿️</div>
              <h3>{L.parkingH}</h3>
              <p>{loc.parkingText ?? L.parkingDefault}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Related hashtag categories at this apartment */}
      {lc && lc.relatedHashtags.length > 0 && (
        <section className="pobocka-section">
          <div className="container">
            <h2 className="lp-h2" style={{ marginBottom: '16px' }}>{relatedHashtagsLbl}</h2>
            <div className="lp-related-chips" style={{ maxWidth: 720, margin: '0 auto' }}>
              {lc.relatedHashtags.map((h) => (
                <a key={h} href={`${localePrefix}/hashtag/${h}`} className="lp-related-chip">
                  #{h}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {lc && lc.faq.length > 0 && (
        <section className="pobocka-section">
          <div className="container">
            <h2 className="lp-h2">{faqLbl}</h2>
            <div className="lp-faq-list">
              {lc.faq.map((item, i) => (
                <details key={i} className="lp-faq-item">
                  <summary>{item.q[locale as 'cs' | 'en' | 'de' | 'uk'] ?? item.q.cs}</summary>
                  <p>{item.a[locale as 'cs' | 'en' | 'de' | 'uk'] ?? item.a.cs}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Apartment Reviews Section */}
      <section className="apt-section">
        <div className="container">
          {/* Hero stat strip */}
          {ratingStats.totalReviews > 0 && (
            <div className="apt-vibe-strip">
              <div className="apt-vibe-score">
                <span className="apt-vibe-emoji">{ratingStats.avgRating >= 4.5 ? '🔥' : ratingStats.avgRating >= 3.5 ? '💎' : '👍'}</span>
                <span className="apt-vibe-num">{ratingStats.avgRating}</span>
                <span className="apt-vibe-slash">/5</span>
              </div>
              <div className="apt-vibe-cats">
                {ratingStats.avgCleanliness != null && (
                  <div className="apt-vibe-cat">
                    <span className="apt-vibe-cat-emoji">✨</span>
                    <span className="apt-vibe-cat-label">{L.cleanlinessLbl}</span>
                    <span className="apt-vibe-cat-val">{ratingStats.avgCleanliness}</span>
                  </div>
                )}
                {ratingStats.avgDiscretion != null && (
                  <div className="apt-vibe-cat">
                    <span className="apt-vibe-cat-emoji">🤫</span>
                    <span className="apt-vibe-cat-label">{L.discretionLbl}</span>
                    <span className="apt-vibe-cat-val">{ratingStats.avgDiscretion}</span>
                  </div>
                )}
                {ratingStats.avgComfort != null && (
                  <div className="apt-vibe-cat">
                    <span className="apt-vibe-cat-emoji">🛋️</span>
                    <span className="apt-vibe-cat-label">{L.comfortLbl}</span>
                    <span className="apt-vibe-cat-val">{ratingStats.avgComfort}</span>
                  </div>
                )}
              </div>
              <div className="apt-vibe-count">{L.reviewsCount(ratingStats.totalReviews)}</div>
            </div>
          )}

          <h2 className="apt-vibe-h2">💬 {L.reviewsH}</h2>

          {/* Success / Error messages */}
          {sp.sent === 'ok' && (
            <div className="apt-review-msg apt-review-msg-ok">✅ {L.reviewSent}</div>
          )}
          {sp.error === 'validation' && (
            <div className="apt-review-msg apt-review-msg-err">⚠️ {L.reviewValidation}</div>
          )}
          {sp.error === 'ratelimit' && (
            <div className="apt-review-msg apt-review-msg-err">🚫 {L.reviewRateLimit}</div>
          )}

          {/* Reviews — quote cards */}
          {reviews.length > 0 && (
            <div className="apt-quotes">
              {reviews.map((r) => (
                <div key={r.id} className="apt-quote">
                  <div className="apt-quote-mark">"</div>
                  <p className="apt-quote-text">{r.content}</p>
                  <div className="apt-quote-footer">
                    <div className="apt-quote-avatar">{r.authorName.charAt(0).toUpperCase()}</div>
                    <div className="apt-quote-meta">
                      <span className="apt-quote-name">{r.authorName}</span>
                      <span className="apt-quote-date">{new Date(r.createdAt).toLocaleDateString(locale === 'cs' ? 'cs-CZ' : locale === 'de' ? 'de-DE' : locale === 'uk' ? 'uk-UA' : 'en-GB')}</span>
                    </div>
                    <div className="apt-quote-pill">
                      {r.rating >= 5 ? '🔥 Perfect' : r.rating >= 4 ? '💎 Great' : r.rating >= 3 ? '👌 Good' : '👍'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Review form */}
          {!isUpcoming && (
            <div className="apt-form-wrap">
              <h3 className="apt-form-title">✍️ {L.reviewFormH}</h3>
              <form action={submitApartmentReview} className="apt-review-form">
                <input type="hidden" name="location_id" value={loc.id} />
                <input type="hidden" name="location_slug" value={slug} />
                <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="apt-form-row">
                  <div className="apt-review-field">
                    <label htmlFor="author_name">{L.reviewNameLbl}</label>
                    <input id="author_name" name="author_name" type="text" required placeholder={L.reviewNamePh} className="apt-input" />
                  </div>
                  <div className="apt-review-field">
                    <label htmlFor="rating">{L.reviewRatingLbl}</label>
                    <select id="rating" name="rating" required className="apt-input">
                      <option value="">—</option>
                      <option value="5">🔥 Perfect (5)</option>
                      <option value="4">💎 Great (4)</option>
                      <option value="3">👌 Good (3)</option>
                      <option value="2">😐 Meh (2)</option>
                      <option value="1">👎 Bad (1)</option>
                    </select>
                  </div>
                </div>

                <div className="apt-review-subratings">
                  <div className="apt-review-field">
                    <label htmlFor="cleanliness">✨ {L.cleanlinessLbl}</label>
                    <select id="cleanliness" name="cleanliness" className="apt-input">
                      <option value="">—</option>
                      <option value="5">🔥 5</option>
                      <option value="4">💎 4</option>
                      <option value="3">👌 3</option>
                      <option value="2">😐 2</option>
                      <option value="1">👎 1</option>
                    </select>
                  </div>
                  <div className="apt-review-field">
                    <label htmlFor="discretion">🤫 {L.discretionLbl}</label>
                    <select id="discretion" name="discretion" className="apt-input">
                      <option value="">—</option>
                      <option value="5">🔥 5</option>
                      <option value="4">💎 4</option>
                      <option value="3">👌 3</option>
                      <option value="2">😐 2</option>
                      <option value="1">👎 1</option>
                    </select>
                  </div>
                  <div className="apt-review-field">
                    <label htmlFor="comfort">🛋️ {L.comfortLbl}</label>
                    <select id="comfort" name="comfort" className="apt-input">
                      <option value="">—</option>
                      <option value="5">🔥 5</option>
                      <option value="4">💎 4</option>
                      <option value="3">👌 3</option>
                      <option value="2">😐 2</option>
                      <option value="1">👎 1</option>
                    </select>
                  </div>
                </div>

                <div className="apt-review-field">
                  <label htmlFor="content">{L.reviewCommentLbl}</label>
                  <textarea id="content" name="content" required minLength={10} rows={4} placeholder={L.reviewCommentPh} className="apt-input" />
                </div>

                <button type="submit" className="apt-submit">{L.reviewSubmit} →</button>
              </form>
            </div>
          )}
        </div>
      </section>

      {others.length > 0 && (
        <section className="pobocka-others">
          <div className="container">
            <h2 className="pobocka-others-h2">{L.othersH}</h2>
            <div className="pobocka-others-grid">
              {others.map((o) => (
                <Link key={o.id} href={`/${locale}/pobocka/${o.name}`} className="pobocka-other-card">
                  <span className="pobocka-other-icon">🏠</span>
                  <div>
                    <div className="pobocka-other-name">{o.displayName}</div>
                    <div className="pobocka-other-district">{o.district ?? L.cityFallback}</div>
                  </div>
                  <span className="pobocka-other-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
