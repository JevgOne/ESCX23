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
const NIGHT_LABEL: Record<string, string> = {
  cs: 'Noční', en: 'Night', de: 'Nacht', uk: 'Нічний',
};
const BOOK_TEXT: Record<string, (title: string, duration: number, min: string) => string> = {
  cs: (title, duration, min) => `Dobrý den, mám zájem o program ${title} (${duration} ${min}).`,
  en: (title, duration, min) => `Hi, I'm interested in the ${title} program (${duration} ${min}).`,
  de: (title, duration, min) => `Hallo, ich interessiere mich für das Programm ${title} (${duration} ${min}).`,
  uk: (title, duration, min) => `Вітаю, мене цікавить програма ${title} (${duration} ${min}).`,
};

// Approximate, cash-desk style conversion — the CZK price is the one that counts,
// EUR is shown rounded as a courtesy for visitors paying in euros (see PricingNotes).
const CZK_PER_EUR = 25;
function toEur(czk: number): number {
  return Math.round(czk / CZK_PER_EUR / 5) * 5;
}

function titleFor(p: Row, locale: string): string {
  const key = `title_${locale}` as keyof Row;
  return String(p[key] ?? p.title_cs ?? `${p.duration} min`);
}

const WHATSAPP_NUMBER = '420734332131';

export default function ProgramsGrid({ programs, locale = 'cs' }: ProgramsGridProps) {
  const popular = POPULAR_LABEL[locale] ?? POPULAR_LABEL.en;
  const incl = INCL_LABEL[locale] ?? INCL_LABEL.en;
  const min = MIN_LABEL[locale] ?? MIN_LABEL.en;
  const book = BOOK_LABEL[locale] ?? BOOK_LABEL.en;
  const currency = CURRENCY_LABEL[locale] ?? CURRENCY_LABEL.en;
  const priceLoc = PRICE_LOCALE[locale] ?? PRICE_LOCALE.en;
  const bookText = BOOK_TEXT[locale] ?? BOOK_TEXT.en;

  return (
    <div className="programs-grid">
      {programs.map((p) => {
        const isPopular = Number(p.is_popular) === 1;
        const price = Number(p.price);
        const nightPrice = p.night_price != null ? Number(p.night_price) : null;
        const duration = Number(p.duration);
        const title = titleFor(p, locale);
        const nightLabel = NIGHT_LABEL[locale] ?? NIGHT_LABEL.en;
        const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(bookText(title, duration, min))}`;

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
            <div className="program-card-price-eur">~{toEur(price)} €</div>
            {nightPrice != null && nightPrice !== price && (
              <div className="program-card-night">
                <span className="program-card-night-icon" aria-hidden="true">&#127769;</span>
                <span className="program-card-night-label">{nightLabel}</span>
                <span className="program-card-night-price">
                  {nightPrice.toLocaleString(priceLoc)} {currency}
                </span>
              </div>
            )}
            <div className="program-card-incl">✓ {incl}</div>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="program-card-cta">{book}</a>
          </article>
        );
      })}
    </div>
  );
}
