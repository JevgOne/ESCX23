interface Props {
  locale?: string;
}

const TEXTS: Record<string, { title: string; note: string; price: string }> = {
  cs: {
    title: 'Extra služby',
    note: 'Zájmy a preference mají slečny uvedeny ve svých profilech, které si samy vyplnily. Ceny za extra služby si stanovily v rozmezí 500–1 000 Kč. Vše ostatní je na osobní domluvě.',
    price: '500–1 000 Kč',
  },
  en: {
    title: 'Extra services',
    note: 'The ladies have their interests and preferences listed in their profiles, which they filled in themselves. Extra service prices are set between 500–1,000 CZK. Everything else is a matter of personal agreement.',
    price: '500–1,000 CZK',
  },
  de: {
    title: 'Zusatzleistungen',
    note: 'Die Damen haben ihre Interessen und Vorlieben in ihren Profilen angegeben, die sie selbst ausgefüllt haben. Die Preise für Zusatzleistungen liegen zwischen 500–1.000 CZK. Alles Weitere ist Sache der persönlichen Vereinbarung.',
    price: '500–1.000 CZK',
  },
  uk: {
    title: 'Додаткові послуги',
    note: 'Інтереси та вподобання дівчата вказали у своїх профілях, які вони заповнили самостійно. Ціни на додаткові послуги встановлені в межах 500–1 000 CZK. Решта — за особистою домовленістю.',
    price: '500–1 000 CZK',
  },
};

export default function ExtrasGrid({ locale = 'cs' }: Props) {
  const t = TEXTS[locale] ?? TEXTS.cs;
  return (
    <div className="extras-note-card">
      <p className="extras-note-text">{t.note}</p>
      <div className="extras-note-price">
        <span className="extras-note-label">Extra:</span>
        <span className="extras-note-value">{t.price}</span>
      </div>
    </div>
  );
}
