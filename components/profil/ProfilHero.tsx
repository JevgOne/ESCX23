import { photoUrl } from '@/lib/photoUrl';
import { translateLocation } from '@/lib/utils';

interface Photo {
  url: unknown;
  is_primary: unknown;
  id?: unknown;
}

interface Girl {
  name: unknown;
  age?: unknown;
  verified?: unknown;
  created_at?: unknown;
  location?: unknown;
  height?: unknown;
  weight?: unknown;
  bust?: unknown;
  rating?: unknown;
  reviews_count?: unknown;
  phone?: unknown;
  languages?: unknown;
  hashtags?: unknown;
  eyes?: unknown;
  hair?: unknown;
  tattoo_percentage?: unknown;
  piercing?: unknown;
  video_count?: unknown;
}

const ALT_NOUN: Record<string, string> = {
  en: 'escort companion',
  cs: 'společnice',
  de: 'Escort-Begleiterin',
  uk: 'супутниця',
};
const CITY: Record<string, string> = { en: 'Prague', de: 'Prag', uk: 'Прага', cs: 'Praha' };
const TODAY_LBL: Record<string, string> = { cs: 'Dnes', en: 'Today', de: 'Heute', uk: 'Сьогодні' };
const REVIEWS_LBL: Record<string, string> = { cs: 'recenzí', en: 'reviews', de: 'Bewertungen', uk: 'відгуків' };
const PHOTOS_LBL: Record<string, string> = { cs: 'fotek', en: 'photos', de: 'Fotos', uk: 'фото' };
const VIDEOS_LBL: Record<string, string> = { cs: 'videí', en: 'videos', de: 'Videos', uk: 'відео' };
const STAT_LBL: Record<string, { height: string; weight: string; bust: string }> = {
  cs: { height: 'cm', weight: 'kg', bust: 'prsa' },
  en: { height: 'cm', weight: 'kg', bust: 'bust' },
  de: { height: 'cm', weight: 'kg', bust: 'Brust' },
  uk: { height: 'см', weight: 'кг', bust: 'груди' },
};

const FLAG_MAP: Record<string, string> = {
  cs: '🇨🇿', en: '🇬🇧', de: '🇩🇪', uk: '🇺🇦', fr: '🇫🇷',
  it: '🇮🇹', es: '🇪🇸', ru: '🇷🇺', pl: '🇵🇱', sk: '🇸🇰',
};

const SPEAKS_LBL: Record<string, string> = { cs: 'Mluví', en: 'Speaks', de: 'Spricht', uk: 'Розмовляє' };
const EYES_LBL: Record<string, string> = { cs: 'Oči', en: 'Eyes', de: 'Augen', uk: 'Очі' };
const HAIR_LBL: Record<string, string> = { cs: 'Vlasy', en: 'Hair', de: 'Haare', uk: 'Волосся' };

const EYES_MAP: Record<string, Record<string, string>> = {
  cs: { blue: 'modré', brown: 'hnědé', green: 'zelené', hazel: 'oříškové', gray: 'šedé', black: 'černé' },
  en: { blue: 'blue', brown: 'brown', green: 'green', hazel: 'hazel', gray: 'gray', black: 'black' },
  de: { blue: 'blau', brown: 'braun', green: 'grün', hazel: 'haselnuss', gray: 'grau', black: 'schwarz' },
  uk: { blue: 'блакитні', brown: 'карі', green: 'зелені', hazel: 'горіхові', gray: 'сірі', black: 'чорні' },
};
const HAIR_MAP: Record<string, Record<string, string>> = {
  cs: { blonde: 'blond', brunette: 'hnědé', black: 'černé', red: 'rudé', auburn: 'kaštanové' },
  en: { blonde: 'blonde', brunette: 'brunette', black: 'black', red: 'red', auburn: 'auburn' },
  de: { blonde: 'blond', brunette: 'brünett', black: 'schwarz', red: 'rot', auburn: 'kastanienbraun' },
  uk: { blonde: 'блондинка', brunette: 'брюнетка', black: 'чорне', red: 'руде', auburn: 'каштанове' },
};

const TATTOO_LBL: Record<string, string> = { cs: 'Tetování', en: 'Tattoo', de: 'Tattoo', uk: 'Татуювання' };
const PIERCING_LBL: Record<string, string> = { cs: 'Piercing', en: 'Piercing', de: 'Piercing', uk: 'Пірсинг' };
const TATTOO_LEVEL: Record<string, Record<string, string>> = {
  discreet: { cs: 'diskrétní', en: 'discreet', de: 'dezent', uk: 'непомітне' },
  visible: { cs: 'viditelné', en: 'visible', de: 'sichtbar', uk: 'видиме' },
  significant: { cs: 'výrazné', en: 'significant', de: 'auffällig', uk: 'значне' },
  full: { cs: 'rozsáhlé', en: 'extensive', de: 'großflächig', uk: 'значне' },
};
const PIERCING_VAL: Record<string, Record<string, string>> = {
  none: { cs: 'žádný', en: 'none', de: 'kein', uk: 'немає' },
  ears: { cs: 'uši', en: 'ears', de: 'Ohren', uk: 'вуха' },
  belly: { cs: 'pupík', en: 'belly', de: 'Bauch', uk: 'пупок' },
  nose: { cs: 'nos', en: 'nose', de: 'Nase', uk: 'ніс' },
  tongue: { cs: 'jazyk', en: 'tongue', de: 'Zunge', uk: 'язик' },
  intimate: { cs: 'intimní', en: 'intimate', de: 'intim', uk: 'інтимний' },
};

interface TopService { name: string; category?: string }

interface ProfilHeroProps {
  girl: Girl;
  photos: Photo[];
  verifiedLabel: string;
  locale?: string;
  shiftFrom?: string | null;
  shiftTo?: string | null;
  topServices?: TopService[];
  bio?: string;
  personalMessage?: string | null;
  voiceUrl?: string | null;
  scheduleLocation?: string | null;
  scheduleAddress?: string | null;
  stylH?: string;
  stylSub?: string;
  stylNote?: string;
  styleWardrobe?: string | null;
}

export default function ProfilHero({ girl, photos, verifiedLabel, locale = 'cs', shiftFrom, shiftTo, topServices = [], bio = '', personalMessage, voiceUrl, scheduleLocation, scheduleAddress, stylH, stylSub, stylNote, styleWardrobe }: ProfilHeroProps) {
  const primaryPhoto = photos.find((p) => p.is_primary) ?? photos[0];
  const allPhotos = photos.slice(0, 8);
  const name = String(girl.name ?? '');
  const age = girl.age != null ? Number(girl.age) : null;
  const city = CITY[locale] ?? CITY.en;
  const altNoun = ALT_NOUN[locale] ?? ALT_NOUN.en;
  const altBase = age != null
    ? `${name}, ${age}, ${city} ${altNoun}`
    : `${name}, ${city} ${altNoun}`;
  const locText = translateLocation(scheduleLocation ?? null, locale) ?? city;
  const todayLbl = TODAY_LBL[locale] ?? TODAY_LBL.en;
  const statusText = shiftFrom && shiftTo ? `${todayLbl} ${shiftFrom}–${shiftTo}` : null;
  const rating = girl.rating != null ? Number(girl.rating) : 0;
  const reviewsCount = girl.reviews_count != null ? Number(girl.reviews_count) : 0;
  const reviewsLbl = REVIEWS_LBL[locale] ?? REVIEWS_LBL.en;
  const photosLbl = PHOTOS_LBL[locale] ?? PHOTOS_LBL.en;
  const statLbl = STAT_LBL[locale] ?? STAT_LBL.en;
  const height = girl.height != null ? String(girl.height) : null;
  const weight = girl.weight != null ? String(girl.weight) : null;
  const bust = girl.bust != null ? String(girl.bust) : null;
  const phone = girl.phone ? String(girl.phone) : null;

  const parseJson = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string') {
      try { const p = JSON.parse(v); return Array.isArray(p) ? p.map(String) : []; }
      catch { return []; }
    }
    return [];
  };
  const languages = parseJson(girl.languages);
  const hashtags = parseJson(girl.hashtags);
  const eyesRaw = girl.eyes ? String(girl.eyes).toLowerCase() : null;
  const hairRaw = girl.hair ? String(girl.hair).toLowerCase() : null;
  const eyesText = eyesRaw ? (EYES_MAP[locale]?.[eyesRaw] ?? eyesRaw) : null;
  const hairText = hairRaw ? (HAIR_MAP[locale]?.[hairRaw] ?? hairRaw) : null;
  const speaksLbl = SPEAKS_LBL[locale] ?? SPEAKS_LBL.en;
  const eyesLbl = EYES_LBL[locale] ?? EYES_LBL.en;
  const hairLbl = HAIR_LBL[locale] ?? HAIR_LBL.en;
  const videoCount = Number(girl.video_count ?? 0);
  const videosLbl = VIDEOS_LBL[locale] ?? VIDEOS_LBL.en;
  const tattooPercent = Number(girl.tattoo_percentage ?? 0);
  const tattooLbl = TATTOO_LBL[locale] ?? TATTOO_LBL.en;
  const piercingLbl = PIERCING_LBL[locale] ?? PIERCING_LBL.en;
  const tattooLevel = tattooPercent > 0
    ? (tattooPercent <= 5 ? 'discreet' : tattooPercent <= 30 ? 'visible' : tattooPercent <= 70 ? 'significant' : 'full')
    : null;
  const tattooText = tattooLevel ? (TATTOO_LEVEL[tattooLevel]?.[locale] ?? TATTOO_LEVEL[tattooLevel]?.en) : null;
  const piercingRaw = girl.piercing ? String(girl.piercing).toLowerCase().trim() : null;
  const piercingText = piercingRaw && piercingRaw !== 'none' && piercingRaw !== ''
    ? (PIERCING_VAL[piercingRaw]?.[locale] ?? piercingRaw)
    : null;
  const waUrl = phone ? `https://wa.me/${phone.replace(/\s+/g, '').replace(/^\+/, '')}` : null;
  const tgUrl = phone ? `https://t.me/${phone.replace(/\s+/g, '')}` : null;

  const fotoLabel = locale === 'cs' ? 'Foto' : locale === 'de' ? 'Foto' : locale === 'uk' ? 'Фото' : 'Photo';
  const videoLabel = 'Video';

  const ctaCallLbl = locale === 'cs' ? 'Zavolat' : locale === 'de' ? 'Anrufen' : locale === 'uk' ? 'Дзвінок' : 'Call';

  return (
    <div className="profile-photo-col">
      {/* Mobile-only Instagram-style header */}
      <div className="profile-ig-header">
        <div className="ig-avatar">
          <img
            src={photoUrl(primaryPhoto?.url ? String(primaryPhoto.url) : null)}
            alt={altBase}
            loading="eager"
          />
        </div>
        <div className="ig-info">
          <div className="ig-name-row">
            <span className="ig-name">{name}</span>
          </div>
          <div className="ig-loc">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{scheduleAddress ?? locText}</span>
          </div>
          {statusText && (
            <div className="ig-status">
              <span className="ig-status-dot" />
              <span>{statusText}</span>
            </div>
          )}
          <div className="ig-meters">
            {photos.length > 0 && <span><strong>{photos.length}</strong> {photosLbl}</span>}
            <span><strong>{videoCount}</strong> {videosLbl}</span>
            {rating > 0 && <span><strong>★ {rating.toFixed(1)}</strong> · {reviewsCount} {reviewsLbl}</span>}
          </div>
        </div>
      </div>

      {(age != null || height || weight) && (
        <div className="profile-stat-hero ig-stat-hero">
          {age != null && (
            <div className="profile-stat-hero-cell">
              <div className="psh-num coral">{age}<span className="psh-unit">{locale === 'cs' ? 'let' : locale === 'de' ? 'J.' : locale === 'uk' ? 'р.' : 'y/o'}</span></div>
              <div className="psh-label">{locale === 'cs' ? 'Věk' : locale === 'de' ? 'Alter' : locale === 'uk' ? 'Вік' : 'Age'}</div>
            </div>
          )}
          {height && (
            <div className="profile-stat-hero-cell">
              <div className="psh-num">{height}<span className="psh-unit">cm</span></div>
              <div className="psh-label">{locale === 'cs' ? 'Výška' : locale === 'de' ? 'Größe' : locale === 'uk' ? 'Зріст' : 'Height'}</div>
            </div>
          )}
          {weight && (
            <div className="profile-stat-hero-cell">
              <div className="psh-num">{weight}<span className="psh-unit">kg</span></div>
              <div className="psh-label">{locale === 'cs' ? 'Váha' : locale === 'de' ? 'Gewicht' : locale === 'uk' ? 'Вага' : 'Weight'}</div>
            </div>
          )}
        </div>
      )}

      {(bust || eyesText || hairText || tattooText || piercingText || languages.length > 0) && (
        <div className="profile-stat-details ig-stat-details">
          {bust && (
            <span className="psd-pill">
              <span className="psd-label">{locale === 'cs' ? 'Prsa' : locale === 'de' ? 'Brust' : locale === 'uk' ? 'Груди' : 'Bust'}</span>
              <span className="psd-value">{bust}</span>
            </span>
          )}
          {eyesText && (
            <span className="psd-pill">
              <span className="psd-label">{eyesLbl}</span>
              <span className="psd-value">{eyesText}</span>
            </span>
          )}
          {hairText && (
            <span className="psd-pill">
              <span className="psd-label">{hairLbl}</span>
              <span className="psd-value">{hairText}</span>
            </span>
          )}
          {tattooText && (
            <span className="psd-pill">
              <span className="psd-label">{tattooLbl}</span>
              <span className="psd-value">{tattooText}</span>
            </span>
          )}
          {piercingText && (
            <span className="psd-pill">
              <span className="psd-label">{piercingLbl}</span>
              <span className="psd-value">{piercingText}</span>
            </span>
          )}
          {languages.map((lang) => (
            <span key={lang} className="psd-pill lang">
              <span className="psd-flag" aria-hidden>{FLAG_MAP[lang.toLowerCase()] ?? '🏳️'}</span>
              <span className="psd-value">{lang}</span>
            </span>
          ))}
        </div>
      )}

      {bio && (
        <div className="profile-ig-bio">
          <p>{bio.length > 200 ? bio.slice(0, 200) + '…' : bio}</p>
        </div>
      )}

      {topServices.length > 0 && (
        <div className="profile-ig-services">
          <div className="ig-services-lbl">
            ★ {locale === 'cs' ? 'Služby' : locale === 'de' ? 'Leistungen' : locale === 'uk' ? 'Послуги' : 'Services'}
          </div>
          <div className="ig-services-list">
            {topServices.filter(s => s.category === 'basic').map((s, i) => (
              <span key={i} className="ig-service-chip ig-service-chip-top">✓ {s.name}</span>
            ))}
            {topServices.filter(s => s.category !== 'basic').map((s, i) => (
              <span key={`e-${i}`} className="ig-service-chip ig-service-chip-extra">💬 {s.name}</span>
            ))}
          </div>
        </div>
      )}

      {hashtags.length > 0 && (
        <div className="profile-ig-hashtags">
          {hashtags.slice(0, 10).map((tag) => (
            <span key={tag} className="ig-hashtag">{tag.replace(/^#/, '')}</span>
          ))}
        </div>
      )}

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
          <div className="profile-mini-block profile-ig-styl">
            {styles.length > 0 && (
              <>
                <div className="profile-mini-label">{stylLabel}</div>
                <div className="ig-services-list" style={{ marginBottom: wardrobe.length > 0 ? '10px' : 0 }}>
                  {styles.map((s) => (
                    <span key={s} className="ig-styl-chip ig-styl-chip-style">
                      {STYLE_LABELS[s]?.[locale] ?? STYLE_LABELS[s]?.en ?? s}
                    </span>
                  ))}
                </div>
              </>
            )}
            {wardrobe.length > 0 && (
              <>
                <div className="profile-mini-label">{wardrobeLabel}</div>
                <div className="ig-services-list">
                  {wardrobe.map((w) => (
                    <span key={w} className="ig-styl-chip ig-styl-chip-wardrobe">
                      {WARDROBE_LABELS[w]?.[locale] ?? WARDROBE_LABELS[w]?.en ?? w}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })()}

      <div className="profile-ig-cta">
        {phone && (
          <a href={`tel:${phone}`} className="ig-cta ig-cta-call">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {ctaCallLbl}
          </a>
        )}
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="ig-cta ig-cta-wa">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
            </svg>
            WhatsApp
          </a>
        )}
        {tgUrl && (
          <a href={tgUrl} target="_blank" rel="noopener noreferrer" className="ig-cta ig-cta-tg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="m9.78 18.65.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.24 3.64 11.95c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.27 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
            </svg>
            Telegram
          </a>
        )}
      </div>

      {personalMessage && (
        <blockquote className="profile-personal-msg">
          &ldquo;{personalMessage}&rdquo;
        </blockquote>
      )}

      {voiceUrl && (
        <div className="profile-voice">
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

      {/* Desktop hero photo (and same on mobile, just below IG header) */}
      <div className="profile-hero-photo">
        <img
          src={photoUrl(primaryPhoto?.url ? String(primaryPhoto.url) : null)}
          alt={altBase}
          loading="eager"
        />
      </div>

      <div className="media-tabs">
        <span className="media-tab active">{fotoLabel} <span className="media-tab-count">{photos.length}</span></span>
        <span className="media-tab">{videoLabel} <span className="media-tab-count">0</span></span>
      </div>

      {allPhotos.length > 0 && (
        <div className="profile-thumbs profile-thumbs-grid">
          {allPhotos.map((photo, i) => (
            <div key={i} className={`profile-thumb${i === 0 ? ' active' : ''}`}>
              <img src={photoUrl(photo.url ? String(photo.url) : null)} alt={`${altBase} — ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
