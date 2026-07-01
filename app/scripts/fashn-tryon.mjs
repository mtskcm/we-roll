// fashn-tryon.mjs — AI virtual try-on via FASHN API. Puts a garment onto a
// model/figure image. Submits a job, polls until done, downloads the result.
//
//   FASHN_API_KEY=... node scripts/fashn-tryon.mjs \
//     --model base.png --garment https://.../shirt.jpg --category tops --out out.png
//
// --model / --garment accept a local path (sent as base64) or an http(s) URL.
// --category: auto | tops | bottoms | one-pieces (default auto).
// Key is read from env only — never hard-code or commit it.

import fs from 'node:fs';

const KEY = process.env.FASHN_API_KEY;
if (!KEY) { console.error('Missing FASHN_API_KEY'); process.exit(1); }

const args = process.argv.slice(2);
let model = '', garment = '', category = 'auto', out = 'out.png', modelName = 'tryon-v1.6';
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--model') model = args[++i];
  else if (a === '--garment') garment = args[++i];
  else if (a === '--category') category = args[++i];
  else if (a === '--out') out = args[++i];
  else if (a === '--model-name') modelName = args[++i];
}

const toInput = (s) => {
  if (/^https?:\/\//.test(s)) return s;
  const b = fs.readFileSync(s).toString('base64');
  const mime = s.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${b}`;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = await fetch('https://api.fashn.ai/v1/run', {
  method: 'POST',
  headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model_name: modelName,
    inputs: { model_image: toInput(model), garment_image: toInput(garment), category },
  }),
});
const runJson = await run.json();
if (!run.ok || !runJson.id) {
  console.error('run error', run.status, JSON.stringify(runJson).slice(0, 400));
  process.exit(1);
}
const id = runJson.id;
console.log('job', id, '· polling…');

for (let i = 0; i < 60; i++) {
  await sleep(2000);
  const st = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const j = await st.json();
  if (j.status === 'completed') {
    const url = j.output?.[0];
    if (!url) { console.error('no output', JSON.stringify(j).slice(0, 300)); process.exit(1); }
    const img = await fetch(url);
    fs.writeFileSync(out, Buffer.from(await img.arrayBuffer()));
    console.log('wrote', out, fs.statSync(out).size + 'B');
    process.exit(0);
  }
  if (j.status === 'failed') { console.error('failed', JSON.stringify(j.error || j).slice(0, 300)); process.exit(1); }
  process.stdout.write(`${j.status}.`);
}
console.error('\ntimed out');
process.exit(1);
