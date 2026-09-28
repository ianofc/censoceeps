import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        'ERRO CRÍTICO: As variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão definidas no ficheiro .env ou o servidor precisa de ser reiniciado.'
    );
}

// Inicializa o cliente garantindo que nunca passe valor nulo/undefined direto
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);