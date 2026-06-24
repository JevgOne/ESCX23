import type { ServiceRow } from '@/lib/queries';
import { Link } from '@/i18n/navigation';

interface Props {
  services: ServiceRow[];
  locale: string;
  heading: string;
}

function localizedName(svc: ServiceRow, locale: string): string {
  const key = `name_${locale}` as keyof ServiceRow;
  return (svc[key] as string | null) ?? svc.name_en ?? svc.slug ?? String(svc.id);
}

// Per-service emoji
const SERVICE_ICONS: Record<string, string> = {
  'klasicky-sex': '❤️',
  'francouzske-libani': '💋',
  'gfe': '💕',
  'oral-bez-ochrany': '👄',
  'oral-s-ochranou': '👅',
  'hluboky-oral': '🔥',
  'polibky-vsude': '💋',
  'cof': '💦',
  'cob': '💦',
  'cim': '💦',
  'analni-sex': '🍑',
  'duo': '👯',
  'pse': '⭐',
  'bdsm-lehke': '⛓️',
  'fetis-na-nohy': '👠',
  'striking-do-ust': '💦',
  'striking-do-obliceje': '💦',
  'striking-na-telo': '💦',
  'stříkani-divky': '💦',
  'strikani-divky': '💦',
  'polykani': '💋',
  'erotic-pomucky': '🎀',
  'eroticke-pomucky': '🎀',
  'zlaty-dest': '💧',
  'poloha-69': '♾️',
  'eroticka-masaz': '💆',
  'prostatova-masaz': '🌿',
  'striptyz': '💃',
  'hrani-roli': '🎭',
  'vip-escort': '👑',
  'overnight': '🌙',
  'overnight-cela-noc': '🌙',
  'dinner-date-doprovod-na-veceri': '🥂',
  'travel-companion-cestovni-spolecnice': '✈️',
  'outcall-vyjezd-do-hotelu': '🏨',
  'incall-privat-v-centru': '🏠',
};

function iconForService(svc: { slug: string | null; category: string }): string {
  const slug = svc.slug ?? '';
  if (SERVICE_ICONS[slug]) return SERVICE_ICONS[slug];
  switch (svc.category) {
    case 'basic': return '❤️';
    case 'oral': return '👄';
    case 'special': return '🔥';
    case 'massage': return '💆';
    case 'extras': return '✨';
    case 'types': return '💎';
    default: return '✨';
  }
}

// Map DB category → display group (only 2 groups now)
type FilterGroup = 'included' | 'extra';
function filterGroupFor(cat: string): FilterGroup {
  if (cat === 'basic') return 'included';
  return 'extra'; // everything else
}

function badgeForGroup(group: FilterGroup, locale: string): string {
  const L: Record<FilterGroup, Record<string, string>> = {
    included: { cs: 'V ceně', en: 'Included', de: 'Inklusive', uk: 'У ціні' },
    extra: { cs: 'Příplatek', en: 'Extra', de: 'Aufpreis', uk: 'Доплата' },
  };
  return L[group][locale] ?? L[group].en;
}

// Most popular services first
const POPULAR_SLUGS = new Set([
  'klasicky-sex', 'oral-bez-ochrany', 'oral-s-ochranou', 'gfe',
  'francouzske-libani', 'duo', 'eroticka-masaz', 'striptyz',
  'hluboky-oral', 'pse', 'analni-sex',
]);

function popularityScore(svc: ServiceRow): number {
  const id = Number(svc.id) || 9999;
  const slug = svc.slug ?? '';
  if (POPULAR_SLUGS.has(slug)) return id;
  return 10000 + id;
}

const FILTERS: Array<{ key: string; group: FilterGroup | 'all' }> = [
  { key: 'all', group: 'all' },
  { key: 'included', group: 'included' },
  { key: 'extra', group: 'extra' },
];

export default function ProfilServices({ services, locale, heading }: Props) {
  if (services.length === 0) return null;

  const sortedServices = [...services].sort((a, b) => popularityScore(a) - popularityScore(b));

  const FL: Record<string, Record<string, string>> = {
    cs: { all: 'Vše', included: 'V ceně', extra: 'Příplatkové' },
    en: { all: 'All', included: 'Included', extra: 'Extras' },
    de: { all: 'Alle', included: 'Inklusive', extra: 'Aufpreis' },
    uk: { all: 'Усі', included: 'У ціні', extra: 'З доплатою' },
  };
  const Llabels = FL[locale] ?? FL.en;

  const subtitle =
    locale === 'cs' ? 'Filtruj nebo proběhni vše'
    : locale === 'de' ? 'Filtern oder alles durchsehen'
    : locale === 'uk' ? 'Фільтруйте або переглядайте все'
    : 'Filter or browse all';

  // Counts by group
  const counts: Record<string, number> = { all: services.length, included: 0, extra: 0 };
  services.forEach((s) => {
    const g = filterGroupFor(s.category);
    counts[g]++;
  });

  return (
    <section id="sluzby" className="profile-section svc-showcase">
      {/* Filter radios at top of section so :has() can reach all children */}
      {FILTERS.map((f, i) => (
        <input
          key={f.key}
          type="radio"
          id={`svc-f-${f.key}`}
          name="svc-filter"
          className="svc-filter-input"
          defaultChecked={i === 0}
        />
      ))}

      <div className="svc-showcase-head">
        <div>
          <div className="svc-showcase-eyebrow">— {heading} —</div>
          <h2 className="svc-showcase-h2">{services.length} {locale === 'cs' ? 'služeb' : locale === 'de' ? 'Leistungen' : locale === 'uk' ? 'послуг' : 'services'}</h2>
          <p className="svc-showcase-subtitle">{subtitle}</p>
        </div>
        <div className="svc-showcase-legend">
          <span><i className="svc-dot-incl" /> {Llabels.included}</span>
          <span><i className="svc-dot-extra" /> {Llabels.extra}</span>
        </div>
      </div>

      <div className="svc-filter-bar">
        {FILTERS.map((f) => (
          <label key={f.key} htmlFor={`svc-f-${f.key}`} className="svc-filter-pill" data-key={f.key}>
            {Llabels[f.key]}
            <span className="svc-filter-count">{counts[f.key]}</span>
          </label>
        ))}
      </div>

      <div className="svc-cards-grid">
        {sortedServices.map((svc) => {
          const group = filterGroupFor(svc.category);
          const badge = badgeForGroup(group, locale);
          const icon = iconForService(svc);
          const cardInner = (
            <>
              <div className="svc-card-icon">{icon}</div>
              <div className="svc-card-body">
                <div className="svc-card-title">{localizedName(svc, locale)}</div>
                <span className={`svc-card-tag svc-tag-${group}`}>{badge}</span>
              </div>
            </>
          );
          if (svc.slug) {
            return (
              <Link
                key={svc.id}
                href={{ pathname: '/sluzba/[slug]' as never, params: { slug: svc.slug } }}
                className={`svc-card svc-card-${group}`}
                data-group={group}
              >
                {cardInner}
              </Link>
            );
          }
          return (
            <article key={svc.id} className={`svc-card svc-card-${group}`} data-group={group}>
              {cardInner}
            </article>
          );
        })}
      </div>
    </section>
  );
}
