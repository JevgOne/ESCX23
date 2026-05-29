interface Props {
  locale?: string;
}

const T: Record<string, {
  heading: string;
  body: string;
  desc: string;
  tier: (n: number) => string;
}> = {
  cs: {
    heading: 'Věrnostní program',
    body: 'Čím častěji nás navštěvujete, tím větší sleva. Sleva se uplatňuje automaticky a platí 12 měsíců od poslední návštěvy.',
    desc: 'sleva na každý program',
    tier: (n) => `Po ${n}. návštěvě`,
  },
  en: {
    heading: 'Loyalty program',
    body: 'The more often you visit, the bigger the discount. It is applied automatically and remains valid for 12 months from your last visit.',
    desc: 'discount on every program',
    tier: (n) => `After ${n} visits`,
  },
  de: {
    heading: 'Treueprogramm',
    body: 'Je häufiger Sie zu Gast sind, desto höher der Rabatt. Er wird automatisch berücksichtigt und gilt 12 Monate ab Ihrem letzten Besuch.',
    desc: 'Rabatt auf jedes Programm',
    tier: (n) => `Nach ${n} Besuchen`,
  },
  uk: {
    heading: 'Програма лояльності',
    body: 'Чим частіше ви до нас приходите, тим більша знижка. Знижка нараховується автоматично та діє 12 місяців з моменту останнього візиту.',
    desc: 'знижка на кожну програму',
    tier: (n) => `Після ${n}-го візиту`,
  },
};

export default function LoyaltyExplainer({ locale = 'cs' }: Props) {
  const L = T[locale] ?? T.en;
  const tiers = [
    { visits: 3, pct: 10, icon: '🥉' },
    { visits: 5, pct: 12, icon: '🥈' },
    { visits: 10, pct: 15, icon: '🥇' },
  ];
  return (
    <div className="loyalty-section">
      <div className="loyalty-section-head">
        <h2>{L.heading}</h2>
        <p>{L.body}</p>
      </div>
      <div className="loyalty-tiers">
        {tiers.map((tier) => (
          <div key={tier.visits} className="loyalty-tier">
            <div className="loyalty-tier-icon">{tier.icon}</div>
            <div className="loyalty-tier-label">{L.tier(tier.visits)}</div>
            <div className="loyalty-tier-pct">{tier.pct} %</div>
            <div className="loyalty-tier-desc">{L.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
