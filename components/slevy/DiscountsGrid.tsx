import type { Row } from '@libsql/client';

interface DiscountsGridProps {
  discounts: Row[];
  locale: string;
}

const ICONS: Record<string, string> = {
  loyalty: '⭐',
  morning: '🌅',
  package: '🎉',
  duo: '👯',
  referral: '🎁',
  birthday: '🎂',
};

function getIcon(slug: string): string {
  for (const [key, icon] of Object.entries(ICONS)) {
    if (String(slug).includes(key)) return icon;
  }
  return '✨';
}

const CURRENCY: Record<string, string> = { cs: 'Kč', en: 'CZK', de: 'CZK', uk: 'CZK' };

function formatAmount(row: Row, locale: string): string {
  const val = Number(row.discount_value ?? row.amount_value ?? 0);
  const type = String(row.discount_type ?? row.amount_type ?? 'percentage');
  if (type === 'PERCENT' || type === 'percentage') return `${val} %`;
  const cur = CURRENCY[locale] ?? CURRENCY.en;
  const fmt = locale === 'cs' ? 'cs-CZ' : locale === 'de' ? 'de-DE' : locale === 'uk' ? 'uk-UA' : 'en-GB';
  return `${val.toLocaleString(fmt)} ${cur}`;
}

function getConditions(row: Row): string[] {
  try {
    const raw = row.conditions;
    if (!raw) return [];
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed.map(String);
    return [];
  } catch {
    return [];
  }
}

export default function DiscountsGrid({ discounts, locale }: DiscountsGridProps) {
  const fallbackName = locale === 'cs' ? 'Sleva' : locale === 'de' ? 'Rabatt' : locale === 'uk' ? 'Знижка' : 'Discount';
  return (
    <div className="discounts-grid">
      {discounts.map((d) => {
        const nameKey = `name_${locale}` as keyof typeof d;
        const name = String(d[nameKey] ?? d.name_cs ?? d.name_en ?? d.name ?? fallbackName);
        const desc = String(d.description ?? '');
        const slug = String(d.slug ?? '');
        const isFeatured = Number(d.is_featured) === 1;
        const conditions = getConditions(d);
        const amount = formatAmount(d, locale);

        return (
          <div key={String(d.id)} className={`discount-card${isFeatured ? ' featured' : ''}`}>
            <div className="discount-card-icon">{getIcon(slug)}</div>
            <h3>{name}</h3>
            <div className="discount-card-amount">
              {amount.split(' ')[0]}{' '}
              <small>{amount.split(' ').slice(1).join(' ')}</small>
            </div>
            {desc && <p>{desc}</p>}
            {conditions.length > 0 && (
              <ul className="discount-conditions">
                {conditions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
