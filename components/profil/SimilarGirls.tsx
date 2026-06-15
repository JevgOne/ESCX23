import { getGirlsWithToday, getActiveGirlCards } from '@/lib/queries';
import GirlCard from '@/components/girl/GirlCard';

interface Props {
  currentSlug: string;
  locale: string;
}

const LABELS: Record<string, {
  eyebrow_working: string;
  eyebrow_later: string;
  eyebrow_other: string;
  heading_working: string;
  heading_later: string;
  heading_other: string;
  sub_working: string;
  sub_later: string;
  sub_other: string;
}> = {
  cs: {
    eyebrow_working: 'Pracují právě teď',
    eyebrow_later: 'Dnes online',
    eyebrow_other: 'Další dívky',
    heading_working: 'Další dívky online',
    heading_later: 'Další dívky dnes',
    heading_other: 'Mohly by se vám líbit',
    sub_working: 'Můžete si vybrat hned',
    sub_later: 'Dostupné dnes během dne',
    sub_other: 'Prohlédněte si další profily',
  },
  en: {
    eyebrow_working: 'Working right now',
    eyebrow_later: 'Online today',
    eyebrow_other: 'Other girls',
    heading_working: 'Other girls online',
    heading_later: 'Other girls today',
    heading_other: 'You might also like',
    sub_working: 'Pick one right away',
    sub_later: 'Available today',
    sub_other: 'Browse more profiles',
  },
  de: {
    eyebrow_working: 'Jetzt online',
    eyebrow_later: 'Heute online',
    eyebrow_other: 'Weitere Mädchen',
    heading_working: 'Weitere Mädchen online',
    heading_later: 'Weitere Mädchen heute',
    heading_other: 'Das könnte Ihnen auch gefallen',
    sub_working: 'Sofort wählbar',
    sub_later: 'Heute verfügbar',
    sub_other: 'Weitere Profile ansehen',
  },
  uk: {
    eyebrow_working: 'Працюють зараз',
    eyebrow_later: 'Сьогодні онлайн',
    eyebrow_other: 'Інші дівчата',
    heading_working: 'Інші дівчата онлайн',
    heading_later: 'Інші дівчата сьогодні',
    heading_other: 'Вам також можуть сподобатись',
    sub_working: 'Можна вибрати зараз',
    sub_later: 'Доступні сьогодні',
    sub_other: 'Перегляньте інші профілі',
  },
};

export default async function SimilarGirls({ currentSlug, locale }: Props) {
  const allGirls = await getGirlsWithToday();
  const todayOthers = allGirls
    .filter((g) => g.slug !== currentSlug && (g.status === 'working' || g.status === 'later'))
    .sort((a, b) => {
      if (a.status === 'working' && b.status !== 'working') return -1;
      if (a.status !== 'working' && b.status === 'working') return 1;
      return 0;
    })
    .slice(0, 4);

  const L = LABELS[locale] ?? LABELS.en;

  // If we have girls online/later today, show them with online labels
  if (todayOthers.length > 0) {
    const hasWorking = todayOthers.some((g) => g.status === 'working');
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
          <div className="girls-grid">
            {todayOthers.map((g) => (
              <GirlCard key={g.id} girl={g} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Fallback: show active girls even when nobody is scheduled today
  const fallback = await getActiveGirlCards(currentSlug, 4);
  if (fallback.length === 0) return null;

  return (
    <section className="similar-girls section similar-girls-later">
      <div className="container">
        <div className="similar-girls-head">
          <div className="similar-girls-eyebrow">
            <span className="similar-girls-dot" />
            {L.eyebrow_other}
          </div>
          <h2 className="similar-girls-h2">{L.heading_other}</h2>
          <p className="similar-girls-sub">{L.sub_other}</p>
        </div>
        <div className="girls-grid">
          {fallback.map((g) => (
            <GirlCard key={g.id} girl={g} />
          ))}
        </div>
      </div>
    </section>
  );
}
