import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getGirlBySlug,
  getPhotosForGirl,
  getReviewsForGirl,
  getActivePricingPlans,
  getAllServices,
  getGirlServices,
  getGirlScheduleForToday,
  type ServiceRow,
} from '@/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { profilePersonJsonLd, breadcrumbListJsonLd } from '@/lib/seo/jsonld';
import { getProfileCanonical, getProfileAlternates, ogLocale } from '@/lib/seo/meta';
import ProfilHero from '@/components/profil/ProfilHero';
import ProfilDetails from '@/components/profil/ProfilDetails';
import ProfilGallery from '@/components/profil/ProfilGallery';
import ProfilServices from '@/components/profil/ProfilServices';
import ProfilPricing from '@/components/profil/ProfilPricing';
import ProfilReviews from '@/components/profil/ProfilReviews';
import ProfilStickyCta from '@/components/profil/ProfilStickyCta';
import VipGate from '@/components/profil/VipGate';
import SimilarGirls from '@/components/profil/SimilarGirls';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

/** Localized title suffix per locale. */
const PROFILE_TITLE_SUFFIX: Record<string, (name: string, age: number) => string> = {
  cs: (n, a) => `${n}, ${a} — Společnice Praha`,
  en: (n, a) => `${n}, ${a} — Companion Prague`,
  de: (n, a) => `${n}, ${a} — Begleiterin Prag`,
  uk: (n, a) => `${n}, ${a} — Супутниця Прага`,
};

/** Fallback description when no localized text is available. */
const PROFILE_FALLBACK_DESC: Record<string, (name: string, age: number) => string> = {
  cs: (n, a) => `${n}, ${a} let — ověřená společnice v Praze. Diskrétní apartmán, transparentní ceny. LovelyGirls Praha.`,
  en: (n, a) => `${n}, ${a} years old, verified companion in Prague. Discreet apartment, transparent pricing. LovelyGirls Prague.`,
  de: (n, a) => `${n}, ${a} Jahre alt, verifizierte Begleiterin in Prag. Diskretes Apartment, transparente Preise.`,
  uk: (n, a) => `${n}, ${a} років, перевірена супутниця у Празі. Дискретні апартаменти, прозорі ціни.`,
};

/** Pick first non-empty localized field with priority chain: meta_desc → og_desc → description → fallback locale → bio. */
function pickLocalizedText(
  girl: Record<string, unknown>,
  locale: string,
  fields: ('meta_description' | 'og_description' | 'description')[],
  fallbackLocales: string[] = ['en'],
): string {
  const allLocales = [locale, ...fallbackLocales];
  for (const loc of allLocales) {
    for (const field of fields) {
      const val = girl[`${field}_${loc}`];
      if (typeof val === 'string' && val.trim().length > 0) return val.trim();
    }
  }
  const bio = girl.bio;
  if (typeof bio === 'string' && bio.trim().length > 0) return bio.trim();
  return '';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const girl = await getGirlBySlug(slug);
  if (!girl) return {};
  const name = String(girl.name ?? '');
  const age = Number(girl.age ?? 0);
  const girlRec = girl as unknown as Record<string, unknown>;

  // Title — localized, e.g. "Anetta, 19 — Společnice Praha"
  const titleFn = PROFILE_TITLE_SUFFIX[locale] ?? PROFILE_TITLE_SUFFIX.en;
  const localizedTitle = titleFn(name, age);

  // Meta description — chain: meta_description_{loc} → og_description_{loc} → description_{loc} → EN fallback → bio → generic
  const metaDescRaw = pickLocalizedText(girlRec, locale, ['meta_description', 'og_description', 'description']);
  const fallbackFn = PROFILE_FALLBACK_DESC[locale] ?? PROFILE_FALLBACK_DESC.en;
  const metaDesc = metaDescRaw
    ? metaDescRaw.substring(0, 160)
    : fallbackFn(name, age);

  // OG description — priority: og_description_{loc} → meta_description_{loc} → description_{loc} → EN fallback → bio → generic
  const ogDescRaw = pickLocalizedText(girlRec, locale, ['og_description', 'meta_description', 'description']);
  const ogDesc = ogDescRaw ? ogDescRaw.substring(0, 200) : metaDesc;

  const canonical = getProfileCanonical(locale, slug);
  const languages = getProfileAlternates(slug);
  const status = String(girl.status ?? 'active');

  return {
    title: localizedTitle,
    description: metaDesc,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: localizedTitle,
      description: ogDesc,
      url: canonical,
      type: 'profile',
      locale: ogLocale(locale),
      // Next.js automatically picks up opengraph-image.tsx in this route; do not override here.
    },
    twitter: {
      card: 'summary_large_image',
      title: localizedTitle,
      description: ogDesc,
    },
    robots:
      status === 'active'
        ? { index: true, follow: true }
        : { index: false, follow: false },
  };
}

export default async function ProfilPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'profil' });

  const [girlRaw, currentUser] = await Promise.all([
    getGirlBySlug(slug),
    getCurrentUser(),
  ]);

  const [girl, photos, reviews, plans, allServices, girlServiceIds, todaySchedule] = await Promise.all([
    Promise.resolve(girlRaw),
    girlRaw ? getPhotosForGirl(Number(girlRaw.id)) : Promise.resolve([]),
    girlRaw ? getReviewsForGirl(Number(girlRaw.id), 6) : Promise.resolve([]),
    getActivePricingPlans(),
    getAllServices(),
    girlRaw ? getGirlServices(Number(girlRaw.id)) : Promise.resolve([]),
    girlRaw ? getGirlScheduleForToday(Number(girlRaw.id)) : Promise.resolve({ shiftFrom: null, shiftTo: null, scheduleLocation: null, scheduleAddress: null }),
  ]);
  // Only show services the girl actually offers (basic auto-included + extras she checked)
  const services = allServices.filter((s) => girlServiceIds.includes(Number(s.id)));

  if (!girl) notFound();

  const girlVip = Boolean((girl as Record<string, unknown>).vip);
  const isMember = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'girl';
  if (girlVip && !isMember) {
    return (
      <main>
        <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          <VipGate girlName={String(girl.name ?? '')} locale={locale} />
        </div>
      </main>
    );
  }

  const isPaused = String((girl as Record<string, unknown>).status ?? '') === 'inactive';

  const totalReviews = Number(girl.reviews_count ?? 0);

  type PhotoRow = { url: unknown; is_primary: unknown; id: unknown };
  type ReviewRow = { id: unknown; rating: unknown; content: unknown; author_name: unknown; created_at: unknown };
  type PlanRow = {
    id: unknown; duration: unknown; price: unknown; is_popular: unknown;
    title_cs: unknown; title_en: unknown; title_de: unknown; title_uk: unknown;
  };
  type GirlRow = {
    id: unknown; name: unknown; age: unknown; height: unknown; weight: unknown; bust: unknown;
    waist?: unknown; hips?: unknown; eyes: unknown; hair: unknown; location: unknown;
    rating: unknown; reviews_count: unknown;
    phone: unknown; bio?: unknown; description_cs?: unknown; description_en?: unknown;
    description_de?: unknown; description_uk?: unknown; verified?: unknown; created_at?: unknown;
    tattoo_percentage?: unknown; tattoo_description?: unknown; piercing?: unknown;
    bust_natural?: unknown; languages?: unknown; hashtags?: unknown;
  };

  const photoTyped = photos as unknown as PhotoRow[];
  const reviewTyped = reviews as unknown as ReviewRow[];
  const planTyped = plans as unknown as PlanRow[];
  const girlTyped = girl as unknown as GirlRow;
  const servicesTyped = services as ServiceRow[];

  const labels = {
    verified: t('verified'),
    bioLabel: t('bio_label'),
    heightLabel: t('height_label'),
    weightLabel: t('weight_label'),
    bustLabel: t('bust_label'),
    eyesLabel: t('eyes_label'),
    hairLabel: t('hair_label'),
    tattooLabel: t('body_art.tattoo'),
    piercingLabel: t('body_art.piercing'),
    tattooNone: t('body_art.tattoo_levels.none'),
    piercingNone: t('body_art.piercing_levels.none'),
    tattooLevels: {
      discreet: t('body_art.tattoo_levels.discreet'),
      visible: t('body_art.tattoo_levels.visible'),
      significant: t('body_art.tattoo_levels.significant'),
      full: t('body_art.tattoo_levels.full'),
    },
    piercingLevels: {
      ears: t('body_art.piercing_levels.ears'),
      multiple: t('body_art.piercing_levels.multiple'),
      body: t('body_art.piercing_levels.body'),
    },
    ctaWhatsapp: t('cta.whatsapp'),
    ctaTelegram: t('cta.telegram'),
    ctaCall: t('cta.call'),
    tabMiry: t('tabs.miry'),
    tabVzhled: t('tabs.vzhled'),
    tabSluzby: t('tabs.sluzby'),
    styl_h: t('styl_h'),
    styl_sub: t('styl_sub'),
    styl_note: t('styl_note', { name: String(girl.name ?? '') }),
    kde_h: t('kde_h'),
    kde_sub: t('kde_sub'),
    kde_address_note: t('kde_address_note'),
    jazyky_h: t('jazyky_h'),
    experience_h: t('experience_h'),
    experience_col_programy: t('experience_col_programy'),
    experience_col_spolecenske: t('experience_col_spolecenske'),
    experience_col_privatni: t('experience_col_privatni'),
    lang_level_native: t('lang_level_native'),
    lang_level_fluent: t('lang_level_fluent'),
    lang_level_basic: t('lang_level_basic'),
    acc: {
      section_miry: t('acc.section_miry'),
      section_vzhled: t('acc.section_vzhled'),
      section_sluzby: t('acc.section_sluzby'),
      height: t('acc.height'),
      weight: t('acc.weight'),
      bust: t('acc.bust'),
      waist: t('acc.waist'),
      hips: t('acc.hips'),
      bust_natural: t('acc.bust_natural'),
      bust_implant: t('acc.bust_implant'),
      eyes: t('acc.eyes'),
      hair: t('acc.hair'),
      tattoo: t('acc.tattoo'),
      piercing: t('acc.piercing'),
      yes: t('acc.yes'),
      no: t('acc.no'),
    },
  };

  const personSchema = profilePersonJsonLd(
    girl as unknown as Parameters<typeof profilePersonJsonLd>[0],
    photoTyped as unknown as Parameters<typeof profilePersonJsonLd>[1],
    reviewTyped as unknown as Parameters<typeof profilePersonJsonLd>[2]
  );

  const girlsLabel = locale === 'cs' ? 'Dívky' : locale === 'de' ? 'Mädchen' : locale === 'uk' ? 'Дівчата' : 'Girls';

  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lovelygirls.cz';
  const localePrefix = locale === 'en' ? '' : `/${locale}`;
  const profileSegment = locale === 'en' ? 'profile' : 'profil';
  const divkyTranslated = locale === 'en' ? 'girls' : locale === 'de' ? 'maedchen' : locale === 'uk' ? 'divchata' : 'divky';
  const breadcrumbSchema = breadcrumbListJsonLd([
    { name: girlsLabel, url: `${BASE}${localePrefix}/${divkyTranslated}` },
    { name: String(girl.name ?? ''), url: `${BASE}${localePrefix}/${profileSegment}/${slug}` },
  ]);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Breadcrumbs
        items={[
          { label: girlsLabel, href: `/${locale}/divky` },
          { label: String(girl.name ?? '') },
        ]}
        locale={locale}
      />
      {isPaused && (
        <div className="profil-paused-banner">
          {locale === 'cs'
            ? 'Tato společnice je momentálně nedostupná. Sledujte rozvrh nebo nás kontaktujte.'
            : locale === 'de'
              ? 'Diese Begleiterin ist derzeit nicht verfügbar. Bitte beachten Sie den Zeitplan oder kontaktieren Sie uns.'
              : locale === 'uk'
                ? 'Ця супутниця наразі недоступна. Слідкуйте за розкладом або зв\'яжіться з нами.'
                : 'This companion is temporarily unavailable. Please check the schedule or contact us.'}
        </div>
      )}
      <div className={`profile-shell${isPaused ? ' profile-shell-paused' : ''}`}>
        <div className="container">
          <div className="profile-grid">
            <ProfilHero
              girl={girlTyped}
              photos={photoTyped}
              verifiedLabel={labels.verified}
              locale={locale}
              shiftFrom={todaySchedule.shiftFrom}
              shiftTo={todaySchedule.shiftTo}
              scheduleLocation={todaySchedule.scheduleLocation}
              scheduleAddress={todaySchedule.scheduleAddress}
              topServices={servicesTyped.map((s) => {
                const key = `name_${locale}` as keyof typeof s;
                return { name: String(s[key] ?? s.name_en ?? s.slug ?? ''), category: String(s.category ?? 'basic') };
              }).filter((s) => s.name)}
              bio={(() => {
                const g = girl as unknown as Record<string, unknown>;
                if (locale === 'cs') return String(g.description_cs ?? g.bio ?? '');
                if (locale === 'de') return String(g.description_de ?? g.description_en ?? g.bio ?? '');
                if (locale === 'uk') return String(g.description_uk ?? g.description_en ?? g.bio ?? '');
                return String(g.description_en ?? g.bio ?? '');
              })()}
              personalMessage={(() => {
                const g = girl as unknown as Record<string, unknown>;
                return g.personal_message ? String(g.personal_message) : null;
              })()}
              voiceUrl={(() => {
                const g = girl as unknown as Record<string, unknown>;
                return g.voice_url ? String(g.voice_url) : null;
              })()}
              stylH={labels.styl_h}
              stylSub={labels.styl_sub}
              stylNote={labels.styl_note}
            />
            <ProfilDetails
              girl={girlTyped}
              locale={locale}
              labels={labels}
              shiftFrom={todaySchedule.shiftFrom}
              shiftTo={todaySchedule.shiftTo}
              services={servicesTyped}
              plans={planTyped as { id: unknown; duration: unknown; price: unknown }[]}
              altDistricts={[]}
              scheduleLocation={todaySchedule.scheduleLocation}
              scheduleAddress={todaySchedule.scheduleAddress}
              primaryPhotoUrl={(() => {
                const primary = photoTyped.find((p) => p.is_primary) ?? photoTyped[0];
                return primary?.url ? String(primary.url) : null;
              })()}
              personalMessage={(() => {
                const g = girl as unknown as Record<string, unknown>;
                return g.personal_message ? String(g.personal_message) : null;
              })()}
              voiceUrl={(() => {
                const g = girl as unknown as Record<string, unknown>;
                return g.voice_url ? String(g.voice_url) : null;
              })()}
            />
          </div>
        </div>

        <div className="container" style={{ marginTop: '48px' }}>
          {/* Services are now shown inline in ProfilDetails chips — full section removed */}
          <ProfilReviews
            reviews={reviewTyped}
            totalCount={totalReviews}
            girlSlug={slug}
            heading={t('reviews.h2')}
            showAllLabel={t('reviews.show_all', { count: totalReviews })}
            locale={locale}
            avgRating={Number(girl.rating ?? 0)}
            girlName={String(girl.name ?? '')}
            girlPhoto={(() => {
              const primary = photoTyped.find((p) => p.is_primary) ?? photoTyped[0];
              return primary?.url ? String(primary.url) : null;
            })()}
          />
        </div>

        <SimilarGirls currentSlug={slug} locale={locale} />
      </div>

      <ProfilStickyCta girl={girlTyped} labels={labels} shiftFrom={todaySchedule.shiftFrom} shiftTo={todaySchedule.shiftTo} locale={locale} scheduleLocation={todaySchedule.scheduleLocation} />
    </main>
  );
}
