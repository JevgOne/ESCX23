interface Props {
  locale?: string;
}

const T: Record<string, { heading: string; body: React.ReactNode }> = {
  cs: {
    heading: 'Jak uplatnit slevu?',
    body: (
      <>
        Při domluvě přes WhatsApp nebo telefon stačí zmínit název slevy nebo důvod (např.&nbsp;
        <em>„narozeniny"</em>, <em>„doporučení od XY"</em>). Naši operátoři ji uplatní automaticky.
        Slevy se nesčítají — vždy platí ta nejvýhodnější.
      </>
    ),
  },
  en: {
    heading: 'How do I redeem a discount?',
    body: (
      <>
        When booking via WhatsApp or phone, simply mention the discount name or reason (e.g.&nbsp;
        <em>"birthday"</em>, <em>"referred by XY"</em>). Our operators will apply it automatically.
        Discounts cannot be combined — the most favourable one always applies.
      </>
    ),
  },
  de: {
    heading: 'Wie löse ich einen Rabatt ein?',
    body: (
      <>
        Bei der Buchung per WhatsApp oder Telefon erwähnen Sie einfach den Rabatt oder Anlass (z.&nbsp;B.&nbsp;
        <em>„Geburtstag"</em>, <em>„Empfehlung von XY"</em>). Unsere Operatoren berücksichtigen ihn automatisch.
        Rabatte sind nicht kombinierbar — es gilt stets der günstigere.
      </>
    ),
  },
  uk: {
    heading: 'Як скористатися знижкою?',
    body: (
      <>
        Під час бронювання у WhatsApp або телефоном просто згадайте назву знижки або підставу (наприклад&nbsp;
        <em>«день народження»</em>, <em>«рекомендація від XY»</em>). Наші оператори врахують її автоматично.
        Знижки не сумуються — діє завжди найвигідніша.
      </>
    ),
  },
};

export default function HowToUse({ locale = 'cs' }: Props) {
  const L = T[locale] ?? T.en;
  return (
    <div className="how-to-use">
      <h3 className="how-to-use-h">{L.heading}</h3>
      <p className="how-to-use-body">{L.body}</p>
    </div>
  );
}
