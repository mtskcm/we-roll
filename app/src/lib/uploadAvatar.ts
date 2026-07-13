// uploadAvatar — pick a photo from the library, upload it to the public
// `avatars` Supabase bucket, and save the URL to profiles.avatar_url.
// Requires expo-image-picker (dev build) + the avatars bucket (see
// supabase/avatars-schema.sql).

import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabaseClient';
import { useUserStore } from '../store/userStore';

export type AvatarResult = { url?: string; error?: string; cancelled?: boolean };

export async function pickAndUploadAvatar(): Promise<AvatarResult> {
  const { userId, updateProfile } = useUserStore.getState();
  if (!userId) return { error: 'Not signed in' };

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { error: 'Photo access denied' };

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });
  if (res.canceled || !res.assets?.[0]) return { cancelled: true };

  const uri = res.assets[0].uri;
  const path = `${userId}/avatar-${Date.now()}.jpg`;

  // RN upload: FormData with the file uri (bucket is public).
  const form = new FormData();
  form.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, form as any, { contentType: 'image/jpeg', upsert: true });
  if (upErr) return { error: upErr.message };

  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = pub.publicUrl;

  const { error: saveErr } = await updateProfile({ avatarUrl: url });
  if (saveErr) return { error: saveErr };
  return { url };
}
