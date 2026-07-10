// gen-bg-plates.mjs — builds figure-less background "plates" from the bundled
// mannequin photos. For each row we sample the left/right edge colors (pure
// background) and fill the row with a horizontal gradient between them —
// preserving the photo's vignette while erasing the figure. The app shows the
// plate as a static layer and 3D-flips only the figure column above it.
//
//   node scripts/gen-bg-plates.mjs

import Jimp from 'jimp';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'src/assets/mannequins');
const FILES = ['female.png', 'female-back.png', 'male.png', 'male-back.png'];
const EDGE = 30; // sample this far from each border, well clear of the figure

for (const file of FILES) {
  const src = path.join(DIR, file);
  const img = await Jimp.read(src);
  const { width, height } = img.bitmap;
  const out = new Jimp(width, height);

  for (let y = 0; y < height; y++) {
    const left = Jimp.intToRGBA(img.getPixelColor(EDGE, y));
    const right = Jimp.intToRGBA(img.getPixelColor(width - EDGE, y));
    for (let x = 0; x < width; x++) {
      const t = x / (width - 1);
      const r = Math.round(left.r + (right.r - left.r) * t);
      const g = Math.round(left.g + (right.g - left.g) * t);
      const b = Math.round(left.b + (right.b - left.b) * t);
      out.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
    }
  }

  const dest = path.join(DIR, file.replace(/\.png$/, '-plate.png'));
  await out.writeAsync(dest);
  console.log('wrote', dest);
}
