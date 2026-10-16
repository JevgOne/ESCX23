/**
 * Generate a composite image with Instagram-style circular profile photos.
 * Uses sharp for image processing. Output: PNG Buffer.
 *
 * NOTE: No SVG text rendering — fonts are not available on Vercel serverless.
 * Girl info (name, age, etc.) goes into the Telegram caption instead.
 */

import sharp from 'sharp';

// Layout constants
const COLUMNS = 4;
const PHOTO_DIAMETER = 130;
const RING_WIDTH = 4;
const RING_DIAMETER = PHOTO_DIAMETER + RING_WIDTH * 2;
const CELL_SIZE = RING_DIAMETER + 16; // padding between circles
const PADDING = 16;
const RING_COLOR = '#c850c0'; // pink/purple accent
const BG_R = 26, BG_G = 26, BG_B = 46; // #1a1a2e

/**
 * Create a circular mask SVG for cropping photos.
 */
function createCircleMask(size: number): Buffer {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`
  );
}

/**
 * Create the colored ring SVG that sits behind each photo.
 */
function createRingSvg(): Buffer {
  const r = RING_DIAMETER / 2;
  return Buffer.from(
    `<svg width="${RING_DIAMETER}" height="${RING_DIAMETER}"><circle cx="${r}" cy="${r}" r="${r}" fill="${RING_COLOR}"/></svg>`
  );
}

/**
 * Fetch a photo URL and return a circular-cropped buffer,
 * or null if fetching/processing fails.
 */
async function fetchAndCropCircle(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuf = await response.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    const resized = await sharp(buf)
      .resize(PHOTO_DIAMETER, PHOTO_DIAMETER, { fit: 'cover' })
      .png()
      .toBuffer();

    const mask = createCircleMask(PHOTO_DIAMETER);
    return sharp(resized)
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();
  } catch (err) {
    console.error('[girls-composite] Failed to fetch/crop photo:', url, err);
    return null;
  }
}

export async function generateGirlsComposite(
  photoUrls: string[],
): Promise<Buffer> {
  // Fetch all photos in parallel
  const photos = await Promise.all(photoUrls.map(fetchAndCropCircle));
  const validPhotos = photos.filter((p): p is Buffer => p !== null);

  if (validPhotos.length === 0) {
    return sharp({ create: { width: 1, height: 1, channels: 4, background: { r: BG_R, g: BG_G, b: BG_B, alpha: 1 } } })
      .png()
      .toBuffer();
  }

  const cols = Math.min(COLUMNS, validPhotos.length);
  const rows = Math.ceil(validPhotos.length / cols);
  const canvasWidth = cols * CELL_SIZE + PADDING * 2;
  const canvasHeight = rows * CELL_SIZE + PADDING * 2;

  // Pre-render ring
  const ringSvg = createRingSvg();
  const ringBuf = await sharp(ringSvg).resize(RING_DIAMETER, RING_DIAMETER).png().toBuffer();

  // Build composite layers
  const composites: sharp.OverlayOptions[] = [];

  for (let i = 0; i < validPhotos.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const centerX = PADDING + col * CELL_SIZE + CELL_SIZE / 2;
    const centerY = PADDING + row * CELL_SIZE + CELL_SIZE / 2;

    // Ring
    composites.push({
      input: ringBuf,
      left: Math.round(centerX - RING_DIAMETER / 2),
      top: Math.round(centerY - RING_DIAMETER / 2),
    });

    // Photo
    composites.push({
      input: validPhotos[i],
      left: Math.round(centerX - PHOTO_DIAMETER / 2),
      top: Math.round(centerY - PHOTO_DIAMETER / 2),
    });
  }

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: BG_R, g: BG_G, b: BG_B, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
}
