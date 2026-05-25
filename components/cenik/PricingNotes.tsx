interface Props {
  locale?: string;
}

const T: Record<string, { heading: string; body: string }> = {
  cs: {
    heading: 'Platba v hotovosti',
    body: 'Platba probíhá na místě, v hotovosti — Kč nebo EUR. Žádné karty, žádné účtenky. Diskrétně a bez složitostí. Záloha se nevybírá.',
  },
  en: {
    heading: 'Cash payment',
    body: 'Payment is made on site, in cash — CZK or EUR. No cards, no receipts. Discreet and straightforward. No deposit required.',
  },
  de: {
    heading: 'Barzahlung',
    body: 'Die Zahlung erfolgt vor Ort in bar — CZK oder EUR. Keine Karten, keine Quittungen. Diskret und unkompliziert. Keine Anzahlung erforderlich.',
  },
  uk: {
    heading: 'Оплата готівкою',
    body: 'Оплата відбувається на місці готівкою — CZK або EUR. Без карток і чеків. Дискретно й без зайвих формальностей. Передоплата не потрібна.',
  },
};

export default function PricingNotes({ locale = 'cs' }: Props) {
  const L = T[locale] ?? T.en;
  return (
    <div className="payment-info" style={{ marginTop: '24px' }}>
      <div className="pay-icon">💵</div>
      <div className="payment-info-text">
        <h4>{L.heading}</h4>
        <p>{L.body}</p>
      </div>
    </div>
  );
}
