import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import LogoMark from '@/components/ui/LogoMark';

const LOGO_SUB: Record<string, string> = {
  cs: 'Praha · Privát',
  en: 'Prague · Private',
  de: 'Prag · Privat',
  uk: 'Прага · Приват',
};

export default async function SiteFooter() {
  const t = await getTranslations('footer');
  const nav = await getTranslations('nav');
  const locale = await getLocale();
  const logoSub = LOGO_SUB[locale] ?? LOGO_SUB.en;

  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <div className="logo-mark">
                <LogoMark size={40} />
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
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t('contact_heading')}</h4>
            <div className="footer-contact-buttons">
              <a href="tel:+420734332131" className="footer-cta-btn footer-cta-btn-call">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
                {t('call_btn')}
              </a>
              <a href="https://wa.me/420734332131" target="_blank" rel="noopener noreferrer" className="footer-cta-btn footer-cta-btn-wa">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
                </svg>
                WhatsApp
              </a>
              <a href="https://t.me/+420734332131" target="_blank" rel="noopener noreferrer" className="footer-cta-btn footer-cta-btn-tg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="m9.78 18.65.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.24 3.64 11.95c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.27 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
                </svg>
                Telegram
              </a>
            </div>
          </div>

        </div>

        <p className="footer-disclaimer">{t('disclaimer')}</p>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span className="footer-copy">{t('brand_copy', { year: '2026' })}</span>
            <span className="footer-dot">·</span>
            <span className="age-badge">18+</span>
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
