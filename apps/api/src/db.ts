import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`[db] Fatal: environment variable ${name} is not set.`);
    console.error(`[db] The API cannot start without Supabase credentials.`);
    console.error(`[db] Copy .env.example to .env and fill in the values, then restart.`);
    process.exit(1);
  }
  return val;
}

const supabaseUrl = requireEnv('SUPABASE_URL');
const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');
const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);
