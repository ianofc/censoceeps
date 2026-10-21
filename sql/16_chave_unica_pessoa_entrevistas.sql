-- =====================================================================
-- 16 — Chave única por PESSOA: nome normalizado + categoria (estudante / servidor)
-- Executar no Supabase SQL Editor DEPOIS do 15_unificar_duplicados_entrevistas.sql
--
-- O id continua sendo a chave primária (UUID), pois alunos_escola.entrevista_id
-- referencia esse id. A regra "uma entrevista por pessoa" passa a ser garantida
-- por um ÍNDICE ÚNICO sobre (nome normalizado, categoria):
--   • ignora maiúsculas/minúsculas, acentos, espaços extras e "da/de/do/das/dos/e"
--     → "LAIS HELENA ANJOS OLIVEIRA" = "Lais Helena Anjos de Oliveira"
--   • categoria = ESTUDANTE (ESTUDANTE_REGULAR/ESTUDANTE_TECNICO) ou SERVIDOR (demais)
--     → aluno e servidor homônimos podem coexistir (ex.: FELIPE SANTOS)
-- Nomes abreviados (MARCOS DAVI LEAL x MARCOS DAVI LEAL DA ANUNCIAÇÃO) são tratados
-- pelo aviso de "nome parecido" no app, pois o banco não tem como saber se é a mesma pessoa.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.nome_chave(txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT btrim(regexp_replace(
           regexp_replace(
             ' ' || translate(
               lower(coalesce(txt, '')),
               'áàâãäéèêëíìîïóòôõöúùûüçñ',
               'aaaaaeeeeiiiiooooouuuucn'
             ) || ' ',
             '\s(da|de|do|das|dos|e)(?=\s)', ' ', 'g'),
           '\s+', ' ', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.categoria_vinculo(v text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE WHEN upper(coalesce(v, '')) LIKE 'ESTUDANTE%' THEN 'ESTUDANTE' ELSE 'SERVIDOR' END;
$$;

-- Conferência ANTES de criar o índice: deve retornar 0 linhas.
-- Se retornar algo, unifique esses registros antes (o CREATE INDEX abaixo falharia).
SELECT public.nome_chave(nome_participante) AS chave,
       public.categoria_vinculo(vinculo)    AS categoria,
       COUNT(*)                             AS qtd,
       array_agg(nome_participante)         AS nomes,
       array_agg(id)                        AS ids
FROM public.entrevistas
GROUP BY 1, 2
HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS ux_entrevistas_pessoa
ON public.entrevistas (public.nome_chave(nome_participante), public.categoria_vinculo(vinculo))
WHERE public.nome_chave(nome_participante) NOT IN ('', 'anonimo', 'participante');
