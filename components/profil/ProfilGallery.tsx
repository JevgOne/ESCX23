import { photoUrl } from '@/lib/photoUrl';
import PhotoLightbox from './PhotoLightbox';

interface Photo {
  url: unknown;
  id: unknown;
}

interface ProfilGalleryProps {
  photos: Photo[];
  girlName: string;
  heading: string;
  age?: number | null;
  locale?: string;
}

const ALT_NOUN: Record<string, string> = {
  en: 'escort companion',
  cs: 'společnice',
  de: 'Escort-Begleiterin',
  uk: 'супутниця',
};
const CITY: Record<string, string> = { en: 'Prague', de: 'Prag', uk: 'Прага', cs: 'Praha' };

export default function ProfilGallery({ photos, girlName, heading, age = null, locale = 'en' }: ProfilGalleryProps) {
  if (photos.length === 0) return null;

  const visible = photos.slice(0, 12);
  const city = CITY[locale] ?? CITY.en;
  const altNoun = ALT_NOUN[locale] ?? ALT_NOUN.en;
  const altBase = age != null
    ? `${girlName}, ${age}, ${city} ${altNoun}`
    : `${girlName}, ${city} ${altNoun}`;

  const lightboxPhotos = visible.map((p, i) => ({
    url: p.url ? String(p.url) : '',
    id: p.id != null ? String(p.id) : String(i),
  }));

  return (
    <section className="profile-section">
      <div className="profile-section-title">{heading}</div>
      <div className="gallery-6col gallery-lightbox-wrap">
        {visible.map((photo, i) => (
          <div key={String(photo.id ?? i)} className="gallery-tile">
            <img
              src={photoUrl(photo.url ? String(photo.url) : null)}
              alt={`${altBase} — ${i + 1}`}
              loading="lazy"
            />
          </div>
        ))}
        <PhotoLightbox photos={lightboxPhotos} girlName={girlName} />
      </div>
    </section>
  );
}
