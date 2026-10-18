import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseObrigatorioAusente = process.env.NODE_ENV === "production" && !supabaseConfigurado;

export const supabase = supabaseConfigurado
  ? createClient(supabaseUrl, supabaseAnonKey, {
      // Campaign access uses the existing code-based/anon policies. File login
      // must never change the database role of this client.
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'darkness-data-client' },
    })
  : null;
