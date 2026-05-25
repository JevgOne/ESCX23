import Link from 'next/link';

interface VipGateProps {
  girlName: string;
  locale?: string;
}

const T: Record<string, {
  eyebrow: string;
  headline: (name: string) => string;
  body: string;
  cta: string;
}> = {
  cs: {
    eyebrow: '— Členská sekce',
    headline: (n) => `${n} je dostupná jen členům`,
    body: 'Tento profil je vyhrazen ověřeným členům. Členství je zdarma — stačí krátká žádost.',
    cta: 'Stát se členem →',
  },
  en: {
    eyebrow: '— Members only',
    headline: (n) => `${n} is available to members only`,
    body: 'This profile is reserved for verified members. Membership is free — a short application is enough.',
    cta: 'Become a member →',
  },
  de: {
    eyebrow: '— Mitgliederbereich',
    headline: (n) => `${n} ist nur für Mitglieder zugänglich`,
    body: 'Dieses Profil ist verifizierten Mitgliedern vorbehalten. Die Mitgliedschaft ist kostenlos — eine kurze Anfrage genügt.',
    cta: 'Mitglied werden →',
  },
  uk: {
    eyebrow: '— Розділ для членів',
    headline: (n) => `${n} доступна лише членам`,
    body: 'Цей профіль зарезервовано для перевірених членів. Членство безкоштовне — достатньо короткої заявки.',
    cta: 'Стати членом →',
  },
};

export default function VipGate({ girlName, locale = 'cs' }: VipGateProps) {
  const L = T[locale] ?? T.en;
  return (
    <div className="vip-gate">
      <div className="vip-gate-icon">🔒</div>
      <div className="vip-gate-eyebrow">{L.eyebrow}</div>
      <h1 className="vip-gate-h1">{L.headline(girlName)}</h1>
      <p className="vip-gate-text">{L.body}</p>
      <Link href={`/${locale}/clenstvi/zadost`} className="vip-gate-btn">{L.cta}</Link>
    </div>
  );
}
