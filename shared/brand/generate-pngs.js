const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname);
const outs = [
  { src: 'logo-orange-bg.svg', out: 'icon-512.png', size: 512 },
  { src: 'logo-orange-bg.svg', out: 'icon-1024.png', size: 1024 },
  { src: 'logo-orange-bg.svg', out: 'adaptive-icon.png', size: 1024 },
  { src: 'logo-dark.svg', out: 'logo-dark-256.png', size: 256 },
  { src: 'logo-light.svg', out: 'logo-light-256.png', size: 256 },
  { src: 'logo-orange-bg.svg', out: 'splash.png', size: 2048 },
  { src: 'logo-mark.svg', out: 'favicon.png', size: 64 },
];
(async () => {
  for (const o of outs) {
    await sharp(path.join(dir, o.src)).resize(o.size, o.size).png().toFile(path.join(dir, o.out));
    console.log('wrote', o.out);
  }
})();
