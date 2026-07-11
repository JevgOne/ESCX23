import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { applyDBOverride } from '@/lib/seo/db-override';
import { redirect } from 'next/navigation';
import { getGirlsForDay, getActiveLocations, type GirlCard } from '@/lib/queries';
import { pragueDateISO, pragueDayOfWeek, type ShiftCategory } from '@/lib/utils';
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
  cs: 'Rozvrh společnic dnes — Kdo je k dispozici | LovelyGirls Praha',
  en: 'Companion Schedule Today — Who\'s Available | LovelyGirls Prague',
  de: 'Zeitplan Begleiterinnen heute — Verfügbarkeit | LovelyGirls Prag',
  uk: 'Розклад супутниць сьогодні — Хто доступний | LovelyGirls Прага',
};

const DESCRIPTIONS: Record<string, string> = {
  cs: 'Kdo dnes pracuje u LovelyGirls Praha? Rozvrh společnic na celý týden. Filtrujte podle pobočky. Aktualizováno v reálném čase.',
  en: 'Who\'s working at LovelyGirls Prague today? Weekly companion schedule. Filter by apartment location. Updated in real time.',
  de: 'Wer arbeitet heute bei LovelyGirls Prag? Wöchentlicher Zeitplan. Nach Apartment filtern. Echtzeit-Aktualisierung.',
  uk: 'Хто працює у LovelyGirls Прага сьогодні? Тижневий розклад. Фільтруйте за локацією. Оновлення в реальному часі.',
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

/**
 * Calendar week: always Mon–Sun.
 * Past days within the week are marked isPast (greyed out).
 * Resets every Monday at 00:01 Prague time.
 */
function generateWeekDays(today: string, locale: string) {
  const names = DAY_NAMES_SHORT[locale] ?? DAY_NAMES_SHORT.cs;
  const todayLabel = TODAY_LABEL[locale] ?? 'Dnes';
  const result = [];

  // Find Monday of the current week
  const todayDate = new Date(today + 'T12:00:00Z');
  const dow = pragueDayOfWeek(todayDate); // Mon=0 .. Sun=6
  const monday = new Date(todayDate);
  monday.setUTCDate(monday.getUTCDate() - dow);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const dayDow = i; // Mon=0 .. Sun=6
    const day = d.toLocaleString('cs-CZ', { timeZone: 'Europe/Prague', day: 'numeric' });
    const month = d.toLocaleString('cs-CZ', { timeZone: 'Europe/Prague', month: 'numeric' });
    const isToday = iso === today;
    // Skip past days — only show today and future days within the week
    if (iso < today) continue;
    result.push({
      iso,
      labelShort: isToday ? todayLabel : names[dayDow] ?? names[0],
      dayNum: `${day}.${month}.`,
      isToday,
      isPast: false,
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
  const { buildOgImages } = await import('@/lib/seo/og');
  const ogImages = await buildOgImages('rozvrh', locale, '/rozvrh', TITLES[locale] ?? TITLES.en);

  return applyDBOverride(`/${locale}/rozvrh`, {
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
      images: ogImages,
      title: TITLES[locale] ?? TITLES.en,
      description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.en,
      url: canonical,
      locale: ogLocale(locale),
    },
  });

}

export default async function RozvrhPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const today = pragueDateISO();

  // Calculate Mon–Sun boundaries of the current calendar week
  const todayDate = new Date(today + 'T12:00:00Z');
  const todayDow = pragueDayOfWeek(todayDate); // Mon=0 .. Sun=6
  const mondayDate = new Date(todayDate);
  mondayDate.setUTCDate(mondayDate.getUTCDate() - todayDow);
  const sundayDate = new Date(mondayDate);
  sundayDate.setUTCDate(sundayDate.getUTCDate() + 6);
  const mondayISO = mondayDate.toISOString().slice(0, 10);
  const sundayISO = sundayDate.toISOString().slice(0, 10);

  const requestedDay = sp.day ?? today;

  // Redirect: past days within the week → today, days outside the week → today
  if (requestedDay < today || requestedDay < mondayISO || requestedDay > sundayISO) {
    redirect(`/${locale}${CANONICAL_PATH[locale] ?? '/rozvrh'}`);
  }

  const locationParam = sp.location ?? 'all';

  const [girls, dbLocations] = await Promise.all([
    getGirlsForDay(requestedDay, locationParam !== 'all' ? locationParam : undefined).catch(() => []),
    getActiveLocations().catch(() => []),
  ]);

  const days = generateWeekDays(today, locale);

  const allLabel = locale === 'en' ? 'All locations' : locale === 'de' ? 'Alle Standorte' : locale === 'uk' ? 'Всі локації' : 'Všechny pobočky';
  const openLocations = dbLocations.filter((l) => !l.openingDate || l.openingDate <= today);
  const locations = [
    { slug: 'all', label: allLabel },
    ...openLocations.map((l) => ({
      slug: l.name,
      label: l.displayName,
    })),
  ];

  const totalGirls = await getGirlsForDay(today, undefined).catch(() => []);
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
            <ShiftGroupedGrid girls={girls} locale={locale} />
          ) : (
            <EmptyState message={NO_ONE[locale] ?? NO_ONE.cs} />
          )}
        </div>
      </section>
    </main>
  );
}

const GROUP_ORDER: ShiftCategory[] = ['morning', 'afternoon', 'allday', 'allevening', 'night'];

const GROUP_LABELS: Record<ShiftCategory, Record<string, string>> = {
  morning:    { cs: 'Ranní směna',       en: 'Morning shift',      de: 'Frühschicht',         uk: 'Ранкова зміна' },
  afternoon:  { cs: 'Odpolední směna',   en: 'Afternoon shift',    de: 'Nachmittagsschicht',  uk: 'Денна зміна' },
  allday:     { cs: 'Celodenní směna',   en: 'All-day shift',      de: 'Ganztagesschicht',    uk: 'Цілоденна зміна' },
  allevening: { cs: 'Celovečerní směna', en: 'All-evening shift',  de: 'Ganzabendschicht',    uk: 'Вечірня зміна' },
  night:      { cs: 'Noční směna',       en: 'Night shift',        de: 'Nachtschicht',        uk: 'Нічна зміна' },
};

function ShiftGroupedGrid({ girls, locale }: { girls: GirlCard[]; locale: string }) {
  const groups = new Map<ShiftCategory, GirlCard[]>();
  const ungrouped: GirlCard[] = [];
  for (const cat of GROUP_ORDER) groups.set(cat, []);

  for (const girl of girls) {
    if (girl.shiftCategory) {
      groups.get(girl.shiftCategory)!.push(girl);
    } else {
      ungrouped.push(girl);
    }
  }

  // If only one group has girls, render flat (no headings)
  const nonEmptyGroups = GROUP_ORDER.filter(cat => groups.get(cat)!.length > 0);
  if (nonEmptyGroups.length <= 1 && ungrouped.length === 0) {
    return <GirlCardGrid girls={girls} priorityCount={4} />;
  }

  let priorityRemaining = 4;
  return (
    <>
      {GROUP_ORDER.map(cat => {
        const catGirls = groups.get(cat)!;
        if (catGirls.length === 0) return null;
        const prio = priorityRemaining;
        priorityRemaining = Math.max(0, priorityRemaining - catGirls.length);
        return (
          <section key={cat} className="rozvrh-shift-group">
            <h2 className="rozvrh-group-heading">
              {(cat === 'night' || cat === 'allevening') && <span className="rozvrh-moon" aria-hidden="true">&#127769;</span>}
              {GROUP_LABELS[cat][locale] ?? GROUP_LABELS[cat].en}
              <span className="rozvrh-group-count">{catGirls.length}</span>
            </h2>
            <GirlCardGrid girls={catGirls} priorityCount={prio} />
          </section>
        );
      })}
      {ungrouped.length > 0 && (
        <GirlCardGrid girls={ungrouped} priorityCount={0} />
      )}
    </>
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
