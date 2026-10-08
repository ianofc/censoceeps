import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const getVal = (key) => {
      const match = envContent.match(new RegExp(`${key}=(.*)`));
      return match ? match[1].trim() : '';
    };

    const url = getVal('VITE_SUPABASE_URL') || getVal('SUPABASE_URL');
    const serviceKey = getVal('VITE_SUPABASE_SERVICE_KEY') || getVal('SUPABASE_SERVICE_KEY') || getVal('VITE_SUPABASE_ANON_KEY');
    return { url, serviceKey };
  } catch (err) {
    console.error('Erro ao ler .env:', err);
    return { url: '', serviceKey: '' };
  }
}

const { url, serviceKey } = loadEnv();
if (!url || !serviceKey) {
  console.error('Configurações do Supabase ausentes no .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function resetFeed() {
  console.log('🔄 Iniciando limpeza e redefinição do Feed...');

  // 1. Limpar comentários existentes do feed
  const { error: errComments } = await supabase
    .from('lyka_comments')
    .delete()
    .neq('id', 0);

  if (errComments) {
    console.warn('Aviso ao limpar lyka_comments:', errComments.message);
  } else {
    console.log('✅ Comentários do feed limpos com sucesso.');
  }

  // 2. Limpar reações existentes do feed
  const { error: errReactions } = await supabase
    .from('lyka_reactions')
    .delete()
    .neq('id', 0);

  if (errReactions) {
    console.warn('Aviso ao limpar lyka_reactions:', errReactions.message);
  } else {
    console.log('✅ Reações do feed limpas com sucesso.');
  }

  // 3. Limpar postagens existentes
  const { error: errPosts } = await supabase
    .from('lyka_posts')
    .delete()
    .neq('id', 0);

  if (errPosts) {
    console.error('❌ Erro ao apagar publicações em lyka_posts:', errPosts.message);
    process.exit(1);
  } else {
    console.log('✅ Todas as publicações antigas foram apagadas.');
  }

  // 4. Buscar usuário coordenador / admin (Professor Ian)
  let adminId = '0e68412b-f1c6-486e-ab00-82dcbf95c359';
  const { data: adminUser } = await supabase
    .from('pessoas')
    .select('id, nome_completo')
    .eq('id', adminId)
    .maybeSingle();

  if (adminUser) {
    adminId = adminUser.id;
  }

  const welcomeContent = 
`👋 Olá, equipe de pesquisadores(as) do CEEP Seabra! Sejam muito bem-vindos(as) ao Censo Escolar — Projeto Ada Lovelace! 🚀✨

Este aplicativo foi desenvolvido especialmente para apoiar a nossa jornada de pesquisa de campo, garantindo que os dados da nossa comunidade escolar sejam coletados com rigor, transparência e confiabilidade.

📌 ORIENTAÇÕES ESSENCIAIS PARA O USO DO APLICATIVO:

1️⃣ Coleta de Dados e Aplicação das Fichas:
• Aborde os participantes com cordialidade, empatia e explique o objetivo do Censo CEEP.
• Preencha cada pergunta da ficha socioeconômica com atenção e fidelidade às respostas do entrevistado.

2️⃣ Regras de Integridade e Validação:
• Cada participante só pode ser entrevistado UMA ÚNICA VEZ. O sistema conta com validação automática para impedir duplicidades.
• O(A) entrevistador(a) não pode entrevistar a si mesmo(a).

3️⃣ 📸 A IMPORTÂNCIA DE MANDAR EVIDÊNCIAS NO FEED (REGISTRO FUNDAMENTAL):
• O nosso Feed é o mural oficial de comprovação do trabalho em campo!
• Sempre que realizar entrevistas, tire uma foto registrando o momento com o participante ou a equipe em ação e publique aqui no Feed.
• O envio de evidências fotográficas valida o trabalho de campo perante a coordenação e os professores, atesta a autenticidade das entrevistas e cria a memória histórica do Projeto Ada Lovelace.
• Sinta-se à vontade também para compartilhar pequenos relatos, desafios superados e aprendizados da experiência!

Contamos com a energia, a dedicação e o compromisso de cada um de vocês. Um excelente trabalho a todos(as)! 🌟📊🏛️`;

  // 5. Inserir a postagem oficial de boas-vindas
  const { data: newPost, error: errInsert } = await supabase
    .from('lyka_posts')
    .insert([
      {
        user_id: adminId,
        author_name: 'Coordenação Censo CEEP · Prof. Ian Santos',
        content: welcomeContent,
        image_url: null,
        type: 'comunicado',
        created_at: new Date().toISOString()
      }
    ])
    .select();

  if (errInsert) {
    console.error('❌ Erro ao inserir publicação de boas-vindas:', errInsert.message);
    process.exit(1);
  }

  console.log('🎉 Publicação de boas-vindas e orientações inserida com sucesso:', newPost);

  // 6. Conferência final do banco
  const { data: totalPosts } = await supabase.from('lyka_posts').select('id, author_name, type, created_at');
  console.log('📊 Estado atual de lyka_posts:', totalPosts);
}

resetFeed();
