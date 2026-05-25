import GirlCard from './GirlCard';
import type { GirlCard as GirlCardType } from '@/lib/queries';

interface GirlCardGridProps {
  girls: GirlCardType[];
  columns?: 4 | 3 | 2;
}

export default function GirlCardGrid({ girls }: GirlCardGridProps) {
  return (
    <div className="girls-grid">
      {girls.map((girl) => (
        <GirlCard key={girl.id} girl={girl} />
      ))}
    </div>
  );
}
