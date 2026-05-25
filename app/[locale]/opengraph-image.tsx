import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — Verified Companions';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TAGLINES: Record<string, { headline: string; tagline: string }> = {
  en: { headline: 'LovelyGirls Prague', tagline: 'Verified Companions · Prague 1, 2, 3, 8' },
  cs: { headline: 'LovelyGirls Praha', tagline: 'Ověřené společnice · Praha 1, 2, 3, 8' },
  de: { headline: 'LovelyGirls Prag', tagline: 'Verifizierte Begleiterinnen · Prag 1, 2, 3, 8' },
  uk: { headline: 'LovelyGirls Прага', tagline: 'Перевірені супутниці · Прага 1, 2, 3, 8' },
};

export default async function OpengraphImage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params?.locale ?? 'en';
  const { headline, tagline } = TAGLINES[locale] ?? TAGLINES.en;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          background:
            'linear-gradient(135deg, #1c1420 0%, #3a1a2e 45%, #9a1d51 100%)',
          color: '#fff',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 96,
            height: 96,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #f27d8d 0%, #9a1d51 100%)',
            color: '#fff',
            fontSize: 64,
            fontWeight: 700,
            fontStyle: 'italic',
            marginBottom: 32,
          }}
        >
          L
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            marginBottom: 24,
            color: '#fff',
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 400,
            color: '#f9d6dd',
            letterSpacing: '-0.01em',
          }}
        >
          {tagline}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            right: 80,
            fontSize: 28,
            color: '#f27d8d',
            fontWeight: 600,
            letterSpacing: '0.02em',
            fontFamily: 'sans-serif',
          }}
        >
          lovelygirls.cz
        </div>
      </div>
    ),
    { ...size }
  );
}
