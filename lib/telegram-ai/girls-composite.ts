/**
 * Generate a composite image with Instagram-style circular profile photos + names.
 * Uses sharp for image processing. Output: PNG Buffer.
 *
 * Names are rendered via sharp's text API (Pango) — works on serverless
 * unlike SVG text which lacks fonts on Vercel.
 */

import sharp from 'sharp';

// Layout constants
const COLUMNS = 4;
const PHOTO_DIAMETER = 130;
const RING_WIDTH = 4;
const RING_DIAMETER = PHOTO_DIAMETER + RING_WIDTH * 2;
const NAME_HEIGHT = 28;
const CELL_WIDTH = RING_DIAMETER + 20;
const CELL_HEIGHT = RING_DIAMETER + NAME_HEIGHT + 8;
const PADDING = 16;
const RING_COLOR = '#c850c0';
const BG_R = 26, BG_G = 26, BG_B = 46; // #1a1a2e

interface GirlPhoto {
  name: string;
  photoUrl: string;
}

function createCircleMask(size: number): Buffer {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`
  );
}

function createRingSvg(): Buffer {
  const r = RING_DIAMETER / 2;
  return Buffer.from(
    `<svg width="${RING_DIAMETER}" height="${RING_DIAMETER}"><circle cx="${r}" cy="${r}" r="${r}" fill="${RING_COLOR}"/></svg>`
  );
}

function escapeMarkup(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Render a name as a small PNG image using sharp's Pango text API.
 */
async function renderName(name: string, maxWidth: number): Promise<Buffer> {
  return sharp({
    text: {
      text: `<span foreground="white" font_desc="Sans Bold 13">${escapeMarkup(name)}</span>`,
      rgba: true,
      dpi: 72,
      width: maxWidth,
      align: 'centre',
    },
  })
    .png()
    .toBuffer();
}

async function fetchAndCropCircle(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buf = Buffer.from(await response.arrayBuffer());

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
  girls: GirlPhoto[],
): Promise<Buffer> {
  // Fetch all photos in parallel
  const results = await Promise.all(
    girls.map(async (g) => {
      const photo = await fetchAndCropCircle(g.photoUrl);
      return { name: g.name, photo };
    }),
  );
  const valid = results.filter((r): r is { name: string; photo: Buffer } => r.photo !== null);

  if (valid.length === 0) {
    return sharp({ create: { width: 1, height: 1, channels: 4, background: { r: BG_R, g: BG_G, b: BG_B, alpha: 1 } } })
      .png()
      .toBuffer();
  }

  const cols = Math.min(COLUMNS, valid.length);
  const rows = Math.ceil(valid.length / cols);
  const canvasWidth = cols * CELL_WIDTH + PADDING * 2;
  const canvasHeight = rows * CELL_HEIGHT + PADDING * 2;

  // Pre-render ring
  const ringBuf = await sharp(createRingSvg()).resize(RING_DIAMETER, RING_DIAMETER).png().toBuffer();

  const composites: sharp.OverlayOptions[] = [];

  for (let i = 0; i < valid.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellX = PADDING + col * CELL_WIDTH;
    const cellY = PADDING + row * CELL_HEIGHT;
    const centerX = cellX + CELL_WIDTH / 2;

    // Ring
    composites.push({
      input: ringBuf,
      left: Math.round(centerX - RING_DIAMETER / 2),
      top: cellY,
    });

    // Photo
    composites.push({
      input: valid[i].photo,
      left: Math.round(centerX - PHOTO_DIAMETER / 2),
      top: cellY + RING_WIDTH,
    });

    // Name text below photo
    try {
      const nameBuf = await renderName(valid[i].name, CELL_WIDTH);
      const nameMeta = await sharp(nameBuf).metadata();
      const nameWidth = nameMeta.width ?? CELL_WIDTH;
      composites.push({
        input: nameBuf,
        left: Math.round(centerX - nameWidth / 2),
        top: cellY + RING_DIAMETER + 6,
      });
    } catch {
      // If Pango text fails, skip name — photo is still shown
    }
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
