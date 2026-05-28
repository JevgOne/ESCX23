/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import type { ReactElement } from 'react';

export const OG_SIZE = { width: 1200, height: 630 } as const;

export interface OgTemplateProps {
  /** Bold headline shown big — e.g. "Společnice Praha" */
  headline: string;
  /** Subline shown under headline — e.g. "Vinohrady · Diskrétní apartmán" */
  tagline?: string | null;
  /** Small eyebrow above headline — e.g. "★ TOP KATEGORIE" */
  eyebrow?: string | null;
  /** Bottom-right brand URL — defaults to lovelygirls.cz */
  brandUrl?: string;
}

/** Render a 1200×630 OG image with the LovelyGirls magenta gradient template. */
export function renderOgImage(props: OgTemplateProps): Promise<ImageResponse> {
  const { headline, tagline, eyebrow, brandUrl = 'lovelygirls.cz' } = props;

  return Promise.resolve(
    new ImageResponse(
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
              background:
                'linear-gradient(135deg, #f27d8d 0%, #9a1d51 100%)',
              color: '#fff',
              fontSize: 64,
              fontWeight: 700,
              fontStyle: 'italic',
              marginBottom: 32,
            }}
          >
            L
          </div>

          {eyebrow && (
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                fontWeight: 700,
                color: '#f27d8d',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontFamily: 'sans-serif',
                marginBottom: 18,
              }}
            >
              {eyebrow}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              fontSize: headline.length > 30 ? 72 : 96,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              marginBottom: tagline ? 24 : 0,
              color: '#fff',
              maxWidth: '90%',
            }}
          >
            {headline}
          </div>

          {tagline && (
            <div
              style={{
                display: 'flex',
                fontSize: 40,
                fontWeight: 400,
                color: '#f9d6dd',
                letterSpacing: '-0.01em',
                maxWidth: '88%',
              }}
            >
              {tagline}
            </div>
          )}

          <div
            style={{
              display: 'flex',
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
            {brandUrl}
          </div>
        </div>
      ) as ReactElement,
      { ...OG_SIZE },
    ),
  );
}
