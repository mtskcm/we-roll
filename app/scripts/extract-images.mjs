import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = resolve(homedir(), 'Downloads/werol-feed.html');
const OUT_DIR = resolve(__dirname, '../src/assets/images');

const html = readFileSync(HTML_PATH, 'utf8');

const re = /data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)/g;
const matches = [...html.matchAll(re)];

if (matches.length < 4) {
  console.error(`Found only ${matches.length} base64 images. Expected at least 4.`);
  process.exit(1);
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const seen = new Set();
let written = 0;
for (const m of matches) {
  if (written >= 4) break;
  const [, ext, b64] = m;
  const buf = Buffer.from(b64, 'base64');
  if (buf.length < 5000) continue;
  const hash = createHash('sha1').update(buf).digest('hex');
  if (seen.has(hash)) continue;
  seen.add(hash);
  const n = written + 1;
  const outExt = ext === 'jpeg' ? 'jpg' : ext;
  const outPath = resolve(OUT_DIR, `product-${n}.${outExt}`);
  writeFileSync(outPath, buf);
  console.log(`Wrote ${outPath} (${Math.round(buf.length / 1024)} KB)`);
  written++;
}

if (written < 4) {
  console.error(`Only wrote ${written} images. Source may not have 4 distinct large base64 blobs.`);
  process.exit(1);
}

console.log('Done.');
