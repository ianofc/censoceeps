import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zoybjayrxbgobjtxqmic.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveWJqYXlyeGJnb2JqdHhxbWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQzNjcwMCwiZXhwIjoyMTA2MDEyNzAwfQ.IQSpHDUwuUP5a83YV9L-1qxjMma9iQAopVOFpFcWwpw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });

if (error) {
    console.error('Erro:', error.message);
    process.exit(1);
}

console.log(`Total de usuários no Supabase Auth: ${users.length}`);

// We can check with the registered list
import { readFileSync } from 'fs';
const sincFile = readFileSync('./scripts/sincronizacao_total_definitiva.js', 'utf-8');
const match = sincFile.match(/const listaOficial = (\[[\s\S]*?\]);/);
if (match) {
    const listaOficial = eval(match[1]);
    console.log(`Total na lista oficial: ${listaOficial.length}`);
    
    const authMap = new Map(users.map(u => [u.email.toLowerCase(), u]));
    
    const relatorio = listaOficial.map(item => {
        const uAuth = authMap.get(item.email.toLowerCase());
        return {
            Nome: item.nome,
            Turma: item.turma,
            Email: item.email,
            Senha: item.senha,
            Papel: item.papel,
            StatusNoAuth: uAuth ? 'Ativo' : 'Não encontrado no Auth'
        };
    });

    console.log(JSON.stringify(relatorio, null, 2));
}
