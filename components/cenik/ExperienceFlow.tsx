interface Step {
  icon: string;
  title: string;
  text: string;
}

interface FlowText {
  title: string;
  steps: Step[];
}

/** The site's own three steps, worded as on the homepage, with the payment
 *  detail added — on a pricing page that is the part people are unsure about. */
const T: Record<string, FlowText> = {
  cs: {
    title: '3 kroky k diskrétnímu setkání',
    steps: [
      { icon: '👀', title: 'Vyberte si společnici', text: 'Prohlédněte profily, fotografie a aktuální dostupnost.' },
      { icon: '💬', title: 'Napište nám', text: 'Pošlete zprávu přes WhatsApp nebo Telegram — odpovídáme do 5 minut.' },
      { icon: '🔑', title: 'Užijte si setkání', text: 'Obdržíte adresu apartmánu a přijdete v dohodnutý čas. Platíte až na místě, hotově.' },
    ],
  },
  en: {
    title: '3 steps to a discreet meeting',
    steps: [
      { icon: '👀', title: 'Pick a companion', text: 'Browse profiles, photos and live availability.' },
      { icon: '💬', title: 'Message us', text: 'Send a message on WhatsApp or Telegram — we reply within 5 minutes.' },
      { icon: '🔑', title: 'Enjoy the meeting', text: 'You get the apartment address and arrive at the agreed time. You pay on site, in cash.' },
    ],
  },
  de: {
    title: '3 Schritte zum diskreten Treffen',
    steps: [
      { icon: '👀', title: 'Begleiterin wählen', text: 'Profile, Fotos und Live-Verfügbarkeit ansehen.' },
      { icon: '💬', title: 'Nachricht senden', text: 'Schreiben Sie via WhatsApp oder Telegram — Antwort innerhalb von 5 Minuten.' },
      { icon: '🔑', title: 'Treffen genießen', text: 'Sie erhalten die Adresse und kommen zum vereinbarten Termin. Bezahlt wird vor Ort, in bar.' },
    ],
  },
  uk: {
    title: '3 кроки до дискретної зустрічі',
    steps: [
      { icon: '👀', title: 'Оберіть супутницю', text: 'Перегляньте профілі, фото та поточну доступність.' },
      { icon: '💬', title: 'Напишіть нам', text: 'Надішліть повідомлення у WhatsApp або Telegram — відповімо за 5 хвилин.' },
      { icon: '🔑', title: 'Насолоджуйтесь зустріччю', text: 'Отримаєте адресу апартаменту та прийдете у домовлений час. Оплата на місці, готівкою.' },
    ],
  },
};

export default function ExperienceFlow({ locale = 'cs' }: { locale?: string }) {
  const t = T[locale] ?? T.en;

  return (
    <div className="experience-flow-wrap">
      <h2 className="section-h2" style={{ fontSize: '28px', marginBottom: '24px' }}>{t.title}</h2>
      <div className="experience-flow">
        {t.steps.map((step, i) => (
          <div
            key={i}
            className={`experience-flow-step${i === t.steps.length - 1 ? ' experience-flow-step-peak' : ''}`}
          >
            <div className="experience-flow-icon">{step.icon}</div>
            <div className="experience-flow-pulse">
              <span className="experience-flow-pulse-num">{i + 1}</span>
            </div>
            <div className="experience-flow-text">
              <strong className="experience-flow-step-title">{step.title}</strong>
              {step.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
