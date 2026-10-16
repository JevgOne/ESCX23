/**
 * Generate a composite image with Instagram-style circular profile photos.
 * Uses sharp for image processing. Output: PNG Buffer.
 */

import sharp from 'sharp';

interface GirlCard {
  name: string;
  photoUrl: string;
  age: number;
  height: number | null;
  weight: number | null;
  rating: number | null;
  reviewsCount: number;
}

// Layout constants
const COLUMNS = 3;
const PHOTO_DIAMETER = 120;
const RING_DIAMETER = 128; // colored ring behind photo
const CELL_WIDTH = 160;
const CELL_HEIGHT = 210;
const PADDING_X = 12;
const PADDING_Y = 16;
const TEXT_AREA_HEIGHT = 70;
const BG_COLOR = '#1a1a2e';
const RING_COLOR = '#c850c0'; // pink/purple accent

/**
 * Escape XML special characters for safe SVG text rendering.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Create a circular mask SVG for cropping photos.
 */
function createCircleMask(size: number): Buffer {
  return Buffer.from(`
    <svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>
  `);
}

/**
 * Create the colored ring SVG that sits behind each photo.
 */
function createRingSvg(outerSize: number): Buffer {
  return Buffer.from(`
    <svg width="${outerSize}" height="${outerSize}">
      <circle cx="${outerSize / 2}" cy="${outerSize / 2}" r="${outerSize / 2}" fill="${RING_COLOR}"/>
    </svg>
  `);
}

/**
 * Build the text label SVG for a girl card.
 */
function createTextSvg(card: GirlCard): Buffer {
  const name = escapeXml(card.name);
  const cx = CELL_WIDTH / 2;

  // Build info line: age + optional height + optional weight
  const parts: string[] = [];
  if (card.age > 0) parts.push(`${card.age} let`);
  if (card.height) parts.push(`${card.height} cm`);
  if (card.weight) parts.push(`${card.weight} kg`);
  const infoLine = escapeXml(parts.join(' \u00B7 '));

  // Stars line
  let starsLine = '';
  if (card.rating !== null && card.rating > 0) {
    const full = Math.round(card.rating);
    const empty = 5 - full;
    starsLine = '\u2605'.repeat(full) + '\u2606'.repeat(empty);
  }

  const svgParts = [
    `<svg width="${CELL_WIDTH}" height="${TEXT_AREA_HEIGHT}" xmlns="http://www.w3.org/2000/svg">`,
    `  <text x="${cx}" y="18" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="15" fill="white" font-weight="bold">${name}</text>`,
  ];

  if (infoLine) {
    svgParts.push(
      `  <text x="${cx}" y="36" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#aaaaaa">${infoLine}</text>`,
    );
  }

  if (starsLine) {
    svgParts.push(
      `  <text x="${cx}" y="54" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="13" fill="#ffd700">${starsLine}</text>`,
    );
  }

  svgParts.push('</svg>');
  return Buffer.from(svgParts.join('\n'));
}

/**
 * Fetch a photo URL and return a circular-cropped sharp buffer,
 * or null if fetching/processing fails.
 */
async function fetchAndCropCircle(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuf = await response.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    // Resize to square, then apply circle mask
    const resized = await sharp(buf)
      .resize(PHOTO_DIAMETER, PHOTO_DIAMETER, { fit: 'cover' })
      .png()
      .toBuffer();

    const mask = createCircleMask(PHOTO_DIAMETER);
    const masked = await sharp(resized)
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();

    return masked;
  } catch (err) {
    console.error('[girls-composite] Failed to fetch/crop photo:', url, err);
    return null;
  }
}

export async function generateGirlsComposite(girls: GirlCard[]): Promise<Buffer> {
  // Filter out girls whose photos we can fetch
  const cardResults: Array<{ card: GirlCard; photo: Buffer }> = [];

  // Fetch all photos in parallel
  const fetched = await Promise.all(
    girls.map(async (card) => {
      const photo = await fetchAndCropCircle(card.photoUrl);
      return { card, photo };
    }),
  );

  for (const { card, photo } of fetched) {
    if (photo) cardResults.push({ card, photo });
  }

  if (cardResults.length === 0) {
    // Return a minimal 1x1 transparent PNG if nothing to show
    return sharp({ create: { width: 1, height: 1, channels: 4, background: { r: 26, g: 26, b: 46, alpha: 1 } } })
      .png()
      .toBuffer();
  }

  const cols = Math.min(COLUMNS, cardResults.length);
  const rows = Math.ceil(cardResults.length / cols);
  const canvasWidth = cols * (CELL_WIDTH + PADDING_X) + PADDING_X;
  const canvasHeight = rows * (CELL_HEIGHT + PADDING_Y) + PADDING_Y;

  // Create base canvas
  const canvas = sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 26, g: 26, b: 46, alpha: 1 }, // #1a1a2e
    },
  }).png();

  // Build composite operations
  const composites: sharp.OverlayOptions[] = [];

  // Pre-render ring
  const ringSvg = createRingSvg(RING_DIAMETER);
  const ringBuf = await sharp(ringSvg).resize(RING_DIAMETER, RING_DIAMETER).png().toBuffer();

  for (let i = 0; i < cardResults.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellX = PADDING_X + col * (CELL_WIDTH + PADDING_X);
    const cellY = PADDING_Y + row * (CELL_HEIGHT + PADDING_Y);

    // Center the photo/ring in the cell
    const ringOffsetX = cellX + Math.floor((CELL_WIDTH - RING_DIAMETER) / 2);
    const ringOffsetY = cellY;

    const photoOffsetX = cellX + Math.floor((CELL_WIDTH - PHOTO_DIAMETER) / 2);
    const photoOffsetY = cellY + Math.floor((RING_DIAMETER - PHOTO_DIAMETER) / 2);

    // Ring behind photo
    composites.push({
      input: ringBuf,
      left: ringOffsetX,
      top: ringOffsetY,
    });

    // Photo circle
    composites.push({
      input: cardResults[i].photo,
      left: photoOffsetX,
      top: photoOffsetY,
    });

    // Text label below photo
    const textSvg = createTextSvg(cardResults[i].card);
    const textBuf = await sharp(textSvg).png().toBuffer();
    composites.push({
      input: textBuf,
      left: cellX,
      top: cellY + RING_DIAMETER + 6,
    });
  }

  return canvas.composite(composites).png().toBuffer();
}
