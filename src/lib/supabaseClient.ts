import { createClient } from '@supabase/supabase-js';

// Valores padrão do projeto para produção / Netlify caso as variáveis não venham do .env
const DEFAULT_SUPABASE_URL = 'https://zoybjayrxbgobjtxqmic.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveWJqYXlyeGJnb2JqdHhxbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MzY3MDAsImV4cCI6MjEwNjAxMjcwMH0.ZC1VQyYyKLNW3KNc41ci3c1GNawntz7E7zjol0HNX7g';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});