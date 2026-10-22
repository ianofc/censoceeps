/**
 * Motor Algorítmico TAS (Tecnologia Ada Social & Recomendação Preditiva)
 * Projeto Científico Ada Lovelace — CEEP Seabra
 * 
 * Cada usuário experimenta um feed personalizado conforme seu perfil, turma,
 * estágio na jornada de pesquisa e afinidades comportamentais.
 */

export interface TASUserProfile {
  id: string;
  nomeCompleto: string;
  papel: string;
  turmaOuCargo: string;
  genero?: string;
  totalFichas?: number;
  interesses?: Record<string, number>;
}

export interface PostFeed {
  id: number;
  user_id: string;
  author_name: string;
  content: string;
  image_url?: string;
  type: string;
  created_at: string;
  likes_count?: number;
  liked?: boolean;
  comments_count?: number;
  // Campos calculados pelo TAS
  tasScore?: number;
  tasRecomendacaoMotivo?: string;
}

export interface TASRecomendacaoColega {
  nome: string;
  turma: string;
  serie: string;
  turno: string;
  motivo: string;
  icone: string;
}

/**
 * Normaliza strings para cruzamento seguro
 */
function norm(s?: string): string {
  return (s || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Calcula a pontuação algorítmica de relevância de uma postagem para o usuário atual
 */
export function calcularScoreTAS(post: PostFeed, user: TASUserProfile): { score: number; motivo?: string } {
  let score = 100;
  let motivo: string | undefined = undefined;

  const authorNorm = post.author_name.toLowerCase().trim();
  const isCoordenacaoOuOficial =
    post.type === 'comunicado' ||
    post.type === 'official' ||
    post.type === 'aviso' ||
    authorNorm.includes('ian da silva') ||
    authorNorm === 'ian santos' ||
    authorNorm === 'prof. ian santos' ||
    authorNorm.includes('juliana dias') ||
    authorNorm.includes('coordenac') ||
    authorNorm.includes('coordenaç');

  // 1. Comunicados Oficiais têm prioridade máxima garantida para toda a escola
  if (isCoordenacaoOuOficial) {
    return { score: 1000, motivo: '📌 Comunicado Oficial da Coordenação Censitária' };
  }

  // 2. Afinidade por Turma (Colegas da mesma sala geram maior engajamento social)
  const userTurma = norm(user.turmaOuCargo);
  const postContent = norm(post.content);
  const authorName = norm(post.author_name);

  if (userTurma && postContent.includes(userTurma)) {
    score += 150;
    motivo = `👥 Destaque da sua turma (${user.turmaOuCargo})`;
  }

  // 3. Conquistas & Marcos Científicos (Meta 20, badges)
  const isConquista = post.type === 'conquista' || post.type === 'conquista_censo' || postContent.includes('META') || postContent.includes('🏆');
  if (isConquista) {
    score += 120;
    motivo = motivo || '🏆 Marco científico de celebração coletiva';
  }

  // 4. Evidências de Campo (Fotos com participantes)
  if (post.image_url) {
    score += 80;
    motivo = motivo || '📸 Evidência fotográfica de campo validada';
  }

  // 5. Engajamento social orgânico (Reações e comentários)
  const curtidas = post.likes_count || 0;
  const comentarios = post.comments_count || 0;
  score += Math.min(curtidas * 8 + comentarios * 15, 100);

  // 6. Adaptação comportamental pelo Estágio da Jornada do Usuário
  const fichas = user.totalFichas ?? 0;
  if (fichas === 0) {
    // Iniciante sem coleta: dar boost em postagens inspiradoras e dicas práticas
    if (postContent.includes('DICA') || postContent.includes('COMEÇ') || postContent.includes('PRIMEIR')) {
      score += 90;
      motivo = '💡 Sugestão do Algoritmo TAS para você iniciar suas coletas';
    }
  } else if (fichas >= 20) {
    // Campeão: prioriza postagens de análises, parabenizações e próximos passos
    if (postContent.includes('CERTIFICADO') || postContent.includes('ANÁLISE') || postContent.includes('DADOS')) {
      score += 70;
    }
  }

  // 7. Decaimento temporal suave (postagens muito antigas perdem pontos suavemente)
  const horasPassadas = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
  score -= Math.min(horasPassadas * 1.5, 60);

  // 8. Se o próprio usuário postou
  if (post.user_id === user.id) {
    score += 40;
    motivo = '✨ Sua publicação';
  }

  // 9. Retroalimentação por Afinidade de Interesses das Enquetes e Opiniões Estudantis
  const interesses = user.interesses || {};
  const tagsInteresse: Record<string, string[]> = {
    tecnologia: ['TECNOLOGIA', 'PROGRAMACAO', 'IA', 'ALGORITMO', 'COMPUTACAO', 'INFORMATICA', 'ROBO'],
    alimentacao: ['MERENDA', 'REFEITORIO', 'ALIMENTACAO', 'LANCHE', 'FRUTA'],
    transporte: ['TRANSPORTE', 'ONIBUS', 'DESLOCAMENTO', 'DISTANCIA', 'RURAL'],
    ciencias: ['CIENCIA', 'FEIRA', 'PESQUISA', 'PROJETO', 'LOVELACE', 'CENSO', 'ESTATISTICA'],
    vestibular: ['VESTIBULAR', 'ENEM', 'UNIVERSIDADE', 'UNEB', 'CURSO', 'FACULDADE'],
    estudos: ['ESTUDO', 'LIVRO', 'AULA', 'BIBLIOTECA', 'MONITORIA'],
  };

  const postTokens = new Set(postContent.split(/[\s,.;:!?()/-]+/));

  for (const [tema, palavras] of Object.entries(tagsInteresse)) {
    const pesoTema = interesses[tema] || 0;
    if (pesoTema > 0) {
      const match = palavras.some(p => {
        const pNorm = norm(p);
        if (pNorm.length <= 3) {
          return postTokens.has(pNorm);
        }
        return postContent.includes(pNorm);
      });
      if (match) {
        score += Math.min(pesoTema * 35, 140);
        motivo = motivo || `🎯 Conteúdo alinhado aos seus interesses (${tema})`;
      }
    }
  }

  // 10. Priorização de Notícias Educacionais e Oportunidades Curadas
  if ((post as any).is_external_news || post.type === 'noticia_curada') {
    score += 65;
    motivo = motivo || '📰 Oportunidade e Notícia para o CEEP';
  }

  return { score: Math.round(score), motivo };
}

/**
 * Registra o tempo de tela (dwell time) em um post para retroalimentar o modelo de atenção implícito
 */
export function registrarDwellTimeTAS(postId: number, seconds: number, postCategory?: string) {
  if (seconds < 2) return;
  try {
    const dwellMap: Record<string, number> = JSON.parse(localStorage.getItem('censo_tas_dwell_time') || '{}');
    dwellMap[String(postId)] = (dwellMap[String(postId)] || 0) + seconds;
    localStorage.setItem('censo_tas_dwell_time', JSON.stringify(dwellMap));

    if (postCategory && seconds >= 4) {
      const userInterests: Record<string, number> = JSON.parse(localStorage.getItem('censo_tas_user_interests') || '{}');
      userInterests[postCategory] = (userInterests[postCategory] || 0) + 1;
      localStorage.setItem('censo_tas_user_interests', JSON.stringify(userInterests));
    }
  } catch {}
}

/**
 * Carrega o vetor de interesses atual do aluno extraído das enquetes e leituras
 */
export function carregarInteressesUsuarioTAS(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem('censo_tas_user_interests') || '{}');
  } catch {
    return {};
  }
}

/**
 * Ranqueia e personaliza a lista de posts para a aba "Para Você"
 */
export function personalizarFeedTAS(posts: PostFeed[], user: TASUserProfile): PostFeed[] {
  return posts
    .map((p) => {
      const { score, motivo } = calcularScoreTAS(p, user);
      return {
        ...p,
        tasScore: score,
        tasRecomendacaoMotivo: motivo,
      };
    })
    .sort((a, b) => (b.tasScore ?? 0) - (a.tasScore ?? 0));
}

/**
 * Gera recomendações de colegas da mesma sala ou de turmas próximas que ainda não foram entrevistados
 * (Tática de crescimento estilo 'People You May Know' do Facebook adaptada para coleta censitária)
 */
export function sugerirColegasParaEntrevistar(
  catalogoAlunos: any[],
  entrevistadosExistentes: Map<string, string>,
  user: TASUserProfile,
  limite: number = 4
): TASRecomendacaoColega[] {
  const userTurmaNorm = norm(user.turmaOuCargo);
  const userNomeNorm = norm(user.nomeCompleto);

  // 1. Prioriza colegas da mesma sala que ainda não foram entrevistados
  const daMesmaSala: TASRecomendacaoColega[] = [];
  const deOutrasTurmas: TASRecomendacaoColega[] = [];

  for (const aluno of catalogoAlunos) {
    const nome = aluno.nome_completo;
    const nomeNorm = norm(nome);

    if (nomeNorm === userNomeNorm) continue; // não entrevista a si mesmo
    if (entrevistadosExistentes.has(nomeNorm)) continue; // já foi entrevistado

    const turmaAlunoNorm = norm(aluno.turma || aluno.turma_codigo);
    const ehMesmaSala = userTurmaNorm && turmaAlunoNorm && (userTurmaNorm.includes(turmaAlunoNorm) || turmaAlunoNorm.includes(userTurmaNorm));

    const item: TASRecomendacaoColega = {
      nome,
      turma: aluno.turma || aluno.turma_codigo || 'CEEP Seabra',
      serie: aluno.serie || 'Ensino Técnico',
      turno: aluno.turno || 'Matutino',
      motivo: ehMesmaSala ? 'Mesma sala que você' : 'Aluno da escola disponível',
      icone: ehMesmaSala ? '🏫' : '🎒',
    };

    if (ehMesmaSala) {
      daMesmaSala.push(item);
    } else {
      deOutrasTurmas.push(item);
    }

    if (daMesmaSala.length >= limite) break;
  }

  return [...daMesmaSala, ...deOutrasTurmas].slice(0, limite);
}
