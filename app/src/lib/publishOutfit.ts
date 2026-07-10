// publishOutfit — uploads a dressed-figure snapshot to Supabase Storage and
// inserts the outfit row, making the fit visible to EVERYONE in FITS.
//
// The FASHN CDN link expires after days, so the image is first downloaded
// locally, then uploaded to the public 'outfits' bucket; the row stores the
// permanent public URL. Requires an authenticated session (RLS: insert own).

import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabaseClient';

export type PublishInput = {
  userId: string;
  imageUrl: string;            // FASHN CDN url or local file://
  taggedProductIds: string[];  // catalog product ids worn in the fit
  name?: string;
  caption?: string;
};

export type PublishResult = { id?: string; publicUrl?: string; error?: string };

export async function publishOutfit(input: PublishInput): Promise<PublishResult> {
  try {
    const id = `fit-${Date.now()}-${input.userId.slice(0, 8)}`;

    // 1) Ensure a local file (FASHN links are remote + short-lived).
    let localUri = input.imageUrl;
    if (!localUri.startsWith('file://')) {
      const dest = `${FileSystem.cacheDirectory}${id}.png`;
      const dl = await FileSystem.downloadAsync(input.imageUrl, dest);
      if (dl.status !== 200) return { error: `Image download failed (${dl.status})` };
      localUri = dl.uri;
    }

    // 2) Upload to the public bucket (RN pattern: FormData with a file uri).
    const path = `${input.userId}/${id}.png`;
    const form = new FormData();
    form.append('file', { uri: localUri, name: `${id}.png`, type: 'image/png' } as any);
    const { error: upErr } = await supabase.storage
      .from('outfits')
      .upload(path, form as any, { contentType: 'image/png', upsert: true });
    if (upErr) return { error: upErr.message };

    const { data: pub } = supabase.storage.from('outfits').getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    // 3) Insert the outfit row.
    const { error: insErr } = await supabase.from('outfits').insert({
      id,
      user_id: input.userId,
      name: input.name ?? 'FIT',
      caption: input.caption ?? null,
      image_url: publicUrl,
      tagged_product_ids: input.taggedProductIds,
    });
    if (insErr) return { error: insErr.message };

    return { id, publicUrl };
  } catch (e: any) {
    return { error: e?.message ?? 'Publikovanie zlyhalo' };
  }
}
