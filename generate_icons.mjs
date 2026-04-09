import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = './public';

const svgBuffer = Buffer.from(`
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#f59e0b"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="#ffffff" text-anchor="middle">F</text>
</svg>
`);

async function generate() {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  await sharp(svgBuffer)
    .resize(192, 192)
    .toFile(path.join(publicDir, 'icon-192x192.png'));

  await sharp(svgBuffer)
    .resize(512, 512)
    .toFile(path.join(publicDir, 'icon-512x512.png'));

  console.log('Icons generated successfully.');
}

generate().catch(console.error);
