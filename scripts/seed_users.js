import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.includes('SUBSTITUA')) {
  console.error("❌ ERRO: Configure a SUPABASE_SERVICE_KEY corretamente no ficheiro .env");
  process.exit(1);
}

// Cria cliente Supabase com a chave service_role (Admin API)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const defaultPassword = 'Ceep@2025';

const usersToSeed = [
  // Professores (Admin)
  { email: 'ian@escola.com', name: 'Professor Ian', role: 'teacher', class_or_sector: 'Docente' },
  { email: 'juliana@escola.com', name: 'Professora Juliana', role: 'teacher', class_or_sector: 'Docente' },
  
  // Alunos (Entrevistadores)
  { name: 'Ana Julia Teixeira' },
  { name: 'Ana Luiza Souza Cerqueira' },
  { name: 'Everton Silva Martins' },
  { name: 'Geovana Santos' },
  { name: 'Guilhermy Santos Lima' },
  { name: 'Havila Eloah Santos Barbosa' },
  { name: 'Hendrik Santos de Araujo' },
  { name: 'Isadora Santos Rodrigues' },
  { name: 'Izabela Teixeira Pinto' },
  { name: 'Jarbas Leonardo Santos Medeiros' },
  { name: 'Jeferson Pereira de Souza' },
  { name: 'Joao Pedro Alcantara dos Anjos' },
  { name: 'Joao Vitor Rocha Bastos' },
  { name: 'Julia Sophia Jesus da Silva' },
  { name: 'Kleber Silva de Andrade' },
  { name: 'Lais Helena Anjos Oliveira' },
  { name: 'Line Lorrane Luis de Souza' },
  { name: 'Lucas Souza Alcantara' },
  { name: 'Maria Beatriz Teixeira Santos' },
  { name: 'Maria Eduarda Santos Souza' },
  { name: 'Maria Eduarda Souza Bastos' },
  { name: 'Marlon Silva Souza' },
  { name: 'Matheus Silva da Costa' },
  { name: 'Michael Santos Lima' },
  { name: 'Miguel da Silva Lira Nunes' },
  { name: 'Mirian Anjos Vieira' },
  { name: 'Nataly Brenda Barbosa Silva' },
  { name: 'Nicolas Rian dos Santos' },
  { name: 'Pedro Henrique Barbosa Silva' },
  { name: 'Raony Gabriel Dias Vaz' },
  { name: 'Samanta Evelin Bernardes Araujo' },
  { name: 'Samyra da Fonseca Teixeira' },
  { name: 'Stefany Alves Rocha' },
  { name: 'Taylon Willian Oliveira Santana' },
  { name: 'Thayla Sena Roldao dos Santos' },
  { name: 'Yanne Kessia de Souza Almeida' }
];

async function seed() {
  console.log(`🚀 Iniciando Seed de ${usersToSeed.length} usuários...`);
  
  for (const u of usersToSeed) {
    const email = u.email || `${u.name.toLowerCase().replace(/ /g, '.').normalize("NFD").replace(/[\u0300-\u036f]/g, "")}@aluno.ceep.com`;
    const role = u.role || 'student';
    const class_or_sector = u.class_or_sector || 'Iniciação Científica';

    console.log(`⏳ Processando: ${u.name} (${email})...`);

    // 1. Cria usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: defaultPassword,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already exists') || authError.message.includes('already been registered')) {
        console.log(`   ✅ Já existe no Auth: ${email}`);
      } else {
        console.error(`   ❌ Erro ao criar no Auth: ${authError.message}`);
        continue;
      }
    }

    // Pega o ID (seja recém criado ou já existente buscando via list)
    let userId = authData?.user?.id;
    if (!userId) {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData.users.find(x => x.email === email);
      if (existing) userId = existing.id;
    }

    if (userId) {
      // 2. Cria registro no Profiles
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: u.name,
        role: role,
        class_or_sector: class_or_sector
      });

      if (profileError) {
        console.error(`   ❌ Erro ao criar Perfil: ${profileError.message}`);
      } else {
        console.log(`   ✅ Perfil criado/atualizado para ${u.name}!`);
      }
    }
  }

  console.log('🎉 Seed finalizado com sucesso!');
}

seed();
