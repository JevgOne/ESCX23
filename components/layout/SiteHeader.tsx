import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import LogoMark from '@/components/ui/LogoMark';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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

        <nav className="main-nav">
          <Link href="/" data-nav="home">{t('home')}</Link>
          <Link href="/divky" data-nav="divky">{t('girls')}</Link>
          <Link href="/cenik" data-nav="cenik">{t('pricing')}</Link>
          <Link href="/rozvrh" data-nav="rozvrh">{t('schedule')}</Link>
          <Link href="/slevy" data-nav="slevy">{t('discounts')}</Link>
          <Link href="/faq" data-nav="faq">{t('faq')}</Link>
        </nav>

        <div className="header-langs">
          <LanguageSwitcher currentLocale={locale} />
        </div>

        <label htmlFor="nav-toggle" className="nav-toggle" aria-label={menuLabel}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <rect y="3" width="22" height="2" rx="1" fill="currentColor" />
            <rect y="10" width="22" height="2" rx="1" fill="currentColor" />
            <rect y="17" width="22" height="2" rx="1" fill="currentColor" />
          </svg>
        </label>
      </div>
    </header>
  );
}
