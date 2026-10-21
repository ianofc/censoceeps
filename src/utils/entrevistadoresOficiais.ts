/**
 * Catálogo Canônico Oficial de Alunos Pesquisadores (1º ADM CM - Turma 06)
 * Projeto Científico Ada Lovelace — CEEP Seabra
 * 
 * Garante que todos os 38 alunos entrevistadores estejam sempre visíveis no Ranking
 * e na Auditoria (TeacherDashboard), mesmo que ainda não tenham realizado entrevistas
 * ou ainda não tenham registros na tabela 'pessoas' do Supabase.
 */

export interface EntrevistadorOficial {
  nome: string;
  turma: string;
  serie: string;
  turno: string;
}

export const LISTA_ENTREVISTADORES_OFICIAIS: EntrevistadorOficial[] = [
  { nome: "ANA JULIA TEIXEIRA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "ANA LUIZA SOUZA CERQUEIRA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "EVERTON SILVA MARTINS", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "FLÁVIA ALESSANDRA LIMA SANTOS", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "GEOVANA SANTOS", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "GUILHERMY SANTOS LIMA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "HAVILA ELOAH SANTOS BARBOSA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "HENDRIK SANTOS DE ARAUJO", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "ISADORA SANTOS RODRIGUES", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "IZABELA TEIXEIRA PINTO", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "JARBAS LEONARDO SANTOS MEDEIROS", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "JEFERSON PEREIRA DE SOUZA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "JOAO PEDRO ALCANTARA DOS ANJOS", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "JOAO VITOR ROCHA BASTOS", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "JULIA SOPHIA JESUS DA SILVA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "KLEBER SILVA DE ANDRADE", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "LAIS HELENA ANJOS OLIVEIRA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "LINE LORRANE LUIS DE SOUZA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "LUCAS SOUZA ALCANTARA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "MARIA BEATRIZ TEIXEIRA SANTOS", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "MARIA EDUARDA SANTOS SOUZA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "MARIA EDUARDA SOUZA BASTOS", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "MARLON SILVA SOUZA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "MATHEUS SILVA DA COSTA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "MICHAEL SANTOS LIMA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "MIGUEL DA SILVA LIRA NUNES", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "MIRIAN ANJOS VIEIRA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "NATALY BRENDA BARBOSA SILVA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "NICOLAS RIAN DOS SANTOS", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "PEDRO HENRIQUE BARBOSA SILVA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "RAONY GABRIEL DIAS VAZ", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "SAMANTA EVELIN BERNARDES ARAUJO", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "SAMYRA DA FONSECA TEIXEIRA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "STEFANY ALVES ROCHA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "TAYANE DA SILVA SANTOS", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "TAYLON WILLIAN OLIVEIRA SANTANA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "THAYLA SENA ROLDAO DOS SANTOS", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" },
  { nome: "YANNE KESSIA DE SOUZA ALMEIDA", turma: "1º ADM CM", serie: "1º Ano Técnico", turno: "Matutino" }
];

export const ALIASES_ENTREVISTADORES: Record<string, string> = {
  'TALYSSON': 'TAYLON WILLIAN OLIVEIRA SANTANA',
  'TALYSSON SANTANA': 'TAYLON WILLIAN OLIVEIRA SANTANA',
  'TALYSON': 'TAYLON WILLIAN OLIVEIRA SANTANA',
  'THAYLON': 'TAYLON WILLIAN OLIVEIRA SANTANA',
  'THAYLON WILLIAN': 'TAYLON WILLIAN OLIVEIRA SANTANA',
  'THAYLON WILLIAN SANTANA': 'TAYLON WILLIAN OLIVEIRA SANTANA',
  'THAYLON WILLIAN OLIVEIRA': 'TAYLON WILLIAN OLIVEIRA SANTANA',
  'THAYLON WILLIAN OLIVEIRA SANTANA': 'TAYLON WILLIAN OLIVEIRA SANTANA',
  'TAYLON': 'TAYLON WILLIAN OLIVEIRA SANTANA',
  'TAYLON WILLIAN': 'TAYLON WILLIAN OLIVEIRA SANTANA',
  'TAYLON WILLIAN SANTANA': 'TAYLON WILLIAN OLIVEIRA SANTANA',
  'JARBAS LEONARDO SANTOS MEDEIROS SOBRINHO': 'JARBAS LEONARDO SANTOS MEDEIROS',
  'JARBAS LEONARDO SOBRINHO': 'JARBAS LEONARDO SANTOS MEDEIROS',
  'JARBAS SOBRINHO': 'JARBAS LEONARDO SANTOS MEDEIROS',
  'MIRIAN VIEIRA': 'MIRIAN ANJOS VIEIRA',
  'FLAVIA ALESSANDRA LIMA SANTOS': 'FLÁVIA ALESSANDRA LIMA SANTOS',
  'FLAVIA ALESSANDRA': 'FLÁVIA ALESSANDRA LIMA SANTOS',
};

export function normalizarNome(nome?: string): string {
  const clean = (nome || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
  return ALIASES_ENTREVISTADORES[clean] || clean;
}

export interface EntrevistadorUnificado {
  id: string;
  nome_completo: string;
  email?: string;
  papel: string;
  turma_ou_cargo: string;
  avatar_url?: string;
  isOficialCadastrado?: boolean;
}

/**
 * Mescla os usuários retornados da tabela 'pessoas' com a lista canônica dos 38 alunos pesquisadores.
 * Garante que ninguém fique de fora por falha de sincronização no banco.
 */
export function mesclarEntrevistadoresOficiais(
  pessoasDb: any[] = [],
  coletas: any[] = []
): EntrevistadorUnificado[] {
  const mapaPorNome = new Map<string, EntrevistadorUnificado>();

  // 1. Indexa os pesquisadores que já estão na tabela 'pessoas' do Supabase
  pessoasDb.forEach((p) => {
    if (!p) return;
    const norm = normalizarNome(p.nome_completo);
    mapaPorNome.set(norm, {
      id: p.id,
      nome_completo: (p.nome_completo || '').trim().toUpperCase(),
      email: p.email || '',
      papel: p.papel || 'entrevistador_aluno',
      turma_ou_cargo: p.turma_ou_cargo || '1º ADM CM',
      avatar_url: p.avatar_url || '',
      isOficialCadastrado: true,
    });
  });

  // 2. Garante que todos os 38 alunos oficiais estejam presentes
  LISTA_ENTREVISTADORES_OFICIAIS.forEach((oficial) => {
    const norm = normalizarNome(oficial.nome);
    if (!mapaPorNome.has(norm)) {
      // Cria ID determinístico para aluno que ainda não logou no Supabase
      const pseudoId = `oficial-${norm.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      mapaPorNome.set(norm, {
        id: pseudoId,
        nome_completo: oficial.nome,
        email: `${norm.toLowerCase().replace(/[^a-z0-9]/g, '')}@ceeps.com`,
        papel: 'entrevistador_aluno',
        turma_ou_cargo: oficial.turma,
        avatar_url: '',
        isOficialCadastrado: false,
      });
    }
  });

  // 3. Verifica se há algum entrevistador adicional mencionado nas coletas existentes
  coletas.forEach((c) => {
    const nome = c.entrevistador?.nome_completo || c.interviewer_name;
    const eId = c.entrevistador_id || c.entrevistador?.id;
    if (nome) {
      const norm = normalizarNome(nome);
      if (!mapaPorNome.has(norm)) {
        mapaPorNome.set(norm, {
          id: eId || `coleta-${norm.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          nome_completo: nome.trim().toUpperCase(),
          papel: 'entrevistador_aluno',
          turma_ou_cargo: c.turma || 'Pesquisador Censo',
          avatar_url: '',
          isOficialCadastrado: false,
        });
      }
    }
  });

  return Array.from(mapaPorNome.values()).sort((a, b) =>
    a.nome_completo.localeCompare(b.nome_completo, 'pt-BR')
  );
}
