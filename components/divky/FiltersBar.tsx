interface ServiceOption {
  slug: string;
  name_cs: string;
  name_en: string;
  name_de: string;
  name_uk: string;
  category: string;
  count: number;
}

interface FiltersBarProps {
  searchParams: { status?: string; q?: string; sort?: string; service?: string; page?: string };
  searchPlaceholder: string;
  labelAll: string;
  labelAvailable: string;
  sortNewest: string;
  sortName: string;
  sortAvailableFirst: string;
  labelFilter: string;
  services?: ServiceOption[];
  locale?: string;
  servicesLabel?: string;
  servicesAllLabel?: string;
}

const LABELS: Record<string, { all: string; available: string; sortBy: string; filter: string; service: string; serviceAny: string }> = {
  cs: { all: 'Všechny', available: 'Online nyní', sortBy: 'Řadit', filter: 'Filtrovat', service: 'Služby', serviceAny: 'Jakákoli' },
  en: { all: 'All', available: 'Online now', sortBy: 'Sort', filter: 'Filter', service: 'Service', serviceAny: 'Any' },
  de: { all: 'Alle', available: 'Jetzt online', sortBy: 'Sortieren', filter: 'Filtern', service: 'Service', serviceAny: 'Beliebig' },
  uk: { all: 'Усі', available: 'Онлайн зараз', sortBy: 'Сортувати', filter: 'Фільтр', service: 'Послуги', serviceAny: 'Будь-яка' },
};

function nameFor(s: ServiceOption, locale: string): string {
  const key = `name_${locale}` as keyof ServiceOption;
  return String(s[key] ?? s.name_en ?? s.slug);
}

export default function FiltersBar({
  searchParams,
  searchPlaceholder,
  services = [],
  locale = 'cs',
}: FiltersBarProps) {
  const currentStatus = searchParams.status ?? '';
  const currentSort = searchParams.sort ?? '';
  const currentService = searchParams.service ?? '';
  const currentQ = searchParams.q ?? '';
  const L = LABELS[locale] ?? LABELS.en;

  return (
    <div className="filter-bar-v2">
      <div className="container">
        <form method="GET" className="filter-form-v2">
          {/* Row 1: search + status pills + sort + submit */}
          <div className="filter-row-top">
            <div className="filter-search-v2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                name="q"
                defaultValue={currentQ}
                placeholder={searchPlaceholder}
              />
            </div>

            <div className="filter-status-toggle">
              <label className={`filter-toggle-opt${currentStatus === '' ? ' is-active' : ''}`}>
                <input type="radio" name="status" value="" defaultChecked={currentStatus === ''} />
                <span>{L.all}</span>
              </label>
              <label className={`filter-toggle-opt${currentStatus === 'available' ? ' is-active' : ''}`}>
                <input type="radio" name="status" value="available" defaultChecked={currentStatus === 'available'} />
                <span className="filter-online-dot" />
                <span>{L.available}</span>
              </label>
            </div>

            <div className="filter-sort-wrap">
              <span className="filter-sort-label">{L.sortBy}</span>
              <select name="sort" className="filter-sort-v2" defaultValue={currentSort}>
                <option value="">A–Z</option>
                <option value="newest">{locale === 'cs' ? 'Nejnovější' : locale === 'de' ? 'Neueste' : locale === 'uk' ? 'Найновіші' : 'Newest'}</option>
                <option value="available_first">{locale === 'cs' ? 'Online první' : locale === 'de' ? 'Online zuerst' : locale === 'uk' ? 'Онлайн перші' : 'Online first'}</option>
              </select>
            </div>

            <button type="submit" className="filter-submit-v2">{L.filter}</button>
          </div>

          {/* Row 2: service chips */}
          {services.length > 0 && (
            <div className="filter-services-row">
              <span className="filter-services-label">{L.service}:</span>
              <div className="filter-chips-scroller">
                <button
                  type="submit"
                  name="service"
                  value=""
                  className={`filter-svc-chip${currentService === '' ? ' is-active' : ''}`}
                >
                  ✦ {L.serviceAny}
                </button>
                {services.map((s) => (
                  <button
                    key={s.slug}
                    type="submit"
                    name="service"
                    value={s.slug}
                    className={`filter-svc-chip${currentService === s.slug ? ' is-active' : ''}`}
                    title={`${nameFor(s, locale)} (${s.count})`}
                  >
                    {nameFor(s, locale)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
