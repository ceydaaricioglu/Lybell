import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dxlpmaamgvfbzjzogdkw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TijZXEix3Pu4UyarYALbWQ_Zt08xhQ6';

// Supabase URL ve Key kontrolü
if (!supabaseUrl || supabaseUrl === '') {
  console.error('Supabase URL is missing. Please set NEXT_PUBLIC_SUPABASE_URL environment variable.');
}

if (!supabaseAnonKey || supabaseAnonKey === '') {
  console.error('Supabase Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
