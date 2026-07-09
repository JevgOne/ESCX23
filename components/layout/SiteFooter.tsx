import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import LogoMark from '@/components/ui/LogoMark';
import { getActiveLocations, getFooterStats } from '@/lib/queries';
import { pragueDateISO } from '@/lib/utils';

const LOGO_SUB: Record<string, string> = {
  cs: 'Praha · Privát',
  en: 'Prague · Private',
  de: 'Prag · Privat',
  uk: 'Прага · Приват',
};

const TRUST: Record<string, { verified: string; discreet: string; hours: string; companions: string; apartments: string; openLbl: string }> = {
  cs: { verified: 'Ověřené', discreet: 'Diskrétně', hours: '10:00–22:30', companions: 'společnic', apartments: 'apartmán', openLbl: 'denně' },
  en: { verified: 'Verified', discreet: 'Discreet', hours: '10:00–22:30', companions: 'companions', apartments: 'apartment', openLbl: 'daily' },
  de: { verified: 'Verifiziert', discreet: 'Diskret', hours: '10:00–22:30', companions: 'Begleiterinnen', apartments: 'Apartment', openLbl: 'täglich' },
  uk: { verified: 'Перевірено', discreet: 'Конфіденційно', hours: '10:00–22:30', companions: 'супутниць', apartments: 'апартамент', openLbl: 'щодня' },
};

const LOCATIONS_LBL: Record<string, string> = { cs: 'Apartmány', en: 'Apartments', de: 'Apartments', uk: 'Апартаменти' };

function pluralizeApartments(n: number, locale: string): string {
  if (locale === 'cs') return n === 1 ? 'apartmán' : (n >= 2 && n <= 4 ? 'apartmány' : 'apartmánů');
  if (locale === 'en') return n === 1 ? 'apartment' : 'apartments';
  if (locale === 'de') return n === 1 ? 'Apartment' : 'Apartments';
  if (locale === 'uk') return n === 1 ? 'апартамент' : (n >= 2 && n <= 4 ? 'апартаменти' : 'апартаментів');
  return 'apartments';
}

function pluralizeCompanions(n: number, locale: string): string {
  if (locale === 'cs') return n === 1 ? 'společnice' : (n >= 2 && n <= 4 ? 'společnice' : 'společnic');
  if (locale === 'en') return n === 1 ? 'companion' : 'companions';
  if (locale === 'de') return n === 1 ? 'Begleiterin' : 'Begleiterinnen';
  if (locale === 'uk') return n === 1 ? 'супутниця' : (n >= 2 && n <= 4 ? 'супутниці' : 'супутниць');
  return 'companions';
}

export default async function SiteFooter() {
  const t = await getTranslations('footer');
  const nav = await getTranslations('nav');
  const locale = await getLocale();
  const logoSub = LOGO_SUB[locale] ?? LOGO_SUB.en;
  const trust = TRUST[locale] ?? TRUST.en;
  const locationsLbl = LOCATIONS_LBL[locale] ?? LOCATIONS_LBL.en;

  const [locations, stats] = await Promise.all([
    getActiveLocations().catch(() => []),
    getFooterStats(),
  ]);
  const localePrefix = locale === 'en' ? '' : `/${locale}`;

  return (
    <footer id="footer">
      <div className="container">
        {/* Trust strip — real numbers from DB */}
        <div className="footer-trust">
          {stats.companionsCount > 0 && (
            <div className="footer-trust-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 12l2 2 4-4" /><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <div>
                <div className="ftrust-num">{stats.companionsCount}</div>
                <div className="ftrust-lbl">{pluralizeCompanions(stats.companionsCount, locale)}</div>
              </div>
            </div>
          )}
          {stats.locationsCount > 0 && (
            <div className="footer-trust-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <div>
                <div className="ftrust-num">{stats.locationsCount}</div>
                <div className="ftrust-lbl">{pluralizeApartments(stats.locationsCount, locale)}</div>
              </div>
            </div>
          )}
          <div className="footer-trust-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <div className="ftrust-num">{trust.hours}</div>
              <div className="ftrust-lbl">{trust.openLbl}</div>
            </div>
          </div>
          <div className="footer-trust-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div>
              <div className="ftrust-num">100%</div>
              <div className="ftrust-lbl">{trust.discreet}</div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <div className="logo-mark">
                <LogoMark size={44} />
              </div>
              <div className="logo-text">
                <div className="logo-name">
                  Lovely<span className="accent">Girls</span>
                </div>
                <div className="logo-sub">{logoSub}</div>
              </div>
            </Link>
            <p>{t('brand_desc')}</p>
          </div>

          <div className="footer-col">
            <h4>{t('pages_heading')}</h4>
            <ul>
              <li><Link href="/divky">{nav('girls')}</Link></li>
              <li><Link href="/cenik">{nav('pricing')}</Link></li>
              <li><Link href="/rozvrh">{nav('schedule')}</Link></li>
              <li><Link href="/slevy">{nav('discounts')}</Link></li>
              <li><Link href="/faq">{nav('faq')}</Link></li>
              <li><Link href="/blog">{nav('blog')}</Link></li>
            </ul>
          </div>

          {locations.length > 0 && (() => {
            const todayStr = pragueDateISO();
            const soonLbl = locale === 'en' ? 'soon' : locale === 'de' ? 'bald' : locale === 'uk' ? 'скоро' : 'brzy';
            return (
              <div className="footer-col">
                <h4>{locationsLbl}</h4>
                <ul>
                  {locations.map((loc) => {
                    const isUpcoming = loc.openingDate != null && loc.openingDate > todayStr;
                    const label = `${loc.city ?? 'Praha'}${loc.district ? ` · ${loc.district}` : ''}${loc.displayName && loc.displayName !== loc.district ? ` (${loc.displayName})` : ''}`;
                    return (
                      <li key={loc.id}>
                        <a href={`${localePrefix}/pobocka/${loc.name}`}>
                          {label}{isUpcoming ? ` — ${loc.openingDate ? new Date(loc.openingDate + 'T00:00:00').toLocaleDateString(locale === 'cs' ? 'cs-CZ' : locale === 'de' ? 'de-DE' : locale === 'uk' ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' }) : soonLbl}` : ''}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })()}
        </div>

        <p className="footer-disclaimer">{t('disclaimer')}</p>

        <a href="https://eroguide.cz/lovely-girls" target="_blank" rel="noopener noreferrer" className="footer-partner-badge">
          <img src="https://eroguide.cz/api/media/file/163x48.webp" alt="Lovely Girls - Eroguide.cz" title="Lovely Girls - Eroguide.cz" width={163} height={48} loading="lazy" />
        </a>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span className="footer-copy">{t('brand_copy', { year: '2026' })}</span>
            <span className="footer-dot">·</span>
            <span className="age-badge">18+</span>
            <span className="footer-dot">·</span>
            <Link href="/soukromi" className="footer-bottom-link">{nav('privacy')}</Link>
            <span className="footer-dot">·</span>
            <span className="footer-discreet">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: 4 }}>
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              {t('age_disclaimer')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
