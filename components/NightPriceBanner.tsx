'use client';

import { useEffect, useState } from 'react';

const T: Record<string, { text: string; link: string }> = {
  cs: {
    text: 'V nočních hodinách (23:00\u201307:00) platí zvýšené ceny.',
    link: 'Zobrazit ceník',
  },
  en: {
    text: 'Higher rates apply during night hours (11 PM\u20137 AM).',
    link: 'View pricing',
  },
  de: {
    text: 'In den Nachtstunden (23:00\u201307:00) gelten erhöhte Preise.',
    link: 'Preise ansehen',
  },
  uk: {
    text: 'У нічний час (23:00\u201307:00) діють підвищені ціни.',
    link: 'Переглянути ціни',
  },
};

export default function NightPriceBanner({ locale }: { locale: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('nightPriceNotified') === '1') return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const L = T[locale] ?? T.cs;

  function dismiss() {
    sessionStorage.setItem('nightPriceNotified', '1');
    setVisible(false);
  }

  return (
    <div className="night-price-banner">
      <div className="night-price-banner-inner">
        <span className="night-price-banner-icon" aria-hidden="true">&#127769;</span>
        <span className="night-price-banner-text">{L.text}</span>
        <a href={`/${locale}/cenik`} className="night-price-banner-link">{L.link}</a>
        <button
          type="button"
          className="night-price-banner-close"
          onClick={dismiss}
          aria-label="Close"
        >
          &#10005;
        </button>
      </div>
    </div>
  );
}
