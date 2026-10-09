-- Módulo de Ouvidoria e Apoio ao Aluno

-- Criação de tipos para padronizar os dados
DO $$ BEGIN
    CREATE TYPE ouvidoria_ticket_type AS ENUM ('Problema', 'Sugestão de Infraestrutura', 'Apoio Pedagógico', 'Outros');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ouvidoria_ticket_status AS ENUM ('Aberto', 'Em Análise', 'Resolvido', 'Fechado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela principal de Ouvidoria
CREATE TABLE IF NOT EXISTS public.ouvidoria_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tipo ouvidoria_ticket_type NOT NULL DEFAULT 'Outros',
    assunto TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    is_anonimo BOOLEAN DEFAULT false,
    status ouvidoria_ticket_status DEFAULT 'Aberto',
    resposta_admin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.ouvidoria_tickets ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS

-- 1. Qualquer usuário autenticado pode criar um ticket
CREATE POLICY "Usuários podem criar tickets"
    ON public.ouvidoria_tickets FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 2. O criador do ticket pode ver seus próprios tickets
CREATE POLICY "Usuários podem ver seus próprios tickets"
    ON public.ouvidoria_tickets FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 3. Gestores/Admins podem ver todos os tickets (assumindo uma claim ou função is_admin, deixaremos liberado para update posterior na claim de admin, ou checagem simples)
-- Para garantir anonimato, gestores não verão o user_id se is_anonimo for true (pode ser feito na view ou API).
CREATE POLICY "Admins podem visualizar todos os tickets"
    ON public.ouvidoria_tickets FOR SELECT
    TO authenticated
    USING (
        -- Exemplo genérico: substituir por sua lógica de admin
        (auth.jwt() ->> 'role' = 'admin') OR (auth.jwt() -> 'user_metadata' ->> 'is_admin' = 'true')
    );

-- 4. Admins podem atualizar tickets (responder, mudar status)
CREATE POLICY "Admins podem atualizar tickets"
    ON public.ouvidoria_tickets FOR UPDATE
    TO authenticated
    USING (
        (auth.jwt() ->> 'role' = 'admin') OR (auth.jwt() -> 'user_metadata' ->> 'is_admin' = 'true')
    );
