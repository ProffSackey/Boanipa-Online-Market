import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storageKey: 'sb-auth-token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// server-side client without auth for API routes
export const supabaseServer = createClient(url, anonKey);

// server-side client using service role key for privileged operations
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DEVELOPER_TOKEN;
  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY or DEVELOPER_TOKEN not available');
    return null;
  }
  return createClient(url, serviceRoleKey);
};

export const supabaseAdmin = getSupabaseAdmin();

