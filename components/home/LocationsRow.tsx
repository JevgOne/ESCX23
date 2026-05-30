import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getActiveLocations } from '@/lib/queries';

interface LocationsRowProps {
  locale: string;
}

const PREPARING_LABEL: Record<string, string> = {
  cs: 'Připravujeme',
  en: 'Coming soon',
  de: 'In Vorbereitung',
  uk: 'Готується',
};

const PRIMARY_LABEL: Record<string, string> = {
  cs: 'Hlavní apartmán',
  en: 'Main apartment',
  de: 'Hauptwohnung',
  uk: 'Головна квартира',
};

export default async function LocationsRow({ locale }: LocationsRowProps) {
  const t = await getTranslations({ locale, namespace: 'homepage.locations' });
  const dbLocations = await getActiveLocations();

  if (dbLocations.length === 0) return null;

  const preparingLabel = PREPARING_LABEL[locale] ?? PREPARING_LABEL.en;
  const primaryLabel = PRIMARY_LABEL[locale] ?? PRIMARY_LABEL.en;
  const preparingSlugs = new Set(['praha-3', 'praha-5']);

  return (
    <section className="location-section" id="pobocky">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">— {t('eyebrow')}</div>
          <h2 className="section-h2">{t('h2')}</h2>
          <p className="section-sub">{t('sub')}</p>
        </div>
        <div className="loc-list">
          {dbLocations.map((loc) => {
            const isPreparing = preparingSlugs.has(loc.name);
            const displayParts = (loc.displayName ?? loc.name).split(', ');
            const districtName = displayParts[0] ?? loc.name;
            const prahaNum = displayParts[1] ?? loc.district ?? 'Praha';

            return (
              <Link
                key={loc.id}
                href={`/${locale}/pobocka/${loc.name}`}
                className={`loc-row-card${loc.isPrimary ? ' loc-row-primary' : ''}${isPreparing ? ' loc-row-preparing' : ''}`}
              >
                <div className="loc-row-pin">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="loc-row-info">
                  <div className="loc-row-name">
                    <span className="loc-row-district">{districtName}</span>
                    <span className="loc-row-praha">{prahaNum}</span>
                  </div>
                  {loc.isPrimary && (
                    <span className="loc-row-badge-primary">{primaryLabel}</span>
                  )}
                  {isPreparing && (
                    <span className="loc-row-badge-soon">{preparingLabel}</span>
                  )}
                </div>
                {!isPreparing && (
                  <div className="loc-row-hours">
                    <span className="loc-row-dot" />
                    10:00 — 22:30
                  </div>
                )}
                <div className="loc-row-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="locations-note">{t('address_after_booking')}</p>
      </div>
    </section>
  );
}
