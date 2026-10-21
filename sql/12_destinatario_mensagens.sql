-- sql/12_destinatario_mensagens.sql
-- Adiciona e preenche automaticamente as colunas de destinatário (recipient_id e recipient_name) na tabela lyka_messages

-- 1. Adicionar colunas de destinatário na tabela lyka_messages
ALTER TABLE public.lyka_messages
ADD COLUMN IF NOT EXISTS recipient_id text,
ADD COLUMN IF NOT EXISTS recipient_name text;

-- 2. Função que extrai o ID do destinatário a partir da conversation_key e busca o nome em 'pessoas'
CREATE OR REPLACE FUNCTION public.fill_lyka_recipient()
RETURNS TRIGGER AS $$
DECLARE
  part1 text;
  part2 text;
  target_id text;
BEGIN
  IF NEW.conversation_key IS NULL THEN
    NEW.recipient_id := NULL;
    NEW.recipient_name := 'Chat Geral';
  ELSIF NEW.conversation_key = 'adinha_chat' OR NEW.conversation_key LIKE 'adinha_chat_%' THEN
    NEW.recipient_id := COALESCE(NEW.recipient_id, 'adinha');
    NEW.recipient_name := COALESCE(NEW.recipient_name, 'Assistente Adinha');
  ELSE
    part1 := split_part(NEW.conversation_key, '_', 1);
    part2 := split_part(NEW.conversation_key, '_', 2);

    IF part1 = NEW.user_id::text THEN
      target_id := part2;
    ELSE
      target_id := part1;
    END IF;

    NEW.recipient_id := COALESCE(NEW.recipient_id, target_id);

    IF NEW.recipient_name IS NULL THEN
      SELECT nome_completo INTO NEW.recipient_name
      FROM public.pessoas
      WHERE id::text = NEW.recipient_id
      LIMIT 1;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger para preencher automaticamente em novas mensagens
DROP TRIGGER IF EXISTS trg_fill_lyka_recipient ON public.lyka_messages;
CREATE TRIGGER trg_fill_lyka_recipient
BEFORE INSERT OR UPDATE OF conversation_key, user_id
ON public.lyka_messages
FOR EACH ROW
EXECUTE FUNCTION public.fill_lyka_recipient();

-- 4. Atualizar todas as mensagens que já existem na tabela
UPDATE public.lyka_messages
SET conversation_key = conversation_key;
