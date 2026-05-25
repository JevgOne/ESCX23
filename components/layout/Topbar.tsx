import { getTranslations } from 'next-intl/server';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { routing } from '@/i18n/routing';

interface TopbarProps {
  locale: string;
}

export default async function Topbar({ locale }: TopbarProps) {
  const t = await getTranslations('homepage.topbar');

  return (
    <div className="topbar">
      <div className="container topbar-inner">
        <div className="topbar-info">
          <span>
            <span className="open-dot" />
            {t('open_label')} · {t('hours')}
          </span>
          <span>✓ {t('verified')}</span>
          <span>🔒 {t('discreet')}</span>
        </div>
        <div className="topbar-actions">
          <LanguageSwitcher currentLocale={locale} />
          <span className="topbar-divider">·</span>
          <a href="tel:+420734332131" className="topbar-call-btn">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: 5 }}>
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
            {t('call_btn')}
          </a>
        </div>
      </div>
    </div>
  );
}
