-- ==============================================================================
-- CENSO CEEP ADA LOVELACE - SISTEMA DE GAMIFICAÇÃO & INSÍGNIAS
-- Script de Criação e Cadastro Inicial de Insígnias (Seed)
-- Pode ser executado repetidas vezes no Supabase SQL Editor sem erros
-- ==============================================================================

-- 1. Garante que a tabela user_stats existe para sincronização ágil de XP e Insígnias
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id TEXT PRIMARY KEY,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    total_interviews INTEGER NOT NULL DEFAULT 0,
    streak_days INTEGER NOT NULL DEFAULT 0,
    badges TEXT NOT NULL DEFAULT '[]'
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_stats_select_all" ON public.user_stats;
CREATE POLICY "user_stats_select_all" ON public.user_stats 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_stats_insert_upsert" ON public.user_stats;
CREATE POLICY "user_stats_insert_upsert" ON public.user_stats 
    FOR ALL USING (true) WITH CHECK (true);


-- 2. Tabela de Catálogo Oficial de Insígnias (Badges)
CREATE TABLE IF NOT EXISTS public.badges (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50) DEFAULT 'acesso',
    rarity VARCHAR(50) DEFAULT 'comum',
    xp_reward INTEGER DEFAULT 50,
    criteria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.badges;
DROP POLICY IF EXISTS "badges_select_all" ON public.badges;
CREATE POLICY "badges_select_all" ON public.badges 
    FOR SELECT USING (true);


-- 3. Tabela Relacional de Insígnias Conquistadas (user_badges)
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    badge_id VARCHAR(100) REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User badges are viewable by everyone" ON public.user_badges;
DROP POLICY IF EXISTS "user_badges_select_all" ON public.user_badges;
CREATE POLICY "user_badges_select_all" ON public.user_badges 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "User badges are insertable" ON public.user_badges;
DROP POLICY IF EXISTS "user_badges_insert" ON public.user_badges;
CREATE POLICY "user_badges_insert" ON public.user_badges 
    FOR INSERT WITH CHECK (true);


-- 4. CADASTRO GRADUAL DAS INSÍGNIAS (SEED DATA)
INSERT INTO public.badges (id, name, description, icon, category, rarity, xp_reward, criteria)
VALUES
  -- ─── FASE 1: PRIMEIROS PASSOS & BOAS-VINDAS ────────────────────────────
  (
    'primeiro_acesso',
    'Pioneiro do Censo',
    'Entrou e desbravou a plataforma do Censo Escolar pela primeira vez.',
    '🚀',
    'acesso',
    'comum',
    50,
    'Fazer o primeiro login na plataforma'
  ),
  (
    'primeira_mensagem',
    'Primeiro Contato',
    'Enviou a primeira mensagem no Layka Chat para conectar a comunidade escolar.',
    '💬',
    'chat',
    'comum',
    30,
    'Enviar 1 mensagem no Layka Chat'
  ),
  (
    'primeiro_post',
    'Voz Ativa',
    'Compartilhou a primeira publicação ou evidência de campo no Feed.',
    '📢',
    'social',
    'comum',
    50,
    'Publicar o 1º post no Feed'
  ),
  (
    'primeira_reacao',
    'Espírito Coletivo',
    'Apoiou uma postagem de colega deixando uma curtida ou reação no Feed.',
    '❤️',
    'social',
    'comum',
    20,
    'Reagir a 1 publicação no Feed'
  ),
  (
    'perfil_completo',
    'Identidade Científica',
    'Personalizou o perfil com avatar e turma/cargo definidos.',
    '🪪',
    'perfil',
    'comum',
    40,
    'Completar foto e turma/cargo no Perfil'
  ),

  -- ─── FASE 2: PESQUISA & COLETA DE DADOS (CENSO) ─────────────────────────
  (
    'primeira_entrevista',
    'Pesquisador Estreante',
    'Realizou e registrou com rigor sua 1ª entrevista de campo do Censo.',
    '📝',
    'censo',
    'raro',
    100,
    'Coletar 1 ficha de entrevista'
  ),
  (
    'meta_5_entrevistas',
    'Pesquisador Ativo',
    'Alcançou a marca de 5 entrevistas de campo coletadas com dedicação.',
    '🎯',
    'censo',
    'raro',
    250,
    'Coletar 5 fichas de entrevista'
  ),
  (
    'meta_10_entrevistas',
    'Especialista de Campo',
    'Chegou na metade da meta máxima: 10 entrevistas concluídas com sucesso!',
    '⚡',
    'censo',
    'epico',
    500,
    'Coletar 10 fichas de entrevista'
  ),
  (
    'adinha_campea_meta_20',
    'Adinha Campeã',
    'Bateu a meta magna das 20 entrevistas de campo no Censo Escolar Ada Lovelace!',
    '🏆',
    'censo',
    'lendario',
    1000,
    'Concluir todas as 20 entrevistas de campo'
  ),

  -- ─── FASE 3: ENGAJAMENTO GRADUAL & CONEXÃO ──────────────────────────────
  (
    'comunicador_laika',
    'Tripulante Layka',
    'Enviou 10 ou mais mensagens no Layka Chat mantendo a comunicação ativa.',
    '🛰️',
    'chat',
    'raro',
    80,
    'Enviar 10 mensagens no Layka Chat'
  ),
  (
    'cronista_do_feed',
    'Cronista do Censo',
    'Publicou 5 ou mais atualizações no Feed documentando o avanço da pesquisa.',
    '📰',
    'social',
    'raro',
    120,
    'Publicar 5 postagens no Feed'
  ),
  (
    'explorador_do_saber',
    'Explorador do Saber',
    'Navegou pela Biblioteca Viva e Jornal Mercúrio descobrindo novas referências.',
    '📚',
    'exploracao',
    'comum',
    50,
    'Visitar o Jornal e a Biblioteca Viva'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  xp_reward = EXCLUDED.xp_reward,
  criteria = EXCLUDED.criteria,
  updated_at = CURRENT_TIMESTAMP;
