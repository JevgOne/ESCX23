import PhotoLightbox from './PhotoLightbox';

interface Photo {
  url: unknown;
  id: unknown;
}

interface ProfilGalleryProps {
  photos: Photo[];
  girlName: string;
  heading: string;
}

export default function ProfilGallery({ photos, girlName, heading }: ProfilGalleryProps) {
  if (photos.length === 0) return null;

  const lightboxPhotos = photos.slice(0, 12).map((p, i) => ({
    url: p.url ? String(p.url) : '',
    id: p.id != null ? String(p.id) : String(i),
  }));

  return (
    <section className="profile-section">
      <div className="profile-section-title">{heading}</div>
      <PhotoLightbox photos={lightboxPhotos} girlName={girlName} />
    </section>
  );
}
