const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zoybjayrxbgobjtxqmic.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveWJqYXlyeGJnb2JqdHhxbWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQzNjcwMCwiZXhwIjoyMTA2MDEyNzAwfQ.IQSpHDUwuUP5a83YV9L-1qxjMma9iQAopVOFpFcWwpw';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUsers() {
    console.log("Criando usuários de teste no Supabase...");
    
    const users = [
        {
            email: 'pesquisador1@ceep.edu.br',
            password: 'senha123',
            nome_completo: 'Pesquisador Um',
            papel: 'entrevistador', // trying a common role
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Um'
        },
        {
            email: 'pesquisador2@ceep.edu.br',
            password: 'senha123',
            nome_completo: 'Pesquisador Dois',
            papel: 'entrevistador',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dois'
        }
    ];

    for (const u of users) {
        // Delete if exists
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const existing = usersData?.users.find(x => x.email === u.email);
        if (existing) {
            await supabase.auth.admin.deleteUser(existing.id);
            await supabase.from('pessoas').delete().eq('id', existing.id);
        }

        // Create in auth
        const { data, error } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true
        });

        if (error) {
            console.log(`Erro ao criar ${u.email}:`, error.message);
        } else if (data.user) {
            console.log(`Usuário ${u.email} criado no Auth. ID: ${data.user.id}`);
            
            // Insert into pessoas
            const { error: dbError } = await supabase.from('pessoas').upsert({
                id: data.user.id,
                email: u.email,
                nome_completo: u.nome_completo,
                papel: 'entrevistador',
                avatar_url: u.avatar_url
            });

            if (dbError) {
                console.log(`Erro ao inserir ${u.email} na tabela pessoas:`, dbError.message);
            } else {
                console.log(`${u.email} inserido na tabela pessoas com sucesso!`);
            }
        }
    }
    console.log("Finalizado.");
}

createTestUsers();
