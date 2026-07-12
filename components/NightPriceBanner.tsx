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
  const L = T[locale] ?? T.cs;

  return (
    <div className="night-banner">
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
      </div>
    </div>
  );
}
