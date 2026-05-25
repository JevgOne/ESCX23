import { Link } from '@/i18n/navigation';

interface Props {
  locale?: string;
}

interface Faq { q: string; a: string }
interface Bundle {
  heading: string;
  showAll: string;
  faqs: Faq[];
}

const T: Record<string, Bundle> = {
  cs: {
    heading: 'Časté dotazy ohledně cen',
    showAll: 'Zobrazit všechny časté dotazy →',
    faqs: [
      { q: 'Co je zahrnuto v ceně programu?', a: 'Cena pokrývá čas s vybranou společnicí v soukromém apartmánu, použití sprchy a diskrétní prostředí. Žádný extra poplatek za vstup nebo pronájem pokoje.' },
      { q: 'Přijímáte karty, nebo pouze hotovost?', a: 'Platba probíhá výhradně v hotovosti — Kč nebo EUR. Karty, převody ani jiné bezhotovostní platby nepřijímáme. Diskrétnost je u nás na prvním místě.' },
      { q: 'Jsou ceny pevné, nebo lze smlouvat?', a: 'Ceny programů jsou stanovené a veřejně transparentní. Smlouvání není zvykem. Slevy získáte v rámci věrnostního programu — viz stránka Slevy.' },
    ],
  },
  en: {
    heading: 'Pricing FAQ',
    showAll: 'See all FAQs →',
    faqs: [
      { q: 'What is included in the program price?', a: 'The price covers your time with the chosen companion in a private apartment, use of the shower and a discreet setting. No extra entry or room rental fee.' },
      { q: 'Do you accept cards, or only cash?', a: 'Payment is exclusively in cash — CZK or EUR. We do not accept cards, bank transfers or any other cashless payments. Discretion is our priority.' },
      { q: 'Are the prices fixed, or can they be negotiated?', a: 'Program prices are fixed and publicly transparent. Bargaining is not customary. Discounts are available through our loyalty program — see the Discounts page.' },
    ],
  },
  de: {
    heading: 'Häufige Fragen zu den Preisen',
    showAll: 'Alle Fragen ansehen →',
    faqs: [
      { q: 'Was ist im Programmpreis enthalten?', a: 'Der Preis umfasst Ihre Zeit mit der gewählten Begleiterin in einer privaten Wohnung, die Nutzung der Dusche und ein diskretes Ambiente. Keine zusätzliche Eintritts- oder Zimmergebühr.' },
      { q: 'Akzeptieren Sie Karten oder nur Bargeld?', a: 'Die Zahlung erfolgt ausschließlich in bar — CZK oder EUR. Karten, Überweisungen oder andere bargeldlose Zahlungen werden nicht akzeptiert. Diskretion steht an erster Stelle.' },
      { q: 'Sind die Preise fest oder verhandelbar?', a: 'Die Programmpreise sind festgelegt und öffentlich transparent. Feilschen ist nicht üblich. Rabatte erhalten Sie im Rahmen unseres Treueprogramms — siehe Seite Rabatte.' },
    ],
  },
  uk: {
    heading: 'Часті запитання про ціни',
    showAll: 'Подивитися всі запитання →',
    faqs: [
      { q: 'Що входить у вартість програми?', a: 'Ціна охоплює час із обраною супутницею у приватному апартаменті, користування душем та дискретне середовище. Жодних доплат за вхід чи оренду номера.' },
      { q: 'Ви приймаєте картки чи лише готівку?', a: 'Оплата виключно готівкою — CZK або EUR. Картки, перекази та інші безготівкові способи не приймаємо. Конфіденційність для нас на першому місці.' },
      { q: 'Ціни фіксовані чи можна торгуватися?', a: 'Ціни на програми фіксовані та публічно прозорі. Торг не прийнятий. Знижки доступні в межах програми лояльності — див. сторінку Знижки.' },
    ],
  },
};

export default function FaqTeaser({ locale = 'cs' }: Props) {
  const L = T[locale] ?? T.en;
  return (
    <div className="faq-teaser">
      <h2 className="section-h2" style={{ fontSize: '28px', marginBottom: '16px' }}>
        {L.heading}
      </h2>
      <div className="faq-list" style={{ marginBottom: '24px' }}>
        {L.faqs.map((f, i) => (
          <details key={i} className="faq-item">
            <summary>{f.q}</summary>
            <div className="faq-item-body">{f.a}</div>
          </details>
        ))}
      </div>
      <Link
        href="/faq"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--color-coral)',
          fontWeight: 600,
          fontSize: '14px',
        }}
      >
        {L.showAll}
      </Link>
    </div>
  );
}
