// tryon-gemini.mjs — AI virtual try-on via Google Gemini image model
// (gemini-2.5-flash-image, "nano-banana"). Generates a base figure from text,
// or dresses a figure with one or more garment images using a saved prompt.
//
//   GEMINI_API_KEY=... node scripts/tryon-gemini.mjs \
//     --out out.png --prompt "..." [--img base.png] [--img garment.jpg ...]
//
// With no --img it's text-to-image (use it to make the base figure). With
// images it edits/combines them per the prompt (base first, then garments).
// The key is read from the env only — never hard-code or commit it.

import fs from 'node:fs';

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image';
if (!KEY) {
  console.error('Missing GEMINI_API_KEY env var.');
  process.exit(1);
}

const args = process.argv.slice(2);
let out = 'out.png';
let prompt = '';
const imgs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = args[++i];
  else if (args[i] === '--prompt') prompt = args[++i];
  else if (args[i] === '--img') imgs.push(args[++i]);
}
if (!prompt) { console.error('Missing --prompt'); process.exit(1); }

const mimeOf = (p) => (p.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
const parts = [{ text: prompt }];
for (const p of imgs) {
  parts.push({ inline_data: { mime_type: mimeOf(p), data: fs.readFileSync(p).toString('base64') } });
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts }] }),
});
const json = await res.json();
if (!res.ok) {
  console.error('API error', res.status, JSON.stringify(json).slice(0, 500));
  process.exit(1);
}
const outParts = json?.candidates?.[0]?.content?.parts ?? [];
const imgPart = outParts.find((p) => p.inline_data || p.inlineData);
if (!imgPart) {
  const txt = outParts.map((p) => p.text).filter(Boolean).join(' ');
  console.error('No image returned.', txt ? 'Model said: ' + txt.slice(0, 300) : JSON.stringify(json).slice(0, 300));
  process.exit(1);
}
const data = (imgPart.inline_data || imgPart.inlineData).data;
fs.writeFileSync(out, Buffer.from(data, 'base64'));
console.log('wrote', out, fs.statSync(out).size + 'B');
