interface DayInfo {
  iso: string;
  labelShort: string;
  dayNum: string;
  isToday: boolean;
  isPast: boolean;
}

interface DayTabsProps {
  days: DayInfo[];
  activeDay: string;
  location?: string;
  basePath: string;
}

export default function DayTabs({ days, activeDay, location, basePath }: DayTabsProps) {
  return (
    <div className="rozvrh-days">
      {days.map((d) => {
        const params = new URLSearchParams();
        params.set('day', d.iso);
        if (location && location !== 'all') params.set('location', location);
        const href = `${basePath}?${params.toString()}`;

        const classes = [
          'rozvrh-day',
          d.iso === activeDay ? 'active' : '',
          d.isPast ? 'past' : '',
        ].filter(Boolean).join(' ');

        return (
          <a
            key={d.iso}
            href={href}
            className={classes}
          >
            <span className="rozvrh-day-name">{d.labelShort}</span>
            <span className="rozvrh-day-num">{d.dayNum}</span>
            {d.isToday && <span className="rozvrh-day-star">●</span>}
          </a>
        );
      })}
    </div>
  );
}
