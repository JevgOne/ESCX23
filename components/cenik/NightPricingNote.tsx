const T: Record<string, { heading: string; body: string }> = {
  cs: {
    heading: 'Noční ceny',
    body: 'V nočních hodinách (od 23:00) platí zvýšené ceny. Noční cena je uvedena u každého programu.',
  },
  en: {
    heading: 'Night pricing',
    body: 'Higher rates apply during night hours (from 11 PM). Night prices are shown on each program.',
  },
  de: {
    heading: 'Nachtpreise',
    body: 'In den Nachtstunden (ab 23:00 Uhr) gelten erhöhte Preise. Der Nachtpreis ist bei jedem Programm angegeben.',
  },
  uk: {
    heading: 'Нічні ціни',
    body: 'У нічний час (з 23:00) діють підвищені ціни. Нічна ціна вказана біля кожної програми.',
  },
};

export default function NightPricingNote({ locale = 'cs' }: { locale?: string }) {
  const L = T[locale] ?? T.cs;
  return (
    <div className="night-pricing-note">
      <span className="night-pricing-icon" aria-hidden="true">&#127769;</span>
      <div>
        <h4>{L.heading}</h4>
        <p>{L.body}</p>
      </div>
    </div>
  );
}
