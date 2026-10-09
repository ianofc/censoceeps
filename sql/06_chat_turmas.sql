-- sql/06_chat_turmas.sql

-- Tabela para Turmas / Grupos de Chat
CREATE TABLE IF NOT EXISTS public.chat_groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela para Membros das Turmas (vínculo aluno -> turma)
CREATE TABLE IF NOT EXISTS public.chat_group_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Tabela para Mensagens do Grupo
CREATE TABLE IF NOT EXISTS public.chat_group_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_groups
CREATE POLICY "Users can view groups they are members of" ON public.chat_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_group_members
            WHERE chat_group_members.group_id = chat_groups.id
            AND chat_group_members.user_id = auth.uid()
        )
    );

-- Políticas para chat_group_members
CREATE POLICY "Users can view members of their groups" ON public.chat_group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_group_members as cgm
            WHERE cgm.group_id = chat_group_members.group_id
            AND cgm.user_id = auth.uid()
        )
    );

-- Políticas para chat_group_messages
CREATE POLICY "Users can view messages in their groups" ON public.chat_group_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_group_members
            WHERE chat_group_members.group_id = chat_group_messages.group_id
            AND chat_group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their groups" ON public.chat_group_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_group_members
            WHERE chat_group_members.group_id = group_id
            AND chat_group_members.user_id = auth.uid()
        )
    );
