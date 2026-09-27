import { createClient } from '@supabase/supabase-js';

// Lê do window (injetado via /config.js) ou do import.meta.env (no dev do Vite)
const supabaseUrl = window.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = window.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);