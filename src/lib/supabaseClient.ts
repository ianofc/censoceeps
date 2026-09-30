import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        'ERRO CRÍTICO: As variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão definidas no ficheiro .env ou o servidor precisa de ser reiniciado.'
    );
} else {
    console.log('URL carregada com sucesso:', supabaseUrl);
}

// Inicializa o cliente corretamente fora de qualquer instrução de log
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);