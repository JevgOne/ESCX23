import { getTranslations } from 'next-intl/server';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
        </div>
      </div>
    </div>
  );
}
