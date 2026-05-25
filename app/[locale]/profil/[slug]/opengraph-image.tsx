import { ImageResponse } from 'next/og';
import { getGirlBySlug, getPhotosForGirl } from '@/lib/queries';
import { photoUrl } from '@/lib/photoUrl';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — Verified Companion';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CITY: Record<string, string> = {
  en: 'Prague',
  cs: 'Praha',
  de: 'Prag',
  uk: 'Прага',
};

const COMPANION: Record<string, string> = {
  en: 'Verified companion',
  cs: 'Ověřená společnice',
  de: 'Verifizierte Begleiterin',
  uk: 'Перевірена супутниця',
};

const YEARS: Record<string, string> = {
  en: 'years',
  cs: 'let',
  de: 'Jahre',
  uk: 'років',
};

export default async function OgImage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = params?.locale ?? 'en';
  const slug = params?.slug ?? '';

  const girl = await getGirlBySlug(slug).catch(() => null);
  if (!girl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, #1c1420 0%, #3a1a2e 45%, #9a1d51 100%)',
            color: '#fff',
            fontSize: 64,
            fontFamily: 'serif',
          }}
        >
          LovelyGirls Prague
        </div>
      ),
      { ...size }
    );
  }

  const photos = await getPhotosForGirl(Number(girl.id)).catch(() => [] as { url: unknown; is_primary: unknown }[]);
  const primary = photos.find((p) => p.is_primary) ?? photos[0];
  const photoSrc = primary?.url ? photoUrl(String(primary.url)) : null;

  const name = String(girl.name ?? 'Companion');
  const age = Number(girl.age ?? 0);
  const city = CITY[locale] ?? CITY.en;
  const companionLabel = COMPANION[locale] ?? COMPANION.en;
  const yearsLabel = YEARS[locale] ?? YEARS.en;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background:
            'linear-gradient(135deg, #1c1420 0%, #3a1a2e 45%, #9a1d51 100%)',
          fontFamily: 'serif',
          color: '#fff',
        }}
      >
        {/* Left: photo */}
        <div
          style={{
            width: 500,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0d0810',
            overflow: 'hidden',
          }}
        >
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc}
              alt={name}
              width={500}
              height={630}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                fontSize: 120,
                color: '#f27d8d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ♥
            </div>
          )}
        </div>
        {/* Right: text */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px 60px',
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: '#f9d6dd',
              marginBottom: 16,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontFamily: 'sans-serif',
              fontWeight: 600,
            }}
          >
            ✓ {companionLabel}
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
              marginBottom: 18,
              color: '#fff',
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 44,
              color: '#f9d6dd',
              marginBottom: 36,
              fontWeight: 400,
              letterSpacing: '-0.01em',
            }}
          >
            {age} {yearsLabel} · {city}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 28,
              color: '#f27d8d',
              fontFamily: 'sans-serif',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background:
                  'linear-gradient(135deg, #f27d8d 0%, #9a1d51 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 700,
                fontStyle: 'italic',
                fontFamily: 'serif',
              }}
            >
              L
            </div>
            LovelyGirls {city}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
