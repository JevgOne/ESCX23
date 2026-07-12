'use client';

import { useEffect, useState } from 'react';

const T: Record<string, { text: string; link: string }> = {
  cs: {
    text: 'V nočních hodinách (23:00–07:00) platí zvýšené ceny.',
    link: 'Zobrazit ceník',
  },
  en: {
    text: 'Higher rates apply during night hours (11 PM–7 AM).',
    link: 'View pricing',
  },
  de: {
    text: 'In den Nachtstunden (23:00–07:00) gelten erhöhte Preise.',
    link: 'Preise ansehen',
  },
  uk: {
    text: 'У нічний час (23:00–07:00) діють підвищені ціни.',
    link: 'Переглянути ціни',
  },
};

export default function NightPriceBanner({ locale }: { locale: string }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('nightPriceNotified') === '1') return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const L = T[locale] ?? T.cs;

  function dismiss() {
    setClosing(true);
    setTimeout(() => {
      sessionStorage.setItem('nightPriceNotified', '1');
      setVisible(false);
    }, 300);
  }

  return (
    <div className={`night-banner${closing ? ' night-banner--closing' : ''}`}>
      <div className="night-banner-inner">
        <div className="night-banner-glow" />
        <span className="night-banner-moon" aria-hidden="true">☾</span>
        <p className="night-banner-msg">
          {L.text}
          {' '}
          <a href={`/${locale}/cenik`} className="night-banner-cta">
            {L.link} →
          </a>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="night-banner-close"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
