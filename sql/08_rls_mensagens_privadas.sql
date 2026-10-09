-- Política RLS para garantir privacidade no chat direto (LykaChat)
-- Apenas os utilizadores envolvidos na conversa ou um administrador ('gestor') podem ler as mensagens.

-- 1. Habilitar o RLS na tabela lyka_messages (se não estiver já habilitado)
ALTER TABLE public.lyka_messages ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas de leitura (ajuste o nome se a política atual tiver outro nome)
DROP POLICY IF EXISTS "Permitir leitura de todas as mensagens" ON public.lyka_messages;
DROP POLICY IF EXISTS "Mensagens privadas" ON public.lyka_messages;

-- 3. Criar a política de leitura rigorosa
CREATE POLICY "Mensagens diretas privadas e mensagens de grupo"
  ON public.lyka_messages
  FOR SELECT
  USING (
    -- Mensagens do chat geral (sem conversation_key) são públicas
    conversation_key IS NULL 
    OR
    -- O utilizador faz parte da conversa (a chave tem o formato 'ID1_ID2')
    conversation_key LIKE '%' || auth.uid()::text || '%' 
    OR
    -- O utilizador é o administrador / gestor
    EXISTS (
      SELECT 1 FROM public.pessoas 
      WHERE id = auth.uid() AND papel = 'gestor'
    )
  );

-- 4. Política de Inserção (Qualquer utilizador autenticado pode enviar)
CREATE POLICY "Permitir envio de mensagens"
  ON public.lyka_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- 5. Política de Eliminação e Edição (Apenas o próprio autor pode apagar/editar a sua mensagem)
CREATE POLICY "Permitir edição/eliminação ao autor"
  ON public.lyka_messages
  FOR ALL
  USING (auth.uid() = user_id);
