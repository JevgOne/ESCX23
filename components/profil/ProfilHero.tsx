import { photoUrl } from '@/lib/photoUrl';

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
}

const ALT_NOUN: Record<string, string> = {
  en: 'escort companion',
  cs: 'společnice',
  de: 'Escort-Begleiterin',
  uk: 'супутниця',
};
const CITY: Record<string, string> = { en: 'Prague', de: 'Prag', uk: 'Прага', cs: 'Praha' };

interface ProfilHeroProps {
  girl: Girl;
  photos: Photo[];
  verifiedLabel: string;
  locale?: string;
}

export default function ProfilHero({ girl, photos, verifiedLabel, locale = 'cs' }: ProfilHeroProps) {
  const primaryPhoto = photos.find((p) => p.is_primary) ?? photos[0];
  const allPhotos = photos.slice(0, 8);
  const name = String(girl.name ?? '');
  const age = girl.age != null ? Number(girl.age) : null;
  const city = CITY[locale] ?? CITY.en;
  const altNoun = ALT_NOUN[locale] ?? ALT_NOUN.en;
  const altBase = age != null
    ? `${name}, ${age}, ${city} ${altNoun}`
    : `${name}, ${city} ${altNoun}`;

  const fotoLabel =
    locale === 'cs' ? 'Foto'
    : locale === 'de' ? 'Foto'
    : locale === 'uk' ? 'Фото'
    : 'Photo';
  const videoLabel = 'Video';

  return (
    <div className="profile-photo-col">
      <div className="profile-hero-photo">
        <img
          src={photoUrl(primaryPhoto?.url ? String(primaryPhoto.url) : null)}
          alt={altBase}
          loading="eager"
        />
      </div>

      <div className="verified-strip">
        <div className="verified-check">✓</div>
        <div className="verified-text">
          <div className="verified-text-main">{verifiedLabel}</div>
          {girl.created_at != null && (
            <div className="verified-text-meta">
              {new Date(String(girl.created_at)).toLocaleDateString('cs-CZ')}
            </div>
          )}
        </div>
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
