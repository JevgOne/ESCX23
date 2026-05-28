import sharp from 'sharp';

/**
 * Applies a "lovelygirls.cz" text watermark to an uploaded photo.
 * Returns a Buffer with the watermarked, JPEG-optimized image.
 *
 * Strategy:
 *   1. Resize down to max 1600px wide (mobile uploads are often huge).
 *   2. Render watermark text as SVG sized relative to the image.
 *   3. Composite SVG onto the bottom-right corner with low opacity.
 *   4. Re-encode as JPEG at quality 82.
 */
export async function watermarkImage(input: Buffer): Promise<Buffer> {
  // Strip EXIF & rotate based on EXIF orientation, then resize.
  const base = sharp(input).rotate().resize({ width: 1600, withoutEnlargement: true });
  const meta = await base.metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 1600;

  // Watermark text size scales with image: ~3.5% of width, min 18px.
  const fontSize = Math.max(18, Math.round(width * 0.035));
  const text = 'lovelygirls.cz';
  const padding = Math.round(fontSize * 0.7);
  const svgWidth = Math.round(text.length * fontSize * 0.55 + padding * 2);
  const svgHeight = Math.round(fontSize * 1.7);

  const svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="2" />
      <feOffset dx="0" dy="1" result="offsetblur"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.6"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <text
    x="${padding}"
    y="${Math.round(fontSize * 1.15)}"
    font-family="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
    font-size="${fontSize}"
    font-weight="600"
    fill="white"
    fill-opacity="0.55"
    filter="url(#shadow)"
    letter-spacing="0.5"
  >${text}</text>
</svg>`;

  const left = Math.max(0, width - svgWidth - Math.round(width * 0.025));
  const top = Math.max(0, height - svgHeight - Math.round(width * 0.025));

  return base
    .composite([{ input: Buffer.from(svg), top, left, blend: 'over' }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}
