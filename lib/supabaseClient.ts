import { createClient } from '@supabase/supabase-js';

// Doğru proje: gtwugoklzczszvueacxm (.env.local'da da aynı olmalı)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gtwugoklzczszvueacxm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Supabase: .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı olmalı.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
