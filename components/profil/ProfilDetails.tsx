import Link from 'next/link';
import { prettyDistrict } from '@/lib/utils';
import type { ServiceRow } from '@/lib/queries';

interface Girl {
  id: unknown;
  name: unknown;
  age: unknown;
  height: unknown;
  weight: unknown;
  bust: unknown;
  waist?: unknown;
  hips?: unknown;
  eyes: unknown;
  hair: unknown;
  location: unknown;
  rating: unknown;
  reviews_count: unknown;
  phone: unknown;
  bio?: unknown;
  description_cs?: unknown;
  description_en?: unknown;
  description_de?: unknown;
  description_uk?: unknown;
  tattoo_percentage?: unknown;
  tattoo_description?: unknown;
  piercing?: unknown;
  bust_natural?: unknown;
  languages?: unknown;
  hashtags?: unknown;
  slug?: unknown;
}

interface ProfilDetailsLabels {
  verified: string;
  bioLabel: string;
  heightLabel: string;
  weightLabel: string;
  bustLabel: string;
  eyesLabel: string;
  hairLabel: string;
  tattooLabel: string;
  piercingLabel: string;
  tattooNone: string;
  piercingNone: string;
  tattooLevels: Record<string, string>;
  piercingLevels: Record<string, string>;
  ctaWhatsapp: string;
  ctaTelegram: string;
  ctaCall: string;
  tabMiry: string;
  tabVzhled: string;
  tabSluzby: string;
  styl_h: string;
  styl_sub: string;
  styl_note: string;
  kde_h: string;
  kde_sub: string;
  kde_address_note: string;
  jazyky_h: string;
  experience_h: string;
  experience_col_programy: string;
  experience_col_spolecenske: string;
  experience_col_privatni: string;
  lang_level_native: string;
  lang_level_fluent: string;
  lang_level_basic: string;
  acc: {
    section_miry: string;
    section_vzhled: string;
    section_sluzby: string;
    height: string;
    weight: string;
    bust: string;
    waist: string;
    hips: string;
    bust_natural: string;
    bust_implant: string;
    eyes: string;
    hair: string;
    tattoo: string;
    piercing: string;
    yes: string;
    no: string;
  };
}

interface ProfilDetailsProps {
  girl: Girl;
  locale: string;
  labels: ProfilDetailsLabels;
  shiftFrom: string | null;
  shiftTo: string | null;
  services?: ServiceRow[];
  plans?: { id: unknown; duration: unknown; price: unknown }[];
  altDistricts?: string[];
}

const FLAG_MAP: Record<string, string> = {
  cs: '🇨🇿', en: '🇬🇧', de: '🇩🇪', uk: '🇺🇦', fr: '🇫🇷',
  it: '🇮🇹', es: '🇪🇸', ru: '🇷🇺', pl: '🇵🇱', sk: '🇸🇰',
};

const LANG_NAME_CS: Record<string, string> = {
  cs: 'česky', en: 'anglicky', de: 'německy', uk: 'ukrajinsky',
  fr: 'francouzsky', it: 'italsky', es: 'španělsky',
  ru: 'rusky', pl: 'polsky', sk: 'slovensky',
};

const LANG_NAME_EN: Record<string, string> = {
  cs: 'Czech', en: 'English', de: 'German', uk: 'Ukrainian',
  fr: 'French', it: 'Italian', es: 'Spanish',
  ru: 'Russian', pl: 'Polish', sk: 'Slovak',
};

const LANG_NAME_DE: Record<string, string> = {
  cs: 'Tschechisch', en: 'Englisch', de: 'Deutsch', uk: 'Ukrainisch',
  fr: 'Französisch', it: 'Italienisch', es: 'Spanisch',
  ru: 'Russisch', pl: 'Polnisch', sk: 'Slowakisch',
};

const LANG_NAME_UK: Record<string, string> = {
  cs: 'Чеська', en: 'Англійська', de: 'Німецька', uk: 'Українська',
  fr: 'Французька', it: 'Італійська', es: 'Іспанська',
  ru: 'Російська', pl: 'Польська', sk: 'Словацька',
};

function localizedServiceName(svc: ServiceRow, locale: string): string {
  const key = `name_${locale}` as keyof ServiceRow;
  return (svc[key] as string | null) ?? svc.name_en ?? svc.slug ?? String(svc.id);
}

function getLangName(code: string, locale: string): string {
  const map =
    locale === 'de' ? LANG_NAME_DE
    : locale === 'uk' ? LANG_NAME_UK
    : locale === 'en' ? LANG_NAME_EN
    : LANG_NAME_CS;
  return map[code] ?? code.toUpperCase();
}

const EYES_MAP: Record<string, Record<string, string>> = {
  'Zelené':  { en: 'Green',  de: 'Grün',     uk: 'Зелені' },
  'Modré':   { en: 'Blue',   de: 'Blau',     uk: 'Блакитні' },
  'Hnědé':   { en: 'Brown',  de: 'Braun',    uk: 'Карі' },
  'Šedé':    { en: 'Grey',   de: 'Grau',     uk: 'Сірі' },
  'Lískové': { en: 'Hazel',  de: 'Haselnuss',uk: 'Горіхові' },
  'Černé':   { en: 'Black',  de: 'Schwarz',  uk: 'Чорні' },
};
const HAIR_MAP: Record<string, Record<string, string>> = {
  'Blond':   { en: 'Blonde',    de: 'Blond',     uk: 'Світло-русі' },
  'Hnědé':   { en: 'Brunette',  de: 'Brünett',   uk: 'Каштанові' },
  'Černé':   { en: 'Black',     de: 'Schwarz',   uk: 'Чорні' },
  'Zrzavé':  { en: 'Red',       de: 'Rot',       uk: 'Руді' },
  'Rusé':    { en: 'Auburn',    de: 'Rotbraun',  uk: 'Руді' },
  'Červené': { en: 'Red',       de: 'Rot',       uk: 'Руді' },
  'Šedé':    { en: 'Grey',      de: 'Grau',      uk: 'Сиві' },
};

function localizeValue(value: string, map: Record<string, Record<string, string>>, locale: string): string {
  if (locale === 'cs' || !value) return value;
  const entry = map[value];
  return entry?.[locale] ?? value;
}

const CITY_MAP: Record<string, string> = { en: 'Prague', de: 'Prag', uk: 'Прага', cs: 'Praha' };
function cityName(locale: string): string { return CITY_MAP[locale] ?? 'Prague'; }

const TODAY_LABEL: Record<string, string> = { en: 'Today', de: 'Heute', uk: 'Сьогодні', cs: 'Dnes' };
const APPT_LABEL: Record<string, string> = { en: 'By appointment', de: 'Nach Absprache', uk: 'За домовленістю', cs: 'Domluva' };

const TATTOO_LEVEL: Record<string, Record<string, string>> = {
  discreet:    { cs: 'Diskrétní',  en: 'Discreet',    de: 'Dezent',       uk: 'Дискретне' },
  visible:     { cs: 'Viditelné',  en: 'Visible',     de: 'Sichtbar',     uk: 'Помітне' },
  significant: { cs: 'Výrazné',    en: 'Significant', de: 'Markant',      uk: 'Виразне' },
  full:        { cs: 'Celé tělo',  en: 'Full body',   de: 'Ganzkörper',   uk: 'По всьому тілу' },
};

function parseList(raw: unknown): string[] {
  if (!raw) return [];
  const s = String(raw).trim();
  if (s.startsWith('[')) {
    try { return JSON.parse(s) as string[]; } catch { /* fall */ }
  }
  if (s === '') return [];
  return s.split(',').map((l) => l.trim()).filter(Boolean);
}

export default function ProfilDetails({ girl, locale, labels, shiftFrom, shiftTo, services = [], plans = [], altDistricts = [] }: ProfilDetailsProps) {
  const name = String(girl.name ?? '');
  const age = Number(girl.age ?? 0);
  const rating = Number(girl.rating ?? 0);
  const reviewCount = Number(girl.reviews_count ?? 0);
  const phone = girl.phone ? String(girl.phone) : null;
  const location = String(girl.location ?? 'Praha');
  const district = prettyDistrict(location) ?? 'Praha';

  const bio =
    locale === 'cs'
      ? String(girl.description_cs ?? girl.bio ?? '')
      : locale === 'de'
        ? String(girl.description_de ?? girl.description_en ?? girl.bio ?? '')
        : locale === 'uk'
          ? String(girl.description_uk ?? girl.description_en ?? girl.bio ?? '')
          : String(girl.description_en ?? girl.bio ?? '');

  const stars = Math.round(rating);
  const starStr = '★'.repeat(stars) + '☆'.repeat(Math.max(0, 5 - stars));

  const waPhone = phone ? phone.replace(/\s+/g, '').replace(/^\+/, '') : null;
  const WA_GREETING: Record<string, (n: string) => string> = {
    cs: (n) => `Dobrý den, zajímá mě ${n}`,
    en: (n) => `Hello, I'm interested in ${n}`,
    de: (n) => `Guten Tag, ich interessiere mich für ${n}`,
    uk: (n) => `Доброго дня, мене цікавить ${n}`,
  };
  const waText = (WA_GREETING[locale] ?? WA_GREETING.en)(name);
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`
    : '#';
  const tgUrl = phone
    ? `https://t.me/${phone.replace(/\s+/g, '')}`
    : 'https://t.me/lovelygirls_prague';

  const bustNatural = girl.bust_natural;
  const bustUnit =
    bustNatural === 1 ? labels.acc.bust_natural
    : bustNatural === 0 ? labels.acc.bust_implant
    : null;

  const tattooPercent = Number(girl.tattoo_percentage ?? 0);

  const languages = parseList(girl.languages as unknown);
  const hashtags = parseList(girl.hashtags as unknown);

  const includedServices = services.filter(s => s.category === 'basic');
  const extraServices = services.filter(s => ['extras', 'massage'].includes(s.category));
  const slug = String(girl.slug ?? '');

  const recenziLabel =
    locale === 'cs' ? 'recenzí'
    : locale === 'de' ? 'Bewertungen'
    : locale === 'uk' ? 'відгуків'
    : 'reviews';

  const hashtagPath = `/${locale}/hashtag`;

  return (
    <div className="profile-info-col">
      <div className="profile-status-line">
        <span className="verified">✓ {labels.verified}</span>
        <span className="profile-meta-sep">·</span>
        <span className="stars">{starStr}</span>
        {rating > 0 && <span>{rating.toFixed(1)}</span>}
        <span className="profile-meta-sep">·</span>
        <span>{reviewCount} {recenziLabel}</span>
      </div>

      <div className="profile-name-block">
        <h1 className="profile-h1">{name}</h1>
      </div>

      <div className="profile-meta-line">
        <span>📍 {cityName(locale)}{district !== 'Praha' ? ` · ${district}` : ''}</span>
        <span className="profile-meta-sep">·</span>
        <span className="profile-meta-live">
          {shiftFrom && shiftTo ? `${TODAY_LABEL[locale] ?? 'Today'} ${shiftFrom}–${shiftTo}` : (APPT_LABEL[locale] ?? 'By appointment')}
        </span>
      </div>

      {/* Premium stat hero strip — věk/výška/váha */}
      <div className="profile-stat-hero">
        <div className="profile-stat-hero-cell">
          <div className="psh-num coral">{age}<span className="psh-unit">{locale === 'cs' ? 'let' : locale === 'de' ? 'J.' : locale === 'uk' ? 'р.' : 'y/o'}</span></div>
          <div className="psh-label">{locale === 'cs' ? 'Věk' : locale === 'de' ? 'Alter' : locale === 'uk' ? 'Вік' : 'Age'}</div>
        </div>
        {girl.height != null && (
          <div className="profile-stat-hero-cell">
            <div className="psh-num">{String(girl.height)}<span className="psh-unit">cm</span></div>
            <div className="psh-label">{locale === 'cs' ? 'Výška' : locale === 'de' ? 'Größe' : locale === 'uk' ? 'Зріст' : 'Height'}</div>
          </div>
        )}
        {girl.weight != null && (
          <div className="profile-stat-hero-cell">
            <div className="psh-num">{String(girl.weight)}<span className="psh-unit">kg</span></div>
            <div className="psh-label">{locale === 'cs' ? 'Váha' : locale === 'de' ? 'Gewicht' : locale === 'uk' ? 'Вага' : 'Weight'}</div>
          </div>
        )}
      </div>

      {/* Detail pills — bust, eyes, hair, tattoo, piercing + jazyky */}
      <div className="profile-stat-details">
        {girl.bust != null && (
          <span className="psd-pill">
            <span className="psd-label">{locale === 'cs' ? 'Prsa' : locale === 'de' ? 'Brust' : locale === 'uk' ? 'Груди' : 'Bust'}</span>
            <span className="psd-value">{String(girl.bust)}{bustUnit ? ` · ${bustUnit}` : ''}</span>
          </span>
        )}
        {girl.eyes != null && String(girl.eyes).trim() !== '' && (
          <span className="psd-pill">
            <span className="psd-label">{locale === 'cs' ? 'Oči' : locale === 'de' ? 'Augen' : locale === 'uk' ? 'Очі' : 'Eyes'}</span>
            <span className="psd-value">{localizeValue(String(girl.eyes), EYES_MAP, locale)}</span>
          </span>
        )}
        {girl.hair != null && String(girl.hair).trim() !== '' && (
          <span className="psd-pill">
            <span className="psd-label">{locale === 'cs' ? 'Vlasy' : locale === 'de' ? 'Haare' : locale === 'uk' ? 'Волосся' : 'Hair'}</span>
            <span className="psd-value">{localizeValue(String(girl.hair), HAIR_MAP, locale)}</span>
          </span>
        )}
        {tattooPercent > 0 && (
          <span className="psd-pill">
            <span className="psd-label">{locale === 'cs' ? 'Tetování' : locale === 'de' ? 'Tattoo' : locale === 'uk' ? 'Татуювання' : 'Tattoo'}</span>
            <span className="psd-value">
              {(() => {
                const level = tattooPercent <= 5 ? 'discreet' : tattooPercent <= 30 ? 'visible' : tattooPercent <= 70 ? 'significant' : 'full';
                return TATTOO_LEVEL[level]?.[locale] ?? TATTOO_LEVEL[level]?.cs;
              })()}
            </span>
          </span>
        )}
        {languages.map((lang) => (
          <span key={lang} className="psd-pill lang">
            <span className="psd-flag">{FLAG_MAP[lang] ?? '🌐'}</span>
            <span className="psd-value">{getLangName(lang, locale)}</span>
          </span>
        ))}
      </div>

      {bio && <p className="profile-bio">{bio}</p>}

      {/* TOP SLUŽBY — 6 best chips inline + link to full */}
      {includedServices.length + extraServices.length > 0 && (
        <div className="profile-mini-block">
          <div className="profile-mini-label">★ {locale === 'cs' ? 'Top služby' : locale === 'de' ? 'Top Leistungen' : locale === 'uk' ? 'Топ послуги' : 'Top services'}</div>
          <div className="profile-mini-chips">
            {includedServices.slice(0, 3).map((svc) => (
              <Link key={`i-${svc.id}`} href={`/${locale}/sluzba/${svc.slug}`} className="mini-chip mini-chip-included">
                <span className="mini-chip-dot">✓</span>{localizedServiceName(svc, locale)}
              </Link>
            ))}
            {extraServices.slice(0, 3).map((svc) => (
              <Link key={`e-${svc.id}`} href={`/${locale}/sluzba/${svc.slug}`} className="mini-chip mini-chip-extra">
                {localizedServiceName(svc, locale)}
              </Link>
            ))}
            <a href="#sluzby" className="mini-chip mini-chip-more">
              +{Math.max(0, services.length - 6)} {locale === 'cs' ? 'dalších' : locale === 'de' ? 'weitere' : locale === 'uk' ? 'інших' : 'more'} →
            </a>
          </div>
        </div>
      )}

      {/* LOKACE — main + alternatives */}
      <div className="profile-mini-block">
        <div className="profile-mini-label">📍 {locale === 'cs' ? 'Kde ji najdeš' : locale === 'de' ? 'Wo zu finden' : locale === 'uk' ? 'Де знайти' : 'Where to find'}</div>
        <div className="profile-location-row">
          <span className="loc-chip-main">📍 {district}</span>
          {altDistricts.map((d) => (
            <span key={d} className="loc-chip-alt">{d} <em>{locale === 'cs' ? '(domluva)' : locale === 'de' ? '(Termin)' : locale === 'uk' ? '(домовленість)' : '(by appt)'}</em></span>
          ))}
        </div>
        <div className="profile-location-note">{labels.kde_address_note}</div>
      </div>

      {hashtags.length > 0 && (
        <div className="profile-hashtags">
          {hashtags.map((tag) => (
            <Link key={tag} href={`${hashtagPath}/${tag}`} className="profile-hashtag-pill">
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* RECENZE summary + napsat novou */}
      <div className="profile-mini-block">
        <div className="profile-mini-label-row">
          <div className="profile-mini-label">★ {locale === 'cs' ? 'Recenze' : locale === 'de' ? 'Bewertungen' : locale === 'uk' ? 'Відгуки' : 'Reviews'}</div>
          <a href="#recenze" className="profile-mini-action">
            {locale === 'cs' ? 'Všechny →' : locale === 'de' ? 'Alle →' : locale === 'uk' ? 'Усі →' : 'All →'}
          </a>
        </div>
        <div className="profile-reviews-summary">
          <div className="reviews-rating-big">
            <span className="rating-num">{rating > 0 ? rating.toFixed(1) : '—'}</span>
            <span className="rating-stars">{starStr}</span>
            <span className="rating-count">{reviewCount} {locale === 'cs' ? 'recenzí' : locale === 'de' ? 'Bewertungen' : locale === 'uk' ? 'відгуків' : 'reviews'}</span>
          </div>
          <Link
            href={`/recenze/nova/${slug}`}
            className="profile-write-review-btn"
          >
            ✎ {locale === 'cs' ? 'Napsat recenzi' : locale === 'de' ? 'Bewertung schreiben' : locale === 'uk' ? 'Написати відгук' : 'Write review'}
          </Link>
        </div>
      </div>

      <div className="profile-cta-card">
        <div className="profile-cta-card-meta">
          <span>{district} · {shiftFrom ? 'Online' : (APPT_LABEL[locale] ?? APPT_LABEL.en)}</span>
        </div>
        <div className="profile-cta-card-buttons">
          <a href={waUrl} className="btn btn-whatsapp">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {labels.ctaWhatsapp}
          </a>
          <a href={tgUrl} className="btn btn-telegram">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            {labels.ctaTelegram}
          </a>
          {phone && (
            <a href={`tel:${phone}`} className="btn btn-ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.65A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.46-1.46a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
              </svg>
              {labels.ctaCall}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
