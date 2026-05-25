import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f27d8d 0%, #9a1d51 100%)',
          color: 'white',
          fontSize: 44,
          fontWeight: 700,
          fontFamily: 'serif',
          fontStyle: 'italic',
          letterSpacing: '-0.04em',
          borderRadius: 14,
        }}
      >
        L
      </div>
    ),
    { ...size }
  );
}
