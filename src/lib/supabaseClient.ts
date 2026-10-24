import { createClient } from '@supabase/supabase-js';

// Valores padrão públicos do projeto para produção / Netlify caso as variáveis não venham do .env
const DEFAULT_SUPABASE_URL = 'https://zoybjayrxbgobjtxqmic.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveWJqYXlyeGJnb2JqdHhxbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MzY3MDAsImV4cCI6MjEwNjAxMjcwMH0.ZC1VQyYyKLNW3KNc41ci3c1GNawntz7E7zjol0HNX7g';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Mantido como alias para compatibilidade de imports existentes sem expor service_role no bundle público
export const supabaseAdmin = supabase;

/**
 * Normaliza strings para comparações seguras sem acento e sem caixa alta.
 */
export function normalizeName(str?: string): string {
  return (str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(professor|professora|prof|profa|aluno|aluna|estudante|tio|tia)\.?\s+/gi, '')
    .trim();
}

const NAME_CONNECTORS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

/** Palavras significativas do nome (sem acento, sem título e sem conectores como "de/da/do"). */
export function nameWords(str?: string): string[] {
  return normalizeName(str)
    .split(/\s+/)
    .filter((w) => w.length > 0 && !NAME_CONNECTORS.has(w));
}

/**
 * Chave canônica para detectar a MESMA pessoa com nome idêntico,
 * ignorando acentos, caixa, espaços extras e conectores (ex: "ANJOS OLIVEIRA" == "ANJOS DE OLIVEIRA").
 */
export function nameKey(str?: string): string {
  return nameWords(str).join(' ');
}

/**
 * Nomes parecidos mas não idênticos: um é abreviação do outro
 * (mesmo primeiro nome e todas as palavras do nome menor estão no maior).
 * Ex: "MARCOS DAVI LEAL" x "MARCOS DAVI LEAL DA ANUNCIAÇÃO".
 */
export function isSimilarName(a?: string, b?: string): boolean {
  const wa = nameWords(a);
  const wb = nameWords(b);
  if (wa.length === 0 || wb.length === 0) return false;
  if (wa.join(' ') === wb.join(' ')) return false;
  const [shorter, longer] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  if (shorter.length < 2 || shorter[0] !== longer[0]) return false;
  return shorter.every((w) => longer.includes(w));
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(val?: string | null): boolean {
  return Boolean(val && UUID_REGEX.test(val.trim()));
}

/**
 * Mapeia e sanitiza rigorosamente qualquer objeto de coleta para as colunas exatas da tabela 'entrevistas'.
 * Evita erros PostgREST como PGRST204 (colunas inexistentes na tabela como user_id, grupo_escolar, etc)
 * e erros 22P02 de UUID inválido (ex: 'offline-user').
 */
export function formatEntrevistaPayload(item: any, fallbackInterviewerId?: string) {
  const candidates = [item.entrevistador_id, item.user_id, fallbackInterviewerId];
  const interviewerId = candidates.find((c) => isValidUuid(c)) || null;

  // Unifica relato de preconceito
  const relato = item.relato_preconceito || item.relato_sofreu || item.relato_presenciou || null;

  const rawNome = (item.nome_participante?.trim() || item.nome?.trim() || 'PARTICIPANTE').toUpperCase();
  const faixaEtaria = item.faixa_etaria || item.idade || null;

  // Unificação e validação estrita de gênero: apenas Masculino ou Feminino
  let rawGenero = item.genero?.trim() || null;
  let generoCanonico: string | null = null;
  if (rawGenero) {
    const gLow = rawGenero.toLowerCase();
    if (gLow.includes('fem') || gLow.includes('mulher')) {
      generoCanonico = 'Feminino';
    } else if (gLow.includes('masc') || gLow.includes('homem') || gLow.includes('máscara')) {
      generoCanonico = 'Masculino';
    }
  }

  return {
    entrevistador_id: interviewerId,
    nome_participante: rawNome,
    faixa_etaria: faixaEtaria ? String(faixaEtaria).trim() : null,
    contato_whatsapp: item.contato_whatsapp?.trim() || item.telefone?.trim() || null,
    vinculo: item.vinculo || 'ESTUDANTE_REGULAR',
    serie: item.serie?.trim() || null,
    turma: item.turma?.trim() || null,
    turno: item.turno || 'Matutino',
    cidade_natal: item.cidade_natal?.trim() || 'Seabra',
    local_moradia: item.local_moradia || item.localizacao_moradia || 'Sede de Seabra',
    detalhe_localizacao: item.detalhe_localizacao?.trim() || null,
    cor_raca: item.cor_raca || 'Parda',
    origem_familia: item.origem_familia || 'Mista / Diversa',
    povo_indigena: item.povo_indigena?.trim() || null,
    cor_raca_influencia: item.cor_raca_influencia || null,
    espacos_influencia: Array.isArray(item.espacos_influencia) ? item.espacos_influencia : null,
    ambientes_conversa: Array.isArray(item.ambientes_conversa) ? item.ambientes_conversa : null,
    conhece_ancestralidade: item.conhece_ancestralidade || null,
    ja_conversou_sobre: item.ja_conversou_sobre || null,
    sofreu_preconceito: item.sofreu_preconceito || 'Não',
    locais_ocorrencia: Array.isArray(item.locais_ocorrencia) ? item.locais_ocorrencia : null,
    formas_ocorrencia: Array.isArray(item.formas_ocorrencia) ? item.formas_ocorrencia : null,
    relato_preconceito: relato ? String(relato).trim() : null,
    mora_com: item.mora_com || null,
    orientacao_sexual: item.orientacao_sexual || null,
    religiao: item.religiao || null,
    tempo_deslocamento: item.tempo_deslocamento || null,
    renda_familiar: item.renda_familiar || null,
    acesso_internet: item.acesso_internet || null,
    risco_evasao: item.risco_evasao || null,
    genero: generoCanonico,
    created_at: item.created_at || new Date().toISOString(),
  };
}

/**
 * Se o participante entrevistado for uma pessoa já cadastrada na tabela 'pessoas' (aluno ou professor),
 * atualiza seus dados (como gênero, cidade, telefone, bairro) de acordo com o censo preenchido.
 */
export async function syncPessoaDataFromInterview(nome: string, dados: {
  genero?: string | null;
  cidade?: string | null;
  telefone?: string | null;
  local_moradia?: string | null;
}) {
  try {
    const nomeLimpo = (nome || '').trim();
    if (!nomeLimpo || nomeLimpo.toLowerCase() === 'anonimo' || nomeLimpo.toLowerCase() === 'anônimo') return;

    const normTarget = normalizeName(nomeLimpo);
    if (!normTarget) return;

    // Filtra no banco pelo primeiro/último nome antes de um scan amplo para reduzir tráfego e evitar limite de 1000 linhas
    const rawWords = nomeLimpo
      .replace(/^(professor|professora|prof|profa|aluno|aluna|estudante|tio|tia)\.?\s+/gi, '')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    let pessoas: { id: string; nome_completo: string }[] | null = null;

    if (rawWords.length > 0) {
      const firstWord = rawWords[0];
      const lastWord = rawWords[rawWords.length - 1];
      const filterExpr =
        firstWord.toLowerCase() !== lastWord.toLowerCase()
          ? `nome_completo.ilike.%${firstWord}%,nome_completo.ilike.%${lastWord}%`
          : `nome_completo.ilike.%${firstWord}%`;

      const { data: filteredPessoas } = await supabase
        .from('pessoas')
        .select('id, nome_completo')
        .or(filterExpr)
        .limit(100);

      if (filteredPessoas && filteredPessoas.length > 0) {
        pessoas = filteredPessoas;
      }
    }

    // Fallback caso o filtro inicial não encontre candidatos (ex: acentuação diferente no banco)
    if (!pessoas || pessoas.length === 0) {
      const { data: allPessoas } = await supabase
        .from('pessoas')
        .select('id, nome_completo')
        .limit(1000);
      pessoas = allPessoas;
    }

    if (!pessoas || pessoas.length === 0) return;

    // 1. Busca exata
    let matched = pessoas.find((p) => normalizeName(p.nome_completo) === normTarget);

    // 2. Busca por substring
    if (!matched) {
      matched = pessoas.find((p) => {
        const normP = normalizeName(p.nome_completo);
        return normP.includes(normTarget) || normTarget.includes(normP);
      });
    }

    // 3. Busca por subconjunto de palavras (ex: 'Ian Santos' casa com 'Ian da Silva Almeida Santos')
    if (!matched) {
      const targetWords = normTarget.split(/\s+/).filter((w) => w.length > 2);
      if (targetWords.length > 0) {
        matched = pessoas.find((p) => {
          const pWords = normalizeName(p.nome_completo).split(/\s+/);
          return targetWords.every((tw) => pWords.includes(tw));
        });
      }
    }

    if (matched) {
      const updates: Record<string, string> = {};

      if (dados.genero) {
        const gLow = dados.genero.toLowerCase().trim();
        if (gLow.includes('masc') || gLow === 'homem') updates.genero = 'masculino';
        else if (gLow.includes('fem') || gLow === 'mulher') updates.genero = 'feminino';
        else updates.genero = 'outro';
      }

      if (dados.cidade) {
        updates.cidade = dados.cidade.trim();
      }

      if (dados.telefone) {
        updates.telefone = dados.telefone.trim();
      }

      if (dados.local_moradia) {
        updates.bairro = dados.local_moradia.trim();
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('pessoas')
          .update(updates)
          .eq('id', matched.id);
        console.info(`[Sync Pessoa] Dados atualizados para ${matched.nome_completo}:`, updates);
      }
    }
  } catch (err) {
    console.warn('[Sync Pessoa] Aviso ao sincronizar dados com pessoas:', err);
  }
}

/**
 * Sincroniza o registro na tabela dedicada 'alunos_escola' quando uma entrevista é concluída,
 * marcando ja_entrevistado = true e preenchendo serie/turma/turno usando filtro exato por nome_normalizado.
 */
export async function syncAlunoEscolaFromInterview(dados: {
  nome_participante?: string | null;
  entrevistador_id?: string | null;
  entrevista_id?: string | null;
  serie?: string | null;
  turma?: string | null;
  turno?: string | null;
}) {
  try {
    const normUpper = normalizeName(dados.nome_participante || '').toUpperCase();
    if (!normUpper || normUpper === 'ANONIMO') return;

    const updates: Record<string, any> = {
      ja_entrevistado: true,
      updated_at: new Date().toISOString(),
    };
    if (isValidUuid(dados.entrevistador_id)) updates.entrevistador_id = dados.entrevistador_id;
    if (isValidUuid(dados.entrevista_id)) updates.entrevista_id = dados.entrevista_id;
    if (dados.serie?.trim()) updates.serie = dados.serie.trim();
    if (dados.turma?.trim()) updates.turma = dados.turma.trim();
    if (dados.turno?.trim()) updates.turno = dados.turno.trim();

    await supabase
      .from('alunos_escola')
      .update(updates)
      .eq('nome_normalizado', normUpper);
  } catch {
    // Silencioso caso a tabela ainda não tenha sido criada no Supabase ou esteja offline
  }
}

/**
 * Salva a entrevista no Supabase com resiliência e verificação otimizada de duplicidade.
 * Em seguida sincroniza o cadastro do entrevistado na tabela 'pessoas'.
 */
export async function salvarEntrevistaResiliente(rawPayload: any, interviewerId?: string) {
  const payload = formatEntrevistaPayload(rawPayload, interviewerId);

  // 0. Bloqueio estrito de duplicidade: cada pessoa só pode ser entrevistada 1 única vez
  try {
    const normTarget = normalizeName(payload.nome_participante);
    if (normTarget && normTarget !== 'anonimo') {
      const rawWords = payload.nome_participante
        .replace(/^(professor|professora|prof|profa|aluno|aluna|estudante|tio|tia)\.?\s+/gi, '')
        .trim()
        .split(/\s+/)
        .filter((w) => w.length >= 2);

      let existingRows: any[] | null = null;

      if (rawWords.length > 0) {
        const firstWord = rawWords[0];
        const lastWord = rawWords[rawWords.length - 1];
        const filterExpr =
          firstWord.toLowerCase() !== lastWord.toLowerCase()
            ? `nome_participante.ilike.%${firstWord}%,nome_participante.ilike.%${lastWord}%`
            : `nome_participante.ilike.%${firstWord}%`;

        const { data: filteredRows } = await supabase
          .from('entrevistas')
          .select('*')
          .or(filterExpr)
          .limit(100);

        existingRows = filteredRows;
      } else {
        const { data: fallbackRows } = await supabase
          .from('entrevistas')
          .select('*')
          .ilike('nome_participante', payload.nome_participante);
        existingRows = fallbackRows;
      }

      const targetKey = nameKey(payload.nome_participante);
      const matchedExisting = (existingRows || []).find((r) => {
        return nameKey(r.nome_participante) === targetKey;
      });

      if (matchedExisting) {
        console.info(`[Supabase Insert] Participante "${payload.nome_participante}" já cadastrado(a) (ID ${matchedExisting.id}). Impedindo duplicidade.`);

        // Se a nova chamada trouxer campos que antes estavam vazios ou o nome não estiver em maiúsculas, enriquece o registro existente
        const patchUpdates: Record<string, any> = {};
        if (matchedExisting.nome_participante !== payload.nome_participante) {
          patchUpdates.nome_participante = payload.nome_participante;
        }
        const enrichableFields = [
          'faixa_etaria', 'contato_whatsapp', 'relato_preconceito', 'genero', 'cidade_natal',
          'local_moradia', 'detalhe_localizacao', 'mora_com', 'tempo_deslocamento',
          'acesso_internet', 'risco_evasao', 'povo_indigena', 'conhece_ancestralidade',
          'ja_conversou_sobre', 'cor_raca_influencia', 'espacos_influencia',
          'ambientes_conversa', 'locais_ocorrencia', 'formas_ocorrencia'
        ] as const;

        for (const field of enrichableFields) {
          // Só tenta atualizar faixa_etaria se a coluna existir no registro retornado do banco
          if (field === 'faixa_etaria' && !('faixa_etaria' in matchedExisting)) continue;
          const val = (payload as any)[field];
          const existingVal = (matchedExisting as any)[field];
          const hasNewVal = val !== null && val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0);
          const isEmptyExisting = existingVal === null || existingVal === undefined || existingVal === '' || (Array.isArray(existingVal) && existingVal.length === 0);
          if (hasNewVal && isEmptyExisting) {
            patchUpdates[field] = val;
          }
        }

        if (Object.keys(patchUpdates).length > 0) {
          await supabase.from('entrevistas').update(patchUpdates).eq('id', matchedExisting.id);
          console.info(`[Supabase Insert] Registro existente complementado com novos dados:`, patchUpdates);
        }

        // Sincroniza dados com a tabela pessoas e alunos_escola se aplicável
        void syncPessoaDataFromInterview(payload.nome_participante, {
          genero: payload.genero || matchedExisting.genero,
          cidade: payload.cidade_natal || matchedExisting.cidade_natal,
          telefone: payload.contato_whatsapp || matchedExisting.contato_whatsapp,
          local_moradia: payload.local_moradia || matchedExisting.local_moradia,
        });
        void syncAlunoEscolaFromInterview({
          nome_participante: payload.nome_participante,
          entrevistador_id: payload.entrevistador_id || matchedExisting.entrevistador_id,
          entrevista_id: matchedExisting.id,
          serie: payload.serie || matchedExisting.serie,
          turma: payload.turma || matchedExisting.turma,
          turno: payload.turno || matchedExisting.turno,
        });

        return { data: [matchedExisting], error: null };
      }
    }
  } catch (checkErr) {
    console.warn('[Supabase Insert] Erro ao checar duplicidade prévia, prosseguindo com inserção:', checkErr);
  }

  // 1. Tenta inserir via cliente padrão
  const { data, error } = await supabase
    .from('entrevistas')
    .insert([payload])
    .select();

  if (!error) {
    void syncPessoaDataFromInterview(payload.nome_participante, {
      genero: payload.genero,
      cidade: payload.cidade_natal,
      telefone: payload.contato_whatsapp,
      local_moradia: payload.local_moradia,
    });
    void syncAlunoEscolaFromInterview({
      nome_participante: payload.nome_participante,
      entrevistador_id: payload.entrevistador_id,
      entrevista_id: data?.[0]?.id,
      serie: payload.serie,
      turma: payload.turma,
      turno: payload.turno,
    });
    return { data, error: null };
  }

  // Índice único (nome + categoria) no banco já tem essa pessoa: não é erro de rede, não deve ir para a fila offline
  if (error.code === '23505') {
    console.info(`[Supabase Insert] "${payload.nome_participante}" já existe no banco (índice único). Ignorando duplicata.`);
    return { data: [], error: null };
  }

  // 2. Se falhar por coluna inexistente no schema remoto (ex: PGRST204 para faixa_etaria), remove o campo e tenta novamente
  if (error.code === 'PGRST204' || String(error.message || '').includes('faixa_etaria')) {
    const { faixa_etaria: _omit, ...safePayload } = payload;
    const { data: retryData, error: retryError } = await supabase
      .from('entrevistas')
      .insert([safePayload])
      .select();

    if (!retryError) {
      void syncPessoaDataFromInterview(payload.nome_participante, {
        genero: payload.genero,
        cidade: payload.cidade_natal,
        telefone: payload.contato_whatsapp,
        local_moradia: payload.local_moradia,
      });
      void syncAlunoEscolaFromInterview({
        nome_participante: payload.nome_participante,
        entrevistador_id: payload.entrevistador_id,
        entrevista_id: retryData?.[0]?.id,
        serie: payload.serie,
        turma: payload.turma,
        turno: payload.turno,
      });
      return { data: retryData, error: null };
    }
    console.error('[Supabase Insert] Falha definitiva ao inserir entrevista após fallback de schema:', retryError);
    return { data: null, error: retryError };
  }

  console.error('[Supabase Insert] Falha definitiva ao inserir entrevista:', error);
  return { data: null, error };
}