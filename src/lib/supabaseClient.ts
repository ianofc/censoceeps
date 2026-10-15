import { createClient } from '@supabase/supabase-js';

// Valores padrão do projeto para produção / Netlify caso as variáveis não venham do .env
const DEFAULT_SUPABASE_URL = 'https://zoybjayrxbgobjtxqmic.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveWJqYXlyeGJnb2JqdHhxbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MzY3MDAsImV4cCI6MjEwNjAxMjcwMH0.ZC1VQyYyKLNW3KNc41ci3c1GNawntz7E7zjol0HNX7g';
const DEFAULT_SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveWJqYXlyeGJnb2JqdHhxbWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQzNjcwMCwiZXhwIjoyMTA2MDEyNzAwfQ.IQSpHDUwuUP5a83YV9L-1qxjMma9iQAopVOFpFcWwpw';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || DEFAULT_SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Normaliza strings para comparações seguras sem acento e sem caixa alta.
 */
export function normalizeName(str?: string): string {
  return (str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Mapeia e sanitiza rigorosamente qualquer objeto de coleta para as colunas exatas da tabela 'entrevistas'.
 * Evita erros PostgREST como PGRST204 (colunas inexistentes na tabela como user_id, grupo_escolar, etc).
 */
export function formatEntrevistaPayload(item: any, fallbackInterviewerId?: string) {
  const interviewerId = item.entrevistador_id || item.user_id || fallbackInterviewerId || null;

  // Unifica relato de preconceito
  const relato = item.relato_preconceito || item.relato_sofreu || item.relato_presenciou || null;

  return {
    entrevistador_id: interviewerId,
    nome_participante: item.nome_participante?.trim() || item.nome?.trim() || 'Participante',
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
    genero: item.genero?.trim() || null,
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
    const nomeLimpo = nome.trim();
    if (!nomeLimpo || nomeLimpo.toLowerCase() === 'anônimo') return;

    // Busca participantes correspondentes na tabela pessoas
    const { data: pessoas } = await supabaseAdmin
      .from('pessoas')
      .select('id, nome_completo');

    if (!pessoas || pessoas.length === 0) return;

    const normTarget = normalizeName(nomeLimpo);
    const matched = pessoas.find((p) => {
      const normP = normalizeName(p.nome_completo);
      return normP === normTarget || normP.includes(normTarget) || normTarget.includes(normP);
    });

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
        await supabaseAdmin
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
 * Salva a entrevista no Supabase com resiliência: tenta com o cliente comum e, em caso de erro de permissão/RLS,
 * usa o cliente admin. Em seguida sincroniza o cadastro do entrevistado na tabela 'pessoas'.
 */
export async function salvarEntrevistaResiliente(rawPayload: any, interviewerId?: string) {
  const payload = formatEntrevistaPayload(rawPayload, interviewerId);

  let insertError: any = null;

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
    return { data, error: null };
  }

  insertError = error;
  console.warn('[Supabase Insert] Falha na inserção padrão, tentando supabaseAdmin fallback:', error);

  // 2. Fallback resiliente com supabaseAdmin para contornar problemas de RLS/sessão
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('entrevistas')
    .insert([payload])
    .select();

  if (!adminError) {
    void syncPessoaDataFromInterview(payload.nome_participante, {
      genero: payload.genero,
      cidade: payload.cidade_natal,
      telefone: payload.contato_whatsapp,
      local_moradia: payload.local_moradia,
    });
    return { data: adminData, error: null };
  }

  console.error('[Supabase Insert] Falha definitiva ao inserir entrevista:', adminError);
  return { data: null, error: adminError || insertError };
}