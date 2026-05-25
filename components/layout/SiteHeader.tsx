import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import LogoMark from '@/components/ui/LogoMark';

interface SiteHeaderProps {
  locale: string;
}

const LOGO_SUB: Record<string, string> = {
  cs: 'Praha · Privát',
  en: 'Prague · Private',
  de: 'Prag · Privat',
  uk: 'Прага · Приват',
};

const MENU_LABEL: Record<string, string> = {
  cs: 'Otevřít menu',
  en: 'Open menu',
  de: 'Menü öffnen',
  uk: 'Відкрити меню',
};

export default async function SiteHeader({ locale }: SiteHeaderProps) {
  const t = await getTranslations('nav');
  const logoSub = LOGO_SUB[locale] ?? LOGO_SUB.en;
  const menuLabel = MENU_LABEL[locale] ?? MENU_LABEL.en;

  return (
    <header className="header">
      <div className="container header-inner">
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

        <input type="checkbox" id="nav-toggle" className="nav-toggle-input" />

        <label htmlFor="nav-toggle" className="nav-toggle" aria-label={menuLabel}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <rect y="3" width="22" height="2" rx="1" fill="currentColor" />
            <rect y="10" width="22" height="2" rx="1" fill="currentColor" />
            <rect y="17" width="22" height="2" rx="1" fill="currentColor" />
          </svg>
        </label>

        <nav className="main-nav">
          <Link href="/" data-nav="home">{t('home')}</Link>
          <Link href="/divky" data-nav="divky">{t('girls')}</Link>
          <Link href="/cenik" data-nav="cenik">{t('pricing')}</Link>
          <Link href="/rozvrh" data-nav="rozvrh">{t('schedule')}</Link>
          <Link href="/slevy" data-nav="slevy">{t('discounts')}</Link>
          <Link href="/faq" data-nav="faq">{t('faq')}</Link>
        </nav>

        <div className="header-cta">
          <a
            href="https://t.me/+420734332131"
            className="btn btn-ghost"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="m9.78 18.65.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.24 3.64 11.95c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.27 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
            </svg>
            Telegram
          </a>
          <a
            href="https://wa.me/420734332131"
            className="btn btn-pink"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
            </svg>
            WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
