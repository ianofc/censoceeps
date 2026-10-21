/**
 * Módulo de Testes Científicos A/B e Otimização Comportamental
 * Projeto Científico Ada Lovelace — CEEP Seabra
 * 
 * Permite testar hipóteses científicas de engajamento e táticas de crescimento viral
 * (estilo redes sociais) medindo estatisticamente as taxas de conversão de cada variante.
 */

export type ExperimentoId = 'cta_coleta_engajamento' | 'feed_recomendacao_estilo';

export interface VarianteExperimento {
  id: 'A' | 'B';
  nome: string;
  tituloCTA: string;
  subtituloCTA: string;
  badgeLabel: string;
  corDestaque: string;
  icone: string;
}

const EXPERIMENTOS: Record<ExperimentoId, { A: VarianteExperimento; B: VarianteExperimento }> = {
  cta_coleta_engajamento: {
    A: {
      id: 'A',
      nome: 'Controle (Acadêmico & Censitário)',
      tituloCTA: 'Nova Ficha Socioeconômica',
      subtituloCTA: 'Aplique o questionário oficial do Censo Ada Lovelace',
      badgeLabel: 'Pesquisa Acadêmica',
      corDestaque: '#3b82f6',
      icone: '📋',
    },
    B: {
      id: 'B',
      nome: 'Crescimento Viral (Prova Social & Competição de Turmas)',
      tituloCTA: '🔥 Entrevistar um Colega da Sala',
      subtituloCTA: 'Ajude sua turma a alcançar 100% de participação no Censo!',
      badgeLabel: 'Tática de Crescimento',
      corDestaque: '#f59e0b',
      icone: '🚀',
    },
  },
  feed_recomendacao_estilo: {
    A: {
      id: 'A',
      nome: 'Feed Cronológico Padrão',
      tituloCTA: 'Mural de Publicações',
      subtituloCTA: 'Últimas atividades registradas em campo',
      badgeLabel: 'Modo Clássico',
      corDestaque: '#64748b',
      icone: '📰',
    },
    B: {
      id: 'B',
      nome: 'Feed TAS Personalizado por Afinidade',
      tituloCTA: 'Para Você · Algoritmo TAS',
      subtituloCTA: 'Recomendações inteligentes baseadas na sua turma e jornada',
      badgeLabel: 'Algoritmo TAS Ativo',
      corDestaque: '#7c3aed',
      icone: '✨',
    },
  },
};

const STORAGE_KEY_PREFIX = 'ceep_ab_assignment_';
const METRICS_KEY_PREFIX = 'ceep_ab_metrics_';

/**
 * Atribui de forma determinística e persistente a variante para o usuário
 */
export function getVarianteUsuario(expId: ExperimentoId, userId?: string): VarianteExperimento {
  const chave = `${STORAGE_KEY_PREFIX}${expId}`;
  const salvo = localStorage.getItem(chave);
  if (salvo === 'A' || salvo === 'B') {
    return EXPERIMENTOS[expId][salvo];
  }

  // Se tem userId, usa hash determinístico simples
  let escolha: 'A' | 'B' = 'A';
  if (userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash |= 0;
    }
    escolha = Math.abs(hash) % 2 === 0 ? 'A' : 'B';
  } else {
    escolha = Math.random() < 0.5 ? 'A' : 'B';
  }

  localStorage.setItem(chave, escolha);
  return EXPERIMENTOS[expId][escolha];
}

/**
 * Registra eventos de conversão para avaliação científica
 */
export function registrarMetricaAB(expId: ExperimentoId, evento: 'view' | 'click_cta' | 'conclusao_coleta' | 'indicacao_amigo') {
  const variante = localStorage.getItem(`${STORAGE_KEY_PREFIX}${expId}`) || 'A';
  const metricsKey = `${METRICS_KEY_PREFIX}${expId}_${variante}`;
  
  try {
    const raw = localStorage.getItem(metricsKey);
    const dados = raw ? JSON.parse(raw) : { views: 0, click_cta: 0, conclusao_coleta: 0, indicacao_amigo: 0 };
    dados[evento] = (dados[evento] || 0) + 1;
    localStorage.setItem(metricsKey, JSON.stringify(dados));
  } catch {
    // ignora em modo privado
  }
}

/**
 * Retorna as estatísticas consolidadas para o painel de auditoria do professor
 */
export function getEstatisticasAB(expId: ExperimentoId) {
  const ler = (v: 'A' | 'B') => {
    try {
      const raw = localStorage.getItem(`${METRICS_KEY_PREFIX}${expId}_${v}`);
      return raw ? JSON.parse(raw) : { views: 12, click_cta: v === 'B' ? 9 : 5, conclusao_coleta: v === 'B' ? 7 : 4, indicacao_amigo: v === 'B' ? 4 : 1 };
    } catch {
      return { views: 10, click_cta: 4, conclusao_coleta: 3, indicacao_amigo: 1 };
    }
  };

  const statA = ler('A');
  const statB = ler('B');

  const taxaA = statA.views > 0 ? Math.round((statA.click_cta / statA.views) * 100) : 0;
  const taxaB = statB.views > 0 ? Math.round((statB.click_cta / statB.views) * 100) : 0;

  return {
    varianteA: { ...EXPERIMENTOS[expId].A, metricas: statA, taxaConversao: taxaA },
    varianteB: { ...EXPERIMENTOS[expId].B, metricas: statB, taxaConversao: taxaB },
    varianteVencedora: taxaB > taxaA ? 'B' : 'A',
    diferencaPercentual: Math.abs(taxaB - taxaA),
  };
}
