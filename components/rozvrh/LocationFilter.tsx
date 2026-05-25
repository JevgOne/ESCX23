interface Loc {
  slug: string;
  label: string;
}

interface LocationFilterProps {
  locations: Loc[];
  activeLocation: string;
  activeDay: string;
  basePath: string;
}

export default function LocationFilter({ locations, activeLocation, activeDay, basePath }: LocationFilterProps) {
  function makeHref(slug: string) {
    const params = new URLSearchParams();
    if (activeDay) params.set('day', activeDay);
    if (slug !== 'all') params.set('location', slug);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="rozvrh-locations">
      {locations.map((loc) => (
        <a
          key={loc.slug}
          href={makeHref(loc.slug)}
          className={`rozvrh-loc-pill${activeLocation === loc.slug ? ' active' : ''}`}
        >
          {loc.label}
        </a>
      ))}
    </div>
  );
}
