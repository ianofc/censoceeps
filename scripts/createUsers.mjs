import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_URL_HERE';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_KEY_HERE';

// We'll read these from .env
import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
        const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
        return {
            url: urlMatch ? urlMatch[1].trim() : '',
            key: keyMatch ? keyMatch[1].trim() : ''
        };
    } catch(e) {
        return { url: '', key: '' };
    }
}

const envVars = loadEnv();
const supabase = createClient(envVars.url, envVars.key);

async function createTestUsers() {
    const password = 'senha123';

    // User 1: Gestor
    console.log('Criando Gestor...');
    let gestor = await supabase.auth.signUp({
        email: 'gestor@censo.com',
        password: password,
    });
    
    if (gestor.data?.user) {
        await supabase.from('pessoas').upsert({
            id: gestor.data.user.id,
            nome_completo: 'Gestor Teste',
            email: 'gestor@censo.com',
            papel: 'gestor',
            turma_ou_cargo: 'Diretoria',
            genero: 'masculino'
        });
        console.log('✅ Gestor criado: gestor@censo.com /', password);
    } else {
        console.log('Erro no Gestor:', gestor.error);
    }

    // User 2: Entrevistador
    console.log('Criando Entrevistador...');
    let aluno = await supabase.auth.signUp({
        email: 'pesquisador@censo.com',
        password: password,
    });

    if (aluno.data?.user) {
        await supabase.from('pessoas').upsert({
            id: aluno.data.user.id,
            nome_completo: 'Aluno Pesquisador Teste',
            email: 'pesquisador@censo.com',
            papel: 'entrevistador_aluno',
            turma_ou_cargo: '3º Ano Info',
            genero: 'feminino'
        });
        console.log('✅ Aluno criado: pesquisador@censo.com /', password);
    } else {
        console.log('Erro no Aluno:', aluno.error);
    }
}

createTestUsers();
