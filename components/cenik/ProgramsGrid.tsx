import type { Row } from '@libsql/client';

interface ProgramsGridProps {
  programs: Row[];
  locale?: string;
}

const POPULAR_LABEL: Record<string, string> = {
  cs: 'Nejoblíbenější', en: 'Most popular', de: 'Beliebteste', uk: 'Найпопулярніше',
};
const INCL_LABEL: Record<string, string> = {
  cs: 'Apartmán + společnost',
  en: 'Apartment + company',
  de: 'Apartment + Begleitung',
  uk: 'Апартамент + супровід',
};
const MIN_LABEL: Record<string, string> = {
  cs: 'minut', en: 'minutes', de: 'Minuten', uk: 'хвилин',
};
const BOOK_LABEL: Record<string, string> = {
  cs: 'Rezervovat', en: 'Book', de: 'Reservieren', uk: 'Замовити',
};
const CURRENCY_LABEL: Record<string, string> = {
  cs: 'Kč', en: 'CZK', de: 'CZK', uk: 'CZK',
};
const PRICE_LOCALE: Record<string, string> = {
  cs: 'cs-CZ', en: 'en-GB', de: 'de-DE', uk: 'uk-UA',
};

function titleFor(p: Row, locale: string): string {
  const key = `title_${locale}` as keyof Row;
  return String(p[key] ?? p.title_cs ?? `${p.duration} min`);
}

export default function ProgramsGrid({ programs, locale = 'cs' }: ProgramsGridProps) {
  const popular = POPULAR_LABEL[locale] ?? POPULAR_LABEL.en;
  const incl = INCL_LABEL[locale] ?? INCL_LABEL.en;
  const min = MIN_LABEL[locale] ?? MIN_LABEL.en;
  const book = BOOK_LABEL[locale] ?? BOOK_LABEL.en;
  const currency = CURRENCY_LABEL[locale] ?? CURRENCY_LABEL.en;
  const priceLoc = PRICE_LOCALE[locale] ?? PRICE_LOCALE.en;

  return (
    <div className="programs-grid">
      {programs.map((p) => {
        const isPopular = Number(p.is_popular) === 1;
        const price = Number(p.price);
        const duration = Number(p.duration);
        const title = titleFor(p, locale);

        return (
          <article key={String(p.id)} className={`program-card${isPopular ? ' program-card-popular' : ''}`}>
            {isPopular && <div className="program-card-ribbon">★ {popular}</div>}
            <div className="program-card-duration">
              <span className="program-card-duration-num">{duration}</span>
              <span className="program-card-duration-unit">{min}</span>
            </div>
            <div className="program-card-name">{title}</div>
            <div className="program-card-price">
              <span className="program-card-price-num">{price.toLocaleString(priceLoc)}</span>
              <span className="program-card-price-cur">{currency}</span>
            </div>
            <div className="program-card-incl">✓ {incl}</div>
            <a href="#kontakt" className="program-card-cta">{book}</a>
          </article>
        );
      })}
    </div>
  );
}
