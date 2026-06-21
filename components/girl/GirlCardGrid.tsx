import GirlCard from './GirlCard';
import type { GirlCard as GirlCardType } from '@/lib/queries';

interface GirlCardGridProps {
  girls: GirlCardType[];
  columns?: 4 | 3 | 2;
  priorityCount?: number;
}

export default function GirlCardGrid({ girls, priorityCount = 0 }: GirlCardGridProps) {
  return (
    <div className="girls-grid">
      {girls.map((girl, i) => (
        <GirlCard key={girl.id} girl={girl} priority={i < priorityCount} />
      ))}
    </div>
  );
}
