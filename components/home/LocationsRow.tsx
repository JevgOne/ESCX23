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

export default async function LocationsRow({ locale }: LocationsRowProps) {
  const t = await getTranslations({ locale, namespace: 'homepage.locations' });
  const dbLocations = await getActiveLocations();

  if (dbLocations.length === 0) return null;

  const preparingLabel = PREPARING_LABEL[locale] ?? PREPARING_LABEL.en;
  // Praha 3 and Praha 5 are preparing — no girls scheduled there yet
  const preparingSlugs = new Set(['praha-3', 'praha-5']);

  return (
    <section className="location-section" id="pobocky">
      <div className="container">
        <div className="section-head">
          <div className="section-eyebrow">— {t('eyebrow')}</div>
          <h2 className="section-h2">{t('h2')}</h2>
          <p className="section-sub">{t('sub')}</p>
        </div>
        <div className="locations-grid">
          {dbLocations.map((loc) => {
            const isPreparing = preparingSlugs.has(loc.name);
            const displayParts = (loc.displayName ?? loc.name).split(', ');
            const districtName = displayParts[0] ?? loc.name;
            const prahaNum = displayParts[1] ?? loc.district ?? 'Praha';
            const href = `/${locale}/pobocka/${loc.name}`;

            return (
              <Link key={loc.id} href={href} className={`location-card-mini location-card-link${isPreparing ? ' location-card-preparing' : ''}`}>
                <div className="location-photo">
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: isPreparing
                        ? 'linear-gradient(135deg, #555, #888)'
                        : 'linear-gradient(135deg, var(--color-coral), var(--color-magenta))',
                      opacity: isPreparing ? 0.4 : 0.6,
                    }}
                  />
                  {loc.isPrimary && (
                    <span className="location-photo-badge">{t('main_apartment')}</span>
                  )}
                  {isPreparing && (
                    <span className="location-photo-badge location-badge-preparing">{preparingLabel}</span>
                  )}
                </div>
                <div className="location-card-mini-body">
                  <div className="location-icon-row">
                    <div className="location-icon">📍</div>
                    <div>
                      <h3>{districtName}</h3>
                      <div className="place">{prahaNum}</div>
                    </div>
                  </div>
                  {!isPreparing && (
                    <>
                      <div className="location-features">
                        <span>✓ {t('note')}</span>
                      </div>
                      <div className="location-hours-mini">
                        <span className="open-dot" />
                        10:00 — 22:30
                      </div>
                    </>
                  )}
                  {isPreparing && (
                    <div className="location-features" style={{ opacity: 0.5 }}>
                      <span>{preparingLabel}…</span>
                    </div>
                  )}
                  <span className="location-card-cta">{isPreparing ? preparingLabel : t('detail_cta')}</span>
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
