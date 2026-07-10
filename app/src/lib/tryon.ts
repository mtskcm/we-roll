// tryon.ts — AI virtual try-on via FASHN. Dresses a plain white mannequin
// (male/female) with real product photos, chaining top → bottom. Results are
// cached per outfit so the same combo is generated only once.
//
// SECURITY: production calls go through the `fashn-tryon` Supabase Edge
// Function (signed-in users only) — the FASHN key never ships in the bundle.
// DEV fallback: if EXPO_PUBLIC_FASHN_KEY is set (app/.env, gitignored), FASHN
// is called directly — handy before the function is deployed.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

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
  // DEV path — direct FASHN call with the local key.
  if (KEY) {
    const run = await fetch(`${BASE}/run`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_name: 'tryon-v1.6',
        inputs: { model_image: modelImage, garment_image: garmentImage, category },
      }),
    });
    const j = await run.json();
    if (!run.ok || !j.id) throw new Error(j?.error?.message || JSON.stringify(j?.error) || `run ${run.status}`);
    for (let i = 0; i < 60; i++) {
      await sleep(2000);
      const st = await fetch(`${BASE}/status/${j.id}`, { headers: { Authorization: `Bearer ${KEY}` } });
      const s = await st.json();
      if (s.status === 'completed' && s.output?.[0]) return s.output[0];
      if (s.status === 'failed') throw new Error(s?.error?.message || 'Generation failed');
    }
    throw new Error('Generation timed out');
  }

  // PRODUCTION path — secure Edge Function (key stays server-side; requires a
  // signed-in Supabase session).
  const { data, error } = await supabase.functions.invoke('fashn-tryon', {
    body: { model_image: modelImage, garment_image: garmentImage, category },
  });
  if (error) throw new Error(error.message || 'Try-on service unavailable');
  if (data?.error) throw new Error(data.error);
  if (!data?.output) throw new Error('Try-on returned no image');
  return data.output as string;
}

// Dress a single garment onto whatever image is passed (the bare mannequin or
// an already-dressed figure) — so pieces stack instead of resetting. Cached per
// (input image + garment + category) so re-applying the same step is free.
export async function dressGarment(
  modelImage: string,
  garmentUrl: string,
  category: 'tops' | 'bottoms',
): Promise<string> {
  const cacheKey = `dress:v2:${category}:${garmentUrl}:${modelImage}`;
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) return cached;
  const out = await runOne(modelImage, garmentUrl, category);
  await AsyncStorage.setItem(cacheKey, out);
  return out;
}

export type TryOnRequest = { gender: Gender; topUrl?: string; bottomUrl?: string };

export async function tryOnOutfit({ gender, topUrl, bottomUrl }: TryOnRequest): Promise<string> {
  if (!topUrl && !bottomUrl) throw new Error('Pick at least one piece');
  const cacheKey = `tryon:${gender}:${topUrl || '-'}:${bottomUrl || '-'}`;
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) return cached;

  let img = MANNEQUIN[gender];
  if (topUrl) img = await runOne(img, topUrl, 'tops');
  if (bottomUrl) img = await runOne(img, bottomUrl, 'bottoms');

  await AsyncStorage.setItem(cacheKey, img);
  return img;
}
