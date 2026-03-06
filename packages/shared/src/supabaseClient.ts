import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gtwugoklzczszvueacxm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

let supabaseInstance: SupabaseClient;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  } else {
    // Anahtar yoksa dummy client (sayfa yine açılsın; auth çalışmaz)
    supabaseInstance = createClient(supabaseUrl || 'https://placeholder.supabase.co', 'placeholder-key', { auth: { persistSession: false } });
    if (typeof window !== 'undefined') {
      console.warn('Supabase: .env.local içinde NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı olmalı.');
    }
  }
} catch (e) {
  if (typeof window !== 'undefined') console.error('Supabase init:', e);
  supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-key', { auth: { persistSession: false } });
}

export const supabase = supabaseInstance;
