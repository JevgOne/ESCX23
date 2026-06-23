import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('app/icon.svg');

// 192x192 PNG for Chrome/Android
await sharp(svg).resize(192, 192).png().toFile('app/icon.png');
console.log('Created app/icon.png (192x192)');

// 180x180 PNG for Apple
await sharp(svg).resize(180, 180).png().toFile('app/apple-icon.png');
console.log('Created app/apple-icon.png (180x180)');

// favicon.ico — 48x48 PNG (Next.js accepts .ico as PNG-in-ICO wrapper)
await sharp(svg).resize(48, 48).png().toFile('app/favicon.ico');
console.log('Created app/favicon.ico (48x48)');
