import { createClient } from '@supabase/supabase-js';
const url = process.env.REACT_APP_SUPABASE_URL?.trim();
const key = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();
// Keep the default Auth storage key to preserve file sessions already created.
// Only this client signs in; the application's data client remains anonymous.
export const supabaseMedia = url && key ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
}) : null;
