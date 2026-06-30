// Supabase JS client for AUTH + reads/writes that need a session (profiles,
// outfits). Reuses the public anon key/URL from lib/supabase.ts. The session is
// persisted in AsyncStorage and auto-refreshed.
//
// Reads that don't need a session (products) can keep using the lightweight REST
// helpers in lib/supabase.ts.

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON, SUPABASE_URL } from './supabase';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', // OAuth (Google) returns a ?code= to exchange for a session
  },
});
