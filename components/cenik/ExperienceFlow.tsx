interface Step {
  icon: string;
  pulse: number;
  text: string;
}

interface FlowText {
  title: string;
  steps: Step[];
}

const T: Record<string, FlowText> = {
  cs: {
    title: 'Jak probíhá setkání',
    steps: [
      { icon: '🥂', pulse: 75, text: 'Přivítání v soukromém apartmánu — sklenka na uvolnění a chvíle na sebe.' },
      { icon: '🚿', pulse: 90, text: 'Společná sprcha, čas na sblížení, žádný spěch.' },
      { icon: '🔥', pulse: 130, text: 'Masáž a blízkost naplno, v tempu, které vám sedí.' },
      { icon: '🌙', pulse: 80, text: 'Klidné doznění a rozloučení bez spěchu.' },
    ],
  },
  en: {
    title: 'How a visit unfolds',
    steps: [
      { icon: '🥂', pulse: 75, text: 'A private welcome in the apartment — a drink to unwind and settle in.' },
      { icon: '🚿', pulse: 90, text: 'A shared shower, time to connect, no rush at all.' },
      { icon: '🔥', pulse: 130, text: 'Massage and closeness, at whatever pace feels right.' },
      { icon: '🌙', pulse: 80, text: 'A calm ending, a goodbye without hurry.' },
    ],
  },
  de: {
    title: 'So läuft ein Besuch ab',
    steps: [
      { icon: '🥂', pulse: 75, text: 'Private Begrüßung im Apartment — ein Drink zum Ankommen.' },
      { icon: '🚿', pulse: 90, text: 'Gemeinsame Dusche, Zeit zum Näherkommen, ganz ohne Eile.' },
      { icon: '🔥', pulse: 130, text: 'Massage und Nähe, in Ihrem eigenen Tempo.' },
      { icon: '🌙', pulse: 80, text: 'Ruhiger Ausklang, ein Abschied ohne Eile.' },
    ],
  },
  uk: {
    title: 'Як проходить зустріч',
    steps: [
      { icon: '🥂', pulse: 75, text: 'Приватне вітання в апартаменті — напій для розслаблення.' },
      { icon: '🚿', pulse: 90, text: 'Спільний душ, час для зближення, без поспіху.' },
      { icon: '🔥', pulse: 130, text: 'Масаж і близькість у зручному для вас темпі.' },
      { icon: '🌙', pulse: 80, text: 'Спокійне завершення, прощання без поспіху.' },
    ],
  },
};

export default function ExperienceFlow({ locale = 'cs' }: { locale?: string }) {
  const t = T[locale] ?? T.en;
  const peak = Math.max(...t.steps.map((s) => s.pulse));

  return (
    <div className="experience-flow-wrap">
      <h2 className="section-h2" style={{ fontSize: '28px', marginBottom: '24px' }}>{t.title}</h2>
      <div className="experience-flow">
        {t.steps.map((step, i) => (
          <div
            key={i}
            className={`experience-flow-step${step.pulse === peak ? ' experience-flow-step-peak' : ''}`}
          >
            <div className="experience-flow-icon">{step.icon}</div>
            <div className="experience-flow-pulse">
              <span className="experience-flow-pulse-num">{step.pulse}</span>
              <span className="experience-flow-pulse-unit">bpm</span>
            </div>
            <div className="experience-flow-text">{step.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
