-- =====================================================================
-- 15 — Unifica entrevistas duplicadas da mesma pessoa (mesmo cargo/turma)
-- Executar no Supabase: Dashboard > SQL Editor > New query > Run
--
-- Regra: mantém o registro com o NOME MAIS COMPLETO, copia para ele os campos
-- que estavam vazios a partir dos duplicados e depois apaga os duplicados.
-- Homônimos de cargo/turma diferentes NÃO são unificados
-- (ex.: FELIPE SANTOS MARTINS aluno x FELIPE SANTOS servidor Polo UAB;
--       CARLOS EDUARDO 2º B x CARLOS EDUARDO 2º A / 3º D).
-- Tudo roda numa transação: se algo falhar, nada é alterado.
-- =====================================================================

BEGIN;

CREATE TEMP TABLE merge_map (keep_id uuid, dup_id uuid) ON COMMIT DROP;

INSERT INTO merge_map (keep_id, dup_id) VALUES
  -- MARCOS DAVI LEAL DA ANUCIAÇÃO (vice-diretor)  <=  MARCOS DAVI LEAL
  ('89192979-8ee0-4441-ad52-bf0245ee4aff', 'e4800cd8-891e-4402-8ff9-d102720a2fe6'),
  -- LAIS HELENA ANJOS DE OLIVEIRA (1º ADM)  <=  LAIS HELENA ANJOS OLIVEIRA (2 registros)
  ('b660d2ca-a5c1-4a06-8591-0005539a1b59', '27d3cb96-099b-446b-b85b-570d54b14a10'),
  ('b660d2ca-a5c1-4a06-8591-0005539a1b59', '7ead9354-6f19-4f92-af8b-34da3249fb3b'),
  -- PEDRO HENRIQUE BARBOSA SILVA (1º técnico ADM C)  <=  registro repetido
  ('2d4faed1-d775-40f9-90e2-99a31779d052', '9eeebd6c-88d3-459d-b79e-3b340c772b17'),
  -- SAVIO CAVALCANTE SOUZA (2º A)  <=  SAVIO CAVALCANTE
  ('3e59e852-7ecb-4510-b574-1ef36cb310e5', '8085cdf3-fc77-4d0e-9b54-f71c5fc9d348');

-- 1) Completa o registro mantido com dados que só existiam nos duplicados
UPDATE public.entrevistas k
SET
  contato_whatsapp       = COALESCE(k.contato_whatsapp, d.contato_whatsapp),
  genero                 = COALESCE(k.genero, d.genero),
  serie                  = COALESCE(k.serie, d.serie),
  turma                  = COALESCE(k.turma, d.turma),
  detalhe_localizacao    = COALESCE(k.detalhe_localizacao, d.detalhe_localizacao),
  povo_indigena          = COALESCE(k.povo_indigena, d.povo_indigena),
  cor_raca_influencia    = COALESCE(k.cor_raca_influencia, d.cor_raca_influencia),
  espacos_influencia     = COALESCE(k.espacos_influencia, d.espacos_influencia),
  ambientes_conversa     = COALESCE(k.ambientes_conversa, d.ambientes_conversa),
  locais_ocorrencia      = COALESCE(k.locais_ocorrencia, d.locais_ocorrencia),
  formas_ocorrencia      = COALESCE(k.formas_ocorrencia, d.formas_ocorrencia),
  relato_preconceito     = COALESCE(k.relato_preconceito, d.relato_preconceito),
  mora_com               = COALESCE(k.mora_com, d.mora_com),
  orientacao_sexual      = COALESCE(k.orientacao_sexual, d.orientacao_sexual),
  religiao               = COALESCE(k.religiao, d.religiao),
  tempo_deslocamento     = COALESCE(k.tempo_deslocamento, d.tempo_deslocamento),
  renda_familiar         = COALESCE(k.renda_familiar, d.renda_familiar),
  acesso_internet        = COALESCE(k.acesso_internet, d.acesso_internet),
  risco_evasao           = COALESCE(k.risco_evasao, d.risco_evasao),
  conhece_ancestralidade = COALESCE(k.conhece_ancestralidade, d.conhece_ancestralidade),
  ja_conversou_sobre     = COALESCE(k.ja_conversou_sobre, d.ja_conversou_sobre)
FROM merge_map m
JOIN public.entrevistas d ON d.id = m.dup_id
WHERE k.id = m.keep_id;

-- 2) Aponta referências em alunos_escola para o registro mantido
UPDATE public.alunos_escola a
SET entrevista_id = m.keep_id
FROM merge_map m
WHERE a.entrevista_id = m.dup_id;

-- 3) Remove os duplicados
DELETE FROM public.entrevistas e
USING merge_map m
WHERE e.id = m.dup_id;

-- 4) Garante nomes em MAIÚSCULAS (caso o script 14 ainda não tenha sido rodado)
UPDATE public.entrevistas
SET nome_participante = UPPER(TRIM(nome_participante))
WHERE nome_participante IS DISTINCT FROM UPPER(TRIM(nome_participante));

COMMIT;

-- Conferência: deve listar 1 linha por pessoa
SELECT id, nome_participante, vinculo, serie, turma
FROM public.entrevistas
WHERE nome_participante ILIKE ANY (ARRAY['MARCOS DAVI%', 'LAIS HELENA%', 'PEDRO HENRIQUE BARBOSA%', 'SAVIO CAVALCANTE%'])
ORDER BY nome_participante;
