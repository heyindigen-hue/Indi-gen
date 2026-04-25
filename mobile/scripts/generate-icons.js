/* eslint-disable */
// One-shot generator: rasterise the brand SVGs into icon.png, adaptive-icon.png,
// splash.png, and favicon.png. Idempotent — re-run any time the SVG art changes.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.resolve(__dirname, '..', 'assets');

const tasks = [
  { src: 'flower-icon.svg',     out: 'icon.png',           size: 1024, bg: { r: 247, g: 241, b: 229 } },
  { src: 'flower-adaptive.svg', out: 'adaptive-icon.png',  size: 1024, bg: { r: 0,   g: 0,   b: 0, alpha: 0 } },
  { src: 'flower-splash.svg',   out: 'splash.png',         size: 2048, bg: { r: 247, g: 241, b: 229 } },
  { src: 'flower-icon.svg',     out: 'favicon.png',        size: 192,  bg: { r: 247, g: 241, b: 229 } },
];

async function run() {
  for (const t of tasks) {
    const srcPath = path.join(ASSETS, t.src);
    const outPath = path.join(ASSETS, t.out);
    if (!fs.existsSync(srcPath)) {
      console.warn('skip (no source):', t.src);
      continue;
    }
    await sharp(srcPath, { density: 360 })
      .resize(t.size, t.size, { fit: 'contain', background: t.bg })
      .flatten(t.bg.alpha === 0 ? false : { background: t.bg })
      .png({ quality: 92, compressionLevel: 9 })
      .toFile(outPath);
    console.log('wrote', t.out);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
