import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocationBySlug, getActiveLocations } from '@/lib/queries';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { breadcrumbListJsonLd } from '@/lib/seo/jsonld';
import { getCanonicalUrl } from '@/lib/seo/meta';

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
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const loc = await getLocationBySlug(slug);
  if (!loc) return {};
  const M = META[locale] ?? META.en;
  return {
    title: M.title(loc.displayName),
    description: loc.description ?? M.description(loc.displayName),
  };
}

export default async function PobockaDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const loc = await getLocationBySlug(slug, locale);
  if (!loc) notFound();

  const L = T[locale] ?? T.en;
  const others = (await getActiveLocations()).filter((l) => l.name !== slug);
  const district = loc.district ?? L.cityFallback;

  const breadcrumbSchema = breadcrumbListJsonLd([
    { name: L.bcApartments, url: getCanonicalUrl(locale, '/') + '#pobocky' },
    { name: loc.displayName, url: getCanonicalUrl(locale, `/pobocka/${slug}`) },
  ]);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Breadcrumbs
        items={[
          { label: L.bcApartments, href: `/${locale}/#pobocky` },
          { label: loc.displayName },
        ]}
        locale={locale}
      />

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
              <div className="pobocka-cta-row">
                <a href="https://wa.me/420734332131" target="_blank" rel="noopener noreferrer" className="pobocka-cta pobocka-cta-wa">
                  {L.ctaWa}
                </a>
                <a href="tel:+420734332131" className="pobocka-cta pobocka-cta-call">
                  {L.ctaCall}
                </a>
              </div>
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
