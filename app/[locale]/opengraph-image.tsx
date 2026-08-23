import { ImageResponse } from 'next/og';
import { getSiteFacts, districtList } from '@/lib/site-facts';

export const runtime = 'nodejs';
export const alt = 'LovelyGirls Prague — Verified Companions';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const HEADLINES: Record<string, { headline: string; label: string }> = {
  en: { headline: 'LovelyGirls Prague', label: 'Verified Companions' },
  cs: { headline: 'LovelyGirls Praha', label: 'Ověřené společnice' },
  de: { headline: 'LovelyGirls Prag', label: 'Verifizierte Begleiterinnen' },
  uk: { headline: 'LovelyGirls Прага', label: 'Перевірені супутниці' },
};

export default async function OpengraphImage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params?.locale ?? 'en';
  const { headline, label } = HEADLINES[locale] ?? HEADLINES.en;
  // Districts from the DB, not a frozen list — this image is what people see
  // shared on social, so a district we closed reads as a stale business.
  const facts = await getSiteFacts();
  const districts = districtList(facts, locale);
  const tagline = districts ? `${label} · ${districts}` : label;

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
