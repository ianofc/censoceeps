-- =====================================================================
-- 14 — Padroniza entrevistas.nome_participante em MAIÚSCULAS
-- Executar no Supabase: Dashboard > SQL Editor > New query > Run
-- =====================================================================

-- 1) Converte os registros já existentes (só altera o que não está em maiúscula)
UPDATE public.entrevistas
SET nome_participante = UPPER(TRIM(nome_participante))
WHERE nome_participante IS NOT NULL
  AND nome_participante IS DISTINCT FROM UPPER(TRIM(nome_participante));

-- 2) Garante maiúsculas em todo INSERT/UPDATE futuro (inclusive sync offline e edições manuais)
CREATE OR REPLACE FUNCTION public.entrevistas_nome_participante_upper()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.nome_participante IS NOT NULL THEN
    NEW.nome_participante := UPPER(TRIM(NEW.nome_participante));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_entrevistas_nome_participante_upper ON public.entrevistas;

CREATE TRIGGER trg_entrevistas_nome_participante_upper
BEFORE INSERT OR UPDATE OF nome_participante ON public.entrevistas
FOR EACH ROW
EXECUTE FUNCTION public.entrevistas_nome_participante_upper();

-- 3) Conferência: deve retornar 0
SELECT COUNT(*) AS nomes_fora_do_padrao
FROM public.entrevistas
WHERE nome_participante IS DISTINCT FROM UPPER(TRIM(nome_participante));
