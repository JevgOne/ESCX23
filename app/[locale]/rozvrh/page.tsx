import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getGirlsForDay, getActiveLocations } from '@/lib/queries';
import { pragueDateISO } from '@/lib/utils';
import { getCanonicalUrl, ogLocale } from '@/lib/seo/meta';
import { breadcrumbListJsonLd } from '@/lib/seo/jsonld';
import GirlCardGrid from '@/components/girl/GirlCardGrid';
import DayTabs from '@/components/rozvrh/DayTabs';
import LocationFilter from '@/components/rozvrh/LocationFilter';
import EmptyState from '@/components/rozvrh/EmptyState';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TITLES: Record<string, string> = {
  en: 'Schedule',
  cs: 'Rozvrh',
  de: 'Zeitplan',
  uk: 'Розклад',
};

const DESCRIPTIONS: Record<string, string> = {
  en: 'Who is available at LovelyGirls Prague today and this week. Filter by apartment location.',
  cs: 'Kdo je dnes a tento týden u LovelyGirls Praha k dispozici. Filtrujte podle pobočky.',
  de: 'Wer ist heute und diese Woche bei LovelyGirls Prag verfügbar. Nach Apartment filtern.',
  uk: 'Хто сьогодні і цього тижня доступний у LovelyGirls Прага. Фільтруйте за локацією.',
};

const CANONICAL_PATH: Record<string, string> = {
  cs: '/rozvrh',
  en: '/schedule',
  de: '/zeitplan',
  uk: '/rozklad',
};

const NO_ONE: Record<string, string> = {
  en: 'No one is scheduled for this day. Please check another day or contact us directly.',
  cs: 'Na tento den nikdo neplánuje. Zkuste jiný den nebo nás kontaktujte přímo.',
  de: 'Für diesen Tag ist niemand geplant. Wählen Sie einen anderen Tag oder kontaktieren Sie uns.',
  uk: 'На цей день ніхто не заплановано. Спробуйте інший день або зверніться до нас напряму.',
};

const DAY_NAMES_SHORT: Record<string, string[]> = {
  cs: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
};

const TODAY_LABEL: Record<string, string> = {
  cs: 'Dnes', en: 'Today', de: 'Heute', uk: 'Сьогодні',
};

function generate7Days(today: string, locale: string) {
  const names = DAY_NAMES_SHORT[locale] ?? DAY_NAMES_SHORT.cs;
  const todayLabel = TODAY_LABEL[locale] ?? 'Dnes';
  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const jsDay = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Prague' })).getDay();
    const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
    const day = d.toLocaleString('cs-CZ', { timeZone: 'Europe/Prague', day: 'numeric' });
    const month = d.toLocaleString('cs-CZ', { timeZone: 'Europe/Prague', month: 'numeric' });
    result.push({
      iso,
      labelShort: i === 0 ? todayLabel : names[dayIdx] ?? names[0],
      dayNum: `${day}.${month}.`,
      isToday: i === 0,
    });
  }
  return result;
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ day?: string; location?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const path = CANONICAL_PATH[locale] ?? '/rozvrh';
  const canonical = getCanonicalUrl(locale, path);
  const { getCustomOgImage } = await import('@/lib/seo/og');
  const _customOg_rozvrh = await getCustomOgImage('rozvrh');

  return {
    title: TITLES[locale] ?? TITLES.en,
    description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.en,
    robots: { index: true, follow: false },
    alternates: {
      canonical,
      languages: {
        cs: getCanonicalUrl('cs', '/rozvrh'),
        en: getCanonicalUrl('en', '/schedule'),
        de: getCanonicalUrl('de', '/zeitplan'),
        uk: getCanonicalUrl('uk', '/rozklad'),
        'x-default': getCanonicalUrl('en', '/schedule'),
      },
    },
    openGraph: {
      ...(_customOg_rozvrh ? { images: [{ url: _customOg_rozvrh, width: 1200, height: 630, alt: '' }] } : {}),
      title: TITLES[locale] ?? TITLES.en,
      description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.en,
      url: canonical,
      locale: ogLocale(locale),
    },
  };
}

export default async function RozvrhPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const today = pragueDateISO();
  const requestedDay = sp.day ?? today;

  if (requestedDay < today) {
    redirect(`/${locale}${CANONICAL_PATH[locale] ?? '/rozvrh'}`);
  }

  const locationParam = sp.location ?? 'all';

  const [girls, dbLocations] = await Promise.all([
    getGirlsForDay(requestedDay, locationParam !== 'all' ? locationParam : undefined),
    getActiveLocations(),
  ]);

  const days = generate7Days(today, locale);

  const allLabel = locale === 'en' ? 'All locations' : locale === 'de' ? 'Alle Standorte' : locale === 'uk' ? 'Всі локації' : 'Všechny pobočky';
  const locations = [
    { slug: 'all', label: allLabel },
    ...dbLocations.map((l) => ({
      slug: l.name,
      label: l.displayName,
    })),
  ];

  const totalGirls = await getGirlsForDay(today, undefined);
  const workingCount = girls.length;
  const geoLead = buildGeoLead(locale, requestedDay, workingCount, totalGirls.length);
  const basePath = `/${locale}${CANONICAL_PATH[locale] ?? '/rozvrh'}`;

  const rozvrhLabel = locale === 'en' ? 'Schedule' : locale === 'de' ? 'Zeitplan' : locale === 'uk' ? 'Розклад' : 'Rozvrh';
  const rozvrhPath = CANONICAL_PATH[locale] ?? '/rozvrh';
  const breadcrumbSchema = breadcrumbListJsonLd([
    { name: rozvrhLabel, url: getCanonicalUrl(locale, rozvrhPath) },
  ]);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Breadcrumbs
        items={[{ label: rozvrhLabel }]}
        locale={locale}
      />
      <section className="page-header">
        <div className="container">
          <h1>
            {locale === 'en' ? 'Schedule' : locale === 'de' ? 'Zeitplan' : locale === 'uk' ? 'Розклад' : 'Rozvrh'}
          </h1>
          <p>
            {locale === 'en'
              ? 'Who is available and when. Updated daily.'
              : locale === 'de'
                ? 'Wer ist wann verfügbar. Täglich aktualisiert.'
                : locale === 'uk'
                  ? 'Хто доступний і коли. Оновлюється щодня.'
                  : 'Kdo kdy pracuje. Aktualizujeme denně podle dostupnosti.'}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p data-geo-lead className="sr-only">{geoLead}</p>

          <LocationFilter
            locations={locations}
            activeLocation={locationParam}
            activeDay={requestedDay}
            basePath={basePath}
          />

          <DayTabs
            days={days}
            activeDay={requestedDay}
            location={locationParam}
            basePath={basePath}
          />

          {girls.length > 0 ? (
            <GirlCardGrid girls={girls} />
          ) : (
            <EmptyState message={NO_ONE[locale] ?? NO_ONE.cs} />
          )}
        </div>
      </section>
    </main>
  );
}

function buildGeoLead(locale: string, date: string, working: number, total: number): string {
  const d = new Date(date + 'T12:00:00Z');
  const dateStr = d.toLocaleDateString(
    locale === 'cs' ? 'cs-CZ' : locale === 'de' ? 'de-DE' : locale === 'uk' ? 'uk-UA' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Prague' }
  );
  if (locale === 'cs') return `Dne ${dateStr} je z ${total} společnic LovelyGirls Praha dostupných ${working} v rámci dne.`;
  if (locale === 'de') return `Am ${dateStr} sind ${working} von ${total} LovelyGirls-Prag-Begleiterinnen verfügbar.`;
  if (locale === 'uk') return `${dateStr} з ${total} супутниць LovelyGirls Прага доступно ${working}.`;
  return `On ${dateStr}, ${working} of ${total} LovelyGirls Prague companions are available.`;
}
