import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getActiveLocations } from '@/lib/queries';

interface LocationsRowProps {
  locale: string;
}

const FALLBACK_FEATURES: Record<string, { entrance: string; shower: string; quiet: string; parking: string; tram: string }> = {
  cs: { entrance: 'Soukromý vchod', shower: 'Sprcha & WC', quiet: 'Klidná lokalita', parking: 'Parking poblíž', tram: 'Tramvaj 50 m' },
  en: { entrance: 'Private entrance', shower: 'Shower & WC', quiet: 'Quiet location', parking: 'Parking nearby', tram: 'Tram 50 m' },
  de: { entrance: 'Privater Eingang', shower: 'Dusche & WC', quiet: 'Ruhige Lage', parking: 'Parken in der Nähe', tram: 'Tram 50 m' },
  uk: { entrance: 'Приватний вхід', shower: 'Душ і WC', quiet: 'Тихий район', parking: 'Парковка поруч', tram: 'Трамвай 50 м' },
};

const FALLBACK_SUBTITLE: Record<string, { metro: string; krizikova: string; centrum: string }> = {
  cs: { metro: 'u metra', krizikova: 'u metra Křižíkova', centrum: 'centrum' },
  en: { metro: 'near metro', krizikova: 'near Křižíkova metro', centrum: 'centre' },
  de: { metro: 'an der Metro', krizikova: 'an der Metro Křižíkova', centrum: 'Zentrum' },
  uk: { metro: 'біля метро', krizikova: 'біля метро Křižíkova', centrum: 'центр' },
};

function buildFallback(locale: string) {
  const F = FALLBACK_FEATURES[locale] ?? FALLBACK_FEATURES.en;
  const S = FALLBACK_SUBTITLE[locale] ?? FALLBACK_SUBTITLE.en;
  return [
    { name: 'Vinohrady', district: 'Praha 2', subtitle: S.metro, features: [F.entrance, F.shower, F.quiet], isMain: true },
    { name: 'Karlín', district: 'Praha 8', subtitle: S.krizikova, features: [F.entrance, F.shower, F.parking], isMain: false },
    { name: 'Nové Město', district: 'Praha 1', subtitle: S.centrum, features: [F.entrance, F.shower, F.tram], isMain: false },
  ];
}

export default async function LocationsRow({ locale }: LocationsRowProps) {
  const t = await getTranslations({ locale, namespace: 'homepage.locations' });
  const dbLocations = await getActiveLocations();

  const dbMapped = dbLocations.map((l, i) => ({
    slug: l.name,
    name: l.displayName ?? l.name,
    district: l.district ?? 'Praha',
    subtitle: '',
    features: [t('note')],
    isMain: i === 0,
  }));

  const locations: Array<{ slug?: string; name: string; district: string; subtitle: string; features: string[]; isMain: boolean }> =
    dbMapped.length > 0 ? dbMapped : buildFallback(locale);

  return (
    <section className="location-section" id="pobocky">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">— {t('eyebrow')}</div>
          <h2 className="section-h2">{t('h2')}</h2>
          <p className="section-sub">{t('sub')}</p>
        </div>
        <div className="locations-grid">
          {locations.map((loc) => {
            const href = loc.slug ? `/${locale}/pobocka/${loc.slug}` : `#pobocky`;
            const Wrapper = loc.slug ? Link : 'div';
            return (
            <Wrapper key={loc.name} href={href} className="location-card-mini location-card-link">
              <div className="location-photo">
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, var(--color-coral), var(--color-magenta))',
                    opacity: 0.6,
                  }}
                />
                {loc.isMain && (
                  <span className="location-photo-badge">{t('main_apartment')}</span>
                )}
              </div>
              <div className="location-card-mini-body">
                <div className="location-icon-row">
                  <div className="location-icon">📍</div>
                  <div>
                    <h3>{loc.name}</h3>
                    <div className="place">{loc.district}{loc.subtitle ? ` · ${loc.subtitle}` : ''}</div>
                  </div>
                </div>
                <div className="location-features">
                  {loc.features.map((f) => (
                    <span key={f}>✓ {f}</span>
                  ))}
                </div>
                <div className="location-hours-mini">
                  <span className="open-dot" />
                  10:00 — 22:30
                </div>
                {loc.slug && <span className="location-card-cta">{t('detail_cta')}</span>}
              </div>
            </Wrapper>
            );
          })}
        </div>
        <p className="locations-note">{t('address_after_booking')}</p>
      </div>
    </section>
  );
}
