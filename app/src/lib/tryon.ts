// tryon.ts — AI virtual try-on via FASHN. Dresses a plain white mannequin
// (male/female) with real product photos, chaining top → bottom. Results are
// cached per outfit so the same combo is generated only once.
//
// DEV NOTE: the FASHN key is read from EXPO_PUBLIC_FASHN_KEY (app/.env, gitignored).
// EXPO_PUBLIC_* vars are embedded in the app bundle — fine for a private dev
// build, but before any public release move this call behind a Supabase Edge
// Function so the key never ships to the device.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = process.env.EXPO_PUBLIC_FASHN_KEY;
const BASE = 'https://api.fashn.ai/v1';
const RAW = 'https://raw.githubusercontent.com/mtskcm/we-roll/main/app/src/assets/mannequins';

export type Gender = 'female' | 'male';

// ?v bumped whenever the mannequin images change, to bust the image/HTTP cache
export const MANNEQUIN: Record<Gender, string> = {
  female: `${RAW}/female.png?v=2`,
  male: `${RAW}/male.png?v=2`,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runOne(modelImage: string, garmentImage: string, category: 'tops' | 'bottoms'): Promise<string> {
  const run = await fetch(`${BASE}/run`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_name: 'tryon-v1.6',
      inputs: {
        model_image: modelImage,
        garment_image: garmentImage,
        category,               // explicit tops/bottoms → correct region
        mode: 'quality',        // best fit accuracy (slower)
        garment_photo_type: 'auto',
        segmentation_free: false,
      },
    }),
  });
  const j = await run.json();
  if (!run.ok || !j.id) throw new Error(j?.error?.message || JSON.stringify(j?.error) || `run ${run.status}`);
  for (let i = 0; i < 60; i++) {
    await sleep(2000);
    const st = await fetch(`${BASE}/status/${j.id}`, { headers: { Authorization: `Bearer ${KEY}` } });
    const s = await st.json();
    if (s.status === 'completed' && s.output?.[0]) return s.output[0];
    if (s.status === 'failed') throw new Error(s?.error?.message || 'Generovanie zlyhalo');
  }
  throw new Error('Vypršal čas generovania');
}

// Dress a single garment onto whatever image is passed (the bare mannequin or
// an already-dressed figure) — so pieces stack instead of resetting. Cached per
// (input image + garment + category) so re-applying the same step is free.
export async function dressGarment(
  modelImage: string,
  garmentUrl: string,
  category: 'tops' | 'bottoms',
): Promise<string> {
  if (!KEY) throw new Error('Chýba FASHN kľúč (EXPO_PUBLIC_FASHN_KEY v app/.env)');
  const cacheKey = `dress:${category}:${garmentUrl}:${modelImage}`;
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) return cached;
  const out = await runOne(modelImage, garmentUrl, category);
  await AsyncStorage.setItem(cacheKey, out);
  return out;
}

export type TryOnRequest = { gender: Gender; topUrl?: string; bottomUrl?: string };

export async function tryOnOutfit({ gender, topUrl, bottomUrl }: TryOnRequest): Promise<string> {
  if (!KEY) throw new Error('Chýba FASHN kľúč (EXPO_PUBLIC_FASHN_KEY v app/.env)');
  if (!topUrl && !bottomUrl) throw new Error('Vyber aspoň jeden kúsok');
  const cacheKey = `tryon:${gender}:${topUrl || '-'}:${bottomUrl || '-'}`;
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) return cached;

  let img = MANNEQUIN[gender];
  if (topUrl) img = await runOne(img, topUrl, 'tops');
  if (bottomUrl) img = await runOne(img, bottomUrl, 'bottoms');

  await AsyncStorage.setItem(cacheKey, img);
  return img;
}
