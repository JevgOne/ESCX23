import { getTranslations } from 'next-intl/server';

interface TrustRowProps {
  locale: string;
}

const TRUST_ITEMS = [
  { key: 'verified' as const, icon: '✓' },
  { key: 'fast' as const, icon: '⚡' },
  { key: 'discreet' as const, icon: '🔒' },
  { key: 'loyalty' as const, icon: '💎' },
];

export default async function TrustRow({ locale }: TrustRowProps) {
  const t = await getTranslations({ locale, namespace: 'homepage.trust' });

  return (
    <section className="section">
      <div className="container">
        <div className="trust-row">
          {TRUST_ITEMS.map(({ key, icon }) => (
            <div key={key} className="trust-card">
              <div className="trust-icon">{icon}</div>
              <div className="trust-title">{t(`${key}.title`)}</div>
              <div className="trust-text">{t(`${key}.text`)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
