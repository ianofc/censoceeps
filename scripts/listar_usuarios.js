import { createClient } from '@supabase/supabase-js';

// ⚠️ ATENÇÃO: Use a SERVICE_ROLE_KEY para ter privilégios de administrador
const SUPABASE_URL = 'https://zoybjayrxbgobjtxqmic.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveWJqYXlyeGJnb2JqdHhxbWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQzNjcwMCwiZXhwIjoyMTA2MDEyNzAwfQ.IQSpHDUwuUP5a83YV9L-1qxjMma9iQAopVOFpFcWwpw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

console.log('A consultar todos os utilizadores registados na auth.users...\n');

const { data: { users }, error } = await supabase.auth.admin.listUsers();

if (error) {
    console.error('❌ Erro ao listar utilizadores:', error.message);
    process.exit(1);
}

if (!users || users.length === 0) {
    console.log('ℹ️ Nenhum utilizador encontrado na auth.users.');
} else {
    console.log(`Total de utilizadores encontrados: ${users.length}\n`);
    users.forEach((u, index) => {
        console.log(`${index + 1}. ID: ${u.id}`);
        console.log(`   E-mail: ${u.email}`);
        console.log(`   Criado em: ${u.created_at}`);
        console.log(`   Metadados:`, u.user_metadata);
        console.log('--------------------------------------------------');
    });
}