import { getGirlsWithToday } from '@/lib/queries';
import GirlCard from '@/components/girl/GirlCard';

interface Props {
  currentSlug: string;
  locale: string;
}

const LABELS: Record<string, {
  eyebrow_working: string;
  eyebrow_later: string;
  heading_working: string;
  heading_later: string;
  sub_working: string;
  sub_later: string;
}> = {
  cs: {
    eyebrow_working: 'Pracují právě teď',
    eyebrow_later: 'Dnes online',
    heading_working: 'Další dívky online',
    heading_later: 'Další dívky dnes',
    sub_working: 'Můžete si vybrat hned',
    sub_later: 'Dostupné dnes během dne',
  },
  en: {
    eyebrow_working: 'Working right now',
    eyebrow_later: 'Online today',
    heading_working: 'Other girls online',
    heading_later: 'Other girls today',
    sub_working: 'Pick one right away',
    sub_later: 'Available today',
  },
  de: {
    eyebrow_working: 'Jetzt online',
    eyebrow_later: 'Heute online',
    heading_working: 'Weitere Mädchen online',
    heading_later: 'Weitere Mädchen heute',
    sub_working: 'Sofort wählbar',
    sub_later: 'Heute verfügbar',
  },
  uk: {
    eyebrow_working: 'Працюють зараз',
    eyebrow_later: 'Сьогодні онлайн',
    heading_working: 'Інші дівчата онлайн',
    heading_later: 'Інші дівчата сьогодні',
    sub_working: 'Можна вибрати зараз',
    sub_later: 'Доступні сьогодні',
  },
};

export default async function SimilarGirls({ currentSlug, locale }: Props) {
  const allGirls = await getGirlsWithToday();
  const others = allGirls
    .filter((g) => g.slug !== currentSlug && (g.status === 'working' || g.status === 'later'))
    .sort((a, b) => {
      if (a.status === 'working' && b.status !== 'working') return -1;
      if (a.status !== 'working' && b.status === 'working') return 1;
      return 0;
    })
    .slice(0, 4);

  if (others.length === 0) return null;

  // Use "working" labels only if at least one shown girl is actually working now
  const hasWorking = others.some((g) => g.status === 'working');
  const L = LABELS[locale] ?? LABELS.en;
  const eyebrow = hasWorking ? L.eyebrow_working : L.eyebrow_later;
  const heading = hasWorking ? L.heading_working : L.heading_later;
  const subtitle = hasWorking ? L.sub_working : L.sub_later;

  return (
    <section className={`similar-girls section${hasWorking ? '' : ' similar-girls-later'}`}>
      <div className="container">
        <div className="similar-girls-head">
          <div className="similar-girls-eyebrow">
            <span className="similar-girls-dot" />
            {eyebrow}
          </div>
          <h2 className="similar-girls-h2">{heading}</h2>
          <p className="similar-girls-sub">{subtitle}</p>
        </div>
        <div className="similar-girls-grid">
          {others.map((g) => (
            <GirlCard key={g.id} girl={g} />
          ))}
        </div>
      </div>
    </section>
  );
}
