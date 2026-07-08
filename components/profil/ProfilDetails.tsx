import { Link } from '@/i18n/navigation';
import NextLink from 'next/link';
import type { ServiceRow } from '@/lib/queries';
import { photoUrl } from '@/lib/photoUrl';
import { translateLocation } from '@/lib/utils';

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
  scheduleLocation?: string | null;
  scheduleLocationSlug?: string | null;
  scheduleAddress?: string | null;
  primaryPhotoUrl?: string | null;
  personalMessage?: string | null;
  voiceUrl?: string | null;
  styleWardrobe?: string | null;
  subtitle?: string | null;
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

const EYES_MAP: Record<string, { en: string; de: string; uk: string; color: string; emoji: string }> = {
  'Zelené':  { en: 'Green',  de: 'Grün',     uk: 'Зелені',   color: '#4CAF50', emoji: '👁️' },
  'Modré':   { en: 'Blue',   de: 'Blau',     uk: 'Блакитні',  color: '#2196F3', emoji: '👁️' },
  'Hnědé':   { en: 'Brown',  de: 'Braun',    uk: 'Карі',      color: '#8D6E63', emoji: '👁️' },
  'Šedé':    { en: 'Grey',   de: 'Grau',     uk: 'Сірі',      color: '#9E9E9E', emoji: '👁️' },
  'Lískové': { en: 'Hazel',  de: 'Haselnuss',uk: 'Горіхові',  color: '#A1887F', emoji: '👁️' },
  'Černé':   { en: 'Black',  de: 'Schwarz',  uk: 'Чорні',     color: '#fff',    emoji: '👁️' },
};
const HAIR_MAP: Record<string, { en: string; de: string; uk: string; color: string; emoji: string }> = {
  'Blond':   { en: 'Blonde',    de: 'Blond',     uk: 'Світло-русі', color: '#FFD54F', emoji: '💇' },
  'Hnědé':   { en: 'Brunette',  de: 'Brünett',   uk: 'Каштанові',   color: '#8D6E63', emoji: '💇' },
  'Černé':   { en: 'Black',     de: 'Schwarz',   uk: 'Чорні',       color: '#fff',    emoji: '💇' },
  'Zrzavé':  { en: 'Red',       de: 'Rot',       uk: 'Руді',        color: '#FF7043', emoji: '💇' },
  'Rusé':    { en: 'Auburn',    de: 'Rotbraun',  uk: 'Руді',        color: '#D4845B', emoji: '💇' },
  'Červené': { en: 'Red',       de: 'Rot',       uk: 'Руді',        color: '#EF5350', emoji: '💇' },
  'Šedé':    { en: 'Grey',      de: 'Grau',      uk: 'Сиві',        color: '#BDBDBD', emoji: '💇' },
};

type TraitMap = Record<string, { en: string; de: string; uk: string; color: string; emoji: string }>;

function localizeValue(value: string, map: TraitMap, locale: string): string {
  if (!value) return value;
  const trimmed = value.trim();
  const entry = map[trimmed];
  if (!entry) return trimmed;
  if (locale === 'cs') return trimmed;
  return entry[locale as 'en' | 'de' | 'uk'] ?? trimmed;
}

function traitColor(value: string, map: TraitMap): string | undefined {
  return map[value.trim()]?.color;
}

function traitEmoji(value: string, map: TraitMap): string {
  return map[value.trim()]?.emoji ?? '';
}

const CITY_MAP: Record<string, string> = { en: 'Prague', de: 'Prag', uk: 'Прага', cs: 'Praha' };
function cityName(locale: string): string { return CITY_MAP[locale] ?? 'Prague'; }

const TODAY_LABEL: Record<string, string> = { en: 'Today', de: 'Heute', uk: 'Сьогодні', cs: 'Dnes' };
const APPT_LABEL: Record<string, string> = { en: 'By appointment', de: 'Nach Vereinbarung', uk: 'За домовленістю', cs: 'Po domluvě' };

const TATTOO_LEVEL: Record<string, Record<string, string>> = {
  discreet:    { cs: 'Diskrétní',  en: 'Discreet',    de: 'Dezent',       uk: 'Дискретне' },
  visible:     { cs: 'Viditelné',  en: 'Visible',     de: 'Sichtbar',     uk: 'Помітне' },
  significant: { cs: 'Výrazné',    en: 'Significant', de: 'Markant',      uk: 'Виразне' },
  full:        { cs: 'Celé tělo',  en: 'Full body',   de: 'Ganzkörper',   uk: 'По всьому тілу' },
};

const PIERCING_VAL: Record<string, Record<string, string>> = {
  ears:     { cs: 'Uši',      en: 'Ears',     de: 'Ohren',    uk: 'Вуха' },
  belly:    { cs: 'Pupík',    en: 'Belly',    de: 'Bauch',    uk: 'Пупок' },
  nose:     { cs: 'Nos',      en: 'Nose',     de: 'Nase',     uk: 'Ніс' },
  tongue:   { cs: 'Jazyk',    en: 'Tongue',   de: 'Zunge',    uk: 'Язик' },
  intimate: { cs: 'Intimní',  en: 'Intimate', de: 'Intim',    uk: 'Інтимний' },
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

export default function ProfilDetails({ girl, locale, labels, shiftFrom, shiftTo, services = [], plans = [], altDistricts = [], scheduleLocation, scheduleLocationSlug, scheduleAddress, primaryPhotoUrl, personalMessage, voiceUrl, styleWardrobe, subtitle }: ProfilDetailsProps) {
  const name = String(girl.name ?? '');
  const age = Number(girl.age ?? 0);
  const rating = Number(girl.rating ?? 0);
  const reviewCount = Number(girl.reviews_count ?? 0);
  const phone = girl.phone ? String(girl.phone) : null;
  const district = translateLocation(scheduleLocation ?? null, locale);

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
      <div className="profile-status-line profile-desktop-only">
        <span className="verified">✓ {labels.verified}</span>
        <span className="profile-meta-sep">·</span>
        <span className="stars">{starStr}</span>
        {rating > 0 && <span>{rating.toFixed(1)}</span>}
        <span className="profile-meta-sep">·</span>
        <span>{reviewCount} {recenziLabel}</span>
      </div>

      <div className="profile-name-block profile-desktop-only">
        <h1 className="profile-h1">{name}</h1>
        {subtitle && <div className="profile-subtitle">{subtitle}</div>}
      </div>

      <div className="profile-meta-line profile-desktop-only">
        {shiftFrom && shiftTo && (
          <>
            <span className="profile-meta-live">
              {`${TODAY_LABEL[locale] ?? 'Today'} ${shiftFrom}–${shiftTo}`}
            </span>
            <span className="profile-meta-sep">·</span>
          </>
        )}
        {scheduleLocationSlug ? (
          <a href={`/${locale}/pobocka/${scheduleLocationSlug}`}>📍 {scheduleAddress ?? (district ? `${cityName(locale)} · ${district}` : cityName(locale))}</a>
        ) : (
          <span>📍 {scheduleAddress ?? (district ? `${cityName(locale)} · ${district}` : cityName(locale))}</span>
        )}
      </div>

      {/* Stat hero — big numbers (same as mobile) */}
      {(age != null || girl.height != null || girl.weight != null) && (
        <div className="profile-stat-hero profile-desktop-only">
          {age != null && (
            <div className="profile-stat-hero-cell">
              <div className="psh-num coral">{age}<span className="psh-unit">{locale === 'cs' ? 'let' : locale === 'de' ? 'J.' : locale === 'uk' ? 'р.' : 'y/o'}</span></div>
              <div className="psh-label">{locale === 'cs' ? 'Věk' : locale === 'de' ? 'Alter' : locale === 'uk' ? 'Вік' : 'Age'}</div>
            </div>
          )}
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
      )}

      {/* Pill badges (same as mobile) */}
      <div className="profile-stat-details profile-desktop-only">
        {girl.bust != null && (
          <a href={`/${locale}/divky?bust=${String(girl.bust)}`} className="psd-pill psd-pill-link">
            <span className="psd-label">{locale === 'cs' ? 'Prsa' : locale === 'de' ? 'Brust' : locale === 'uk' ? 'Груди' : 'Bust'}</span>
            <span className="psd-value">{String(girl.bust)}</span>
          </a>
        )}
        {girl.eyes != null && String(girl.eyes).trim() !== '' && (
          <a href={`/${locale}/divky?eyes=${encodeURIComponent(String(girl.eyes))}`} className="psd-pill psd-pill-link">
            <span className="psd-label">{traitEmoji(String(girl.eyes), EYES_MAP)} {locale === 'cs' ? 'Oči' : locale === 'de' ? 'Augen' : locale === 'uk' ? 'Очі' : 'Eyes'}</span>
            <span className="psd-value" style={traitColor(String(girl.eyes), EYES_MAP) ? { color: traitColor(String(girl.eyes), EYES_MAP) } : undefined}>{localizeValue(String(girl.eyes), EYES_MAP, locale)}</span>
          </a>
        )}
        {girl.hair != null && String(girl.hair).trim() !== '' && (
          <a href={`/${locale}/divky?hair=${encodeURIComponent(String(girl.hair))}`} className="psd-pill psd-pill-link">
            <span className="psd-label">{traitEmoji(String(girl.hair), HAIR_MAP)} {locale === 'cs' ? 'Vlasy' : locale === 'de' ? 'Haare' : locale === 'uk' ? 'Волосся' : 'Hair'}</span>
            <span className="psd-value" style={traitColor(String(girl.hair), HAIR_MAP) ? { color: traitColor(String(girl.hair), HAIR_MAP) } : undefined}>{localizeValue(String(girl.hair), HAIR_MAP, locale)}</span>
          </a>
        )}
        {languages.map((lang) => (
          <span key={lang} className="psd-pill lang">
            <span className="psd-flag" aria-hidden>{FLAG_MAP[lang] ?? '🌐'}</span>
            <span className="psd-value">{getLangName(lang, locale)}</span>
          </span>
        ))}
      </div>

      {bio && <p className="profile-bio profile-desktop-only">{bio}</p>}

      {voiceUrl && (
        <div className="profile-voice profile-desktop-only">
          <div className="profile-voice-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            {locale === 'cs' ? 'Poslechni si mě' : locale === 'de' ? 'Hör mich an' : locale === 'uk' ? 'Послухай мене' : 'Listen to me'}
          </div>
          <audio controls preload="none" className="profile-voice-audio">
            <source src={voiceUrl} />
          </audio>
        </div>
      )}

      {/* SLUŽBY — desktop only, mobile has them in ProfilHero IG section */}
      {includedServices.length + extraServices.length > 0 && (
        <div className="profile-mini-block profile-desktop-only">
          <div className="profile-mini-label">★ {locale === 'cs' ? 'Služby' : locale === 'de' ? 'Leistungen' : locale === 'uk' ? 'Послуги' : 'Services'}</div>
          <div className="profile-mini-chips">
            {includedServices.map((svc) => (
              <Link key={`i-${svc.id}`} href={{ pathname: '/sluzba/[slug]', params: { slug: svc.slug ?? '' } }} className="mini-chip mini-chip-included">
                <span className="mini-chip-dot">✓</span>{localizedServiceName(svc, locale)}
              </Link>
            ))}
            {extraServices.map((svc) => (
              <Link key={`e-${svc.id}`} href={{ pathname: '/sluzba/[slug]', params: { slug: svc.slug ?? '' } }} className="mini-chip mini-chip-extra">
                <span className="mini-chip-dot">💬</span>{localizedServiceName(svc, locale)}
              </Link>
            ))}
          </div>
          <div className="ig-services-legend" style={{ marginTop: '8px' }}>
            <span><span style={{ color: 'var(--color-green)', fontWeight: 700 }}>✓</span> {locale === 'cs' ? 'V ceně' : locale === 'de' ? 'Inklusive' : locale === 'uk' ? 'Включено' : 'Included'}</span>
            <span>💬 {locale === 'cs' ? 'Extra dle domluvy' : locale === 'de' ? 'Extra nach Absprache' : locale === 'uk' ? 'Додатково за домовленістю' : 'Extra by arrangement'}</span>
          </div>
        </div>
      )}

      {/* Styl & Šatník — from DB (desktop only, mobile has it in ProfilHero) */}
      {(() => {
        if (!styleWardrobe) return null;
        let parsed: { style?: string[]; wardrobe?: string[] } = {};
        try { parsed = JSON.parse(styleWardrobe); } catch { return null; }
        const styles = parsed.style ?? [];
        const wardrobe = parsed.wardrobe ?? [];
        if (styles.length === 0 && wardrobe.length === 0) return null;

        const STYLE_LABELS: Record<string, Record<string, string>> = {
          elegant:    { cs: 'Elegantní', en: 'Elegant', de: 'Elegant', uk: 'Елегантний' },
          casual:     { cs: 'Ležérní', en: 'Casual', de: 'Lässig', uk: 'Повсякденний' },
          sporty:     { cs: 'Sportovní', en: 'Sporty', de: 'Sportlich', uk: 'Спортивний' },
          glamour:    { cs: 'Glamour', en: 'Glamour', de: 'Glamour', uk: 'Гламурний' },
          minimalist: { cs: 'Minimalistický', en: 'Minimalist', de: 'Minimalistisch', uk: 'Мінімалістичний' },
          romantic:   { cs: 'Romantický', en: 'Romantic', de: 'Romantisch', uk: 'Романтичний' },
          streetwear: { cs: 'Streetwear', en: 'Streetwear', de: 'Streetwear', uk: 'Streetwear' },
          business:   { cs: 'Business', en: 'Business', de: 'Business', uk: 'Діловий' },
          bohemian:   { cs: 'Bohémský', en: 'Bohemian', de: 'Bohème', uk: 'Бохо' },
        };
        const WARDROBE_LABELS: Record<string, Record<string, string>> = {
          lingerie:     { cs: 'Spodní prádlo', en: 'Lingerie', de: 'Dessous', uk: 'Білизна' },
          stockings:    { cs: 'Punčochy', en: 'Stockings', de: 'Strümpfe', uk: 'Панчохи' },
          high_heels:   { cs: 'Vysoké podpatky', en: 'High heels', de: 'High Heels', uk: 'Високі підбори' },
          boots:        { cs: 'Kozačky', en: 'Boots', de: 'Stiefel', uk: 'Чоботи' },
          latex:        { cs: 'Latex', en: 'Latex', de: 'Latex', uk: 'Латекс' },
          leather:      { cs: 'Kůže', en: 'Leather', de: 'Leder', uk: 'Шкіра' },
          corset:       { cs: 'Korzet', en: 'Corset', de: 'Korsett', uk: 'Корсет' },
          bodystocking: { cs: 'Bodystocking', en: 'Bodystocking', de: 'Bodystocking', uk: 'Бодістокінг' },
          costume:      { cs: 'Kostým', en: 'Costume', de: 'Kostüm', uk: 'Костюм' },
          nurse:        { cs: 'Zdravotní sestra', en: 'Nurse', de: 'Krankenschwester', uk: 'Медсестра' },
          schoolgirl:   { cs: 'Školačka', en: 'Schoolgirl', de: 'Schulmädchen', uk: 'Школярка' },
          maid:         { cs: 'Pokojská', en: 'Maid', de: 'Dienstmädchen', uk: 'Покоївка' },
          secretary:    { cs: 'Sekretářka', en: 'Secretary', de: 'Sekretärin', uk: 'Секретарка' },
          swimwear:     { cs: 'Plavky', en: 'Swimwear', de: 'Bademode', uk: 'Купальник' },
        };

        const stylLabel = locale === 'cs' ? 'Styl' : locale === 'de' ? 'Stil' : locale === 'uk' ? 'Стиль' : 'Style';
        const wardrobeLabel = locale === 'cs' ? 'Sexy outfity' : locale === 'de' ? 'Sexy Outfits' : locale === 'uk' ? 'Сексі вбрання' : 'Sexy outfits';

        return (
          <div className="profile-mini-block profile-desktop-only">
            {styles.length > 0 && (
              <>
                <div className="profile-mini-label">{stylLabel}</div>
                <div className="profile-mini-chips" style={{ marginBottom: wardrobe.length > 0 ? '12px' : 0 }}>
                  {styles.map((s) => {
                    const label = STYLE_LABELS[s]?.[locale] ?? STYLE_LABELS[s]?.en ?? s;
                    const prefix = locale === 'en' ? '' : `/${locale}`;
                    const STYLE_SLUG: Record<string, string> = { elegant: 'elegantni-holky', sporty: 'fit-holky', glamour: 'sexy-holky', romantic: 'krasne-holky' };
                    const href = STYLE_SLUG[s] ? `${prefix}/hashtag/${STYLE_SLUG[s]}` : `${prefix}/divky`;
                    return (
                      <a key={s} href={href} className="mini-chip mini-chip-style">
                        <span className="mini-chip-dot">♦</span>
                        {label}
                      </a>
                    );
                  })}
                </div>
              </>
            )}
            {wardrobe.length > 0 && (
              <>
                <div className="profile-mini-label">{wardrobeLabel}</div>
                <div className="profile-mini-chips">
                  {wardrobe.map((w) => {
                    const label = WARDROBE_LABELS[w]?.[locale] ?? WARDROBE_LABELS[w]?.en ?? w;
                    const prefix = locale === 'en' ? '' : `/${locale}`;
                    const WARDROBE_SLUG: Record<string, string> = { lingerie: 'sexy-holky', latex: 'sexy-holky', leather: 'sexy-holky' };
                    const href = WARDROBE_SLUG[w] ? `${prefix}/hashtag/${WARDROBE_SLUG[w]}` : `${prefix}/divky`;
                    return (
                      <a key={w} href={href} className="mini-chip mini-chip-wardrobe">
                        <span className="mini-chip-dot">♠</span>
                        {label}
                      </a>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {hashtags.length > 0 && (
        <div className="profile-hashtags-visible">
          {hashtags.map((tag) => (
            <NextLink key={tag} href={`${hashtagPath}/${tag}`} className="profile-hashtag-link">
              #{tag}
            </NextLink>
          ))}
        </div>
      )}

    </div>
  );
}
