const PLACEHOLDER = 'https://placehold.co/600x750/1c1420/F27D8D?text=No+photo';

// Next.js default images.deviceSizes + images.imageSizes (next.config.ts doesn't
// override either, so these are the only "w" values /_next/image will accept —
// anything else gets a 400). Keep in sync if next.config.ts ever sets custom sizes.
const ALLOWED_WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

const DEFAULT_DISPLAY_WIDTH = 384;

function toAbsolute(raw: string): string {
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

function nearestAllowedWidth(target: number): number {
  return ALLOWED_WIDTHS.find((w) => w >= target) ?? ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
}

function optimize(absolute: string, width: number): string {
  // placehold.co isn't in images.remotePatterns — never route it through the optimizer.
  if (absolute.startsWith('https://placehold.co/')) return absolute;
  return `/_next/image?url=${encodeURIComponent(absolute)}&w=${nearestAllowedWidth(width)}&q=75`;
}

/**
 * Optimized URL for an <img> rendered in the browser. `displayWidth` is the CSS
 * width the photo is actually shown at (in px) — it gets doubled internally for
 * retina screens and rounded up to the nearest size the optimizer accepts.
 * Omitting it falls back to a moderate default, not the original full-res photo.
 */
export function photoUrl(raw: string | null | undefined, displayWidth: number = DEFAULT_DISPLAY_WIDTH): string {
  if (!raw) return PLACEHOLDER;
  return optimize(toAbsolute(raw), displayWidth * 2);
}

/**
 * Unoptimized absolute URL — for OG images, JSON-LD and sitemaps, which are all
 * fetched directly by external crawlers/servers rather than the user's browser.
 */
export function photoUrlOriginal(raw: string | null | undefined): string {
  if (!raw) return PLACEHOLDER;
  return toAbsolute(raw);
}

/**
 * srcSet for photos whose rendered width changes across breakpoints (e.g. grid
 * cards). Pair with a `sizes` attribute describing those breakpoints. Widths are
 * real resource widths — the browser already accounts for devicePixelRatio.
 */
export function photoUrlSrcSet(raw: string | null | undefined, widths: number[]): string | undefined {
  if (!raw) return undefined;
  const absolute = toAbsolute(raw);
  return widths.map((w) => `${optimize(absolute, w)} ${nearestAllowedWidth(w)}w`).join(', ');
}
