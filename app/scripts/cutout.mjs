// cutout.mjs — turn a flat-lay product photo (garment on a uniform light
// background) into a transparent-background PNG of just the garment.
//
// Method: flood-fill from the image border, clearing every pixel within a
// colour threshold of the corner (background) colour. Interior light parts of
// the garment are preserved because they are not connected to the border.
// Then crop to the garment's bounding box so it fills the frame.
//
//   node scripts/cutout.mjs <input.jpg|url> <output.png> [threshold]
//
// Env: T=<threshold> (default 36, 0-441 RGB distance).

import Jimp from 'jimp';

const [, , input, output, thrArg] = process.argv;
const THRESHOLD = Number(thrArg ?? process.env.T ?? 36);

if (!input || !output) {
  console.error('usage: node scripts/cutout.mjs <input> <output.png> [threshold]');
  process.exit(1);
}

const img = await Jimp.read(input);
const { width: W, height: H, data } = img.bitmap;

// Background colour = average of the four corners.
let br = 0, bg = 0, bb = 0;
for (const [x, y] of [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]]) {
  const i = (y * W + x) * 4;
  br += data[i]; bg += data[i + 1]; bb += data[i + 2];
}
br /= 4; bg /= 4; bb /= 4;

const visited = new Uint8Array(W * H);
const stack = [];
const push = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const p = y * W + x;
  if (visited[p]) return;
  visited[p] = 1;
  stack.push(p);
};
for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }

const isBg = (i) => {
  const dr = data[i] - br, dg = data[i + 1] - bg, db = data[i + 2] - bb;
  return Math.sqrt(dr * dr + dg * dg + db * db) <= THRESHOLD;
};

let cleared = 0;
while (stack.length) {
  const p = stack.pop();
  const i = p * 4;
  if (!isBg(i)) continue; // hit the garment edge — stop spreading here
  data[i + 3] = 0;        // background → transparent
  cleared++;
  const x = p % W, y = (p / W) | 0;
  push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
}

// Bounding box of the remaining (opaque) garment pixels.
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] !== 0) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
}
if (maxX >= minX && maxY >= minY) {
  const pad = 6;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
  img.crop(minX, minY, maxX - minX + 1, maxY - minY + 1);
}

await img.writeAsync(output);
const pct = ((cleared / (W * H)) * 100).toFixed(1);
console.log(`cutout: ${output} · bg cleared ${pct}% · cropped ${img.bitmap.width}x${img.bitmap.height}`);
