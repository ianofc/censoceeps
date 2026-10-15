import { supabase } from '../lib/supabaseClient';

export type BadgeCategory = 'acesso' | 'social' | 'chat' | 'censo' | 'exploracao' | 'perfil';
export type BadgeRarity = 'comum' | 'raro' | 'epico' | 'lendario';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  xpReward: number;
  criteria: string;
  order: number;
}

export interface UserEarnedBadge {
  badgeId: string;
  earnedAt: string;
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  // ─── FASE 1: PRIMEIROS PASSOS & BOAS-VINDAS ────────────────────────────
  {
    id: 'primeiro_acesso',
    name: 'Pioneiro do Censo',
    description: 'Entrou e desbravou a plataforma do Censo Escolar pela primeira vez.',
    icon: '🚀',
    category: 'acesso',
    rarity: 'comum',
    xpReward: 50,
    criteria: 'Fazer o primeiro login na plataforma',
    order: 1,
  },
  {
    id: 'primeira_mensagem',
    name: 'Primeiro Contato',
    description: 'Enviou a primeira mensagem no Layka Chat para conectar a comunidade escolar.',
    icon: '💬',
    category: 'chat',
    rarity: 'comum',
    xpReward: 30,
    criteria: 'Enviar 1 mensagem no Layka Chat',
    order: 2,
  },
  {
    id: 'primeiro_post',
    name: 'Voz Ativa',
    description: 'Compartilhou a primeira publicação ou evidência de campo no Feed.',
    icon: '📢',
    category: 'social',
    rarity: 'comum',
    xpReward: 50,
    criteria: 'Publicar o 1º post no Feed',
    order: 3,
  },
  {
    id: 'primeira_reacao',
    name: 'Espírito Coletivo',
    description: 'Apoiou uma postagem de colega deixando uma curtida ou reação no Feed.',
    icon: '❤️',
    category: 'social',
    rarity: 'comum',
    xpReward: 20,
    criteria: 'Reagir a 1 publicação no Feed',
    order: 4,
  },
  {
    id: 'perfil_completo',
    name: 'Identidade Científica',
    description: 'Personalizou o perfil com avatar e turma/cargo definidos.',
    icon: '🪪',
    category: 'perfil',
    rarity: 'comum',
    xpReward: 40,
    criteria: 'Completar foto e turma/cargo no Perfil',
    order: 5,
  },

  // ─── FASE 2: PESQUISA & COLETA DE DADOS ─────────────────────────────────
  {
    id: 'primeira_entrevista',
    name: 'Pesquisador Estreante',
    description: 'Realizou e registrou com rigor sua 1ª entrevista de campo do Censo.',
    icon: '📝',
    category: 'censo',
    rarity: 'raro',
    xpReward: 100,
    criteria: 'Coletar 1 ficha de entrevista',
    order: 6,
  },
  {
    id: 'meta_5_entrevistas',
    name: 'Pesquisador Ativo',
    description: 'Alcançou a marca de 5 entrevistas de campo coletadas com dedicação.',
    icon: '🎯',
    category: 'censo',
    rarity: 'raro',
    xpReward: 250,
    criteria: 'Coletar 5 fichas de entrevista',
    order: 7,
  },
  {
    id: 'meta_10_entrevistas',
    name: 'Especialista de Campo',
    description: 'Chegou na metade da meta máxima: 10 entrevistas concluídas com sucesso!',
    icon: '⚡',
    category: 'censo',
    rarity: 'epico',
    xpReward: 500,
    criteria: 'Coletar 10 fichas de entrevista',
    order: 8,
  },
  {
    id: 'adinha_campea_meta_20',
    name: 'Adinha Campeã',
    description: 'Bateu a meta magna das 20 entrevistas de campo no Censo Escolar Ada Lovelace!',
    icon: '🏆',
    category: 'censo',
    rarity: 'lendario',
    xpReward: 1000,
    criteria: 'Concluir todas as 20 entrevistas de campo',
    order: 9,
  },

  // ─── FASE 3: ENGAJAMENTO GRADUAL & CONEXÃO ──────────────────────────────
  {
    id: 'comunicador_laika',
    name: 'Tripulante Layka',
    description: 'Enviou 10 ou mais mensagens no Layka Chat mantendo a comunicação ativa.',
    icon: '🛰️',
    category: 'chat',
    rarity: 'raro',
    xpReward: 80,
    criteria: 'Enviar 10 mensagens no Layka Chat',
    order: 10,
  },
  {
    id: 'cronista_do_feed',
    name: 'Cronista do Censo',
    description: 'Publicou 5 ou mais atualizações no Feed documentando o avanço da pesquisa.',
    icon: '📰',
    category: 'social',
    rarity: 'raro',
    xpReward: 120,
    criteria: 'Publicar 5 postagens no Feed',
    order: 11,
  },
  {
    id: 'explorador_do_saber',
    name: 'Explorador do Saber',
    description: 'Navegou pela Biblioteca Viva e Jornal Mercúrio descobrindo novas referências.',
    icon: '📚',
    category: 'exploracao',
    rarity: 'comum',
    xpReward: 50,
    criteria: 'Visitar o Jornal e a Biblioteca Viva',
    order: 12,
  },
];

const LOCAL_STORAGE_PREFIX = 'ceep_badges_';
const EXPLORATION_STORAGE_PREFIX = 'ceep_visited_';

/**
 * Converte qualquer representação armazenada em UserEarnedBadge[] normalizado.
 */
function normalizeBadges(raw: any): UserEarnedBadge[] {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.map((item: any) => {
    if (typeof item === 'string') {
      return { badgeId: item, earnedAt: new Date().toISOString() };
    }
    if (item && typeof item === 'object') {
      return {
        badgeId: item.badgeId || item.badge_id || item.id || '',
        earnedAt: item.earnedAt || item.earned_at || item.conquistado_em || new Date().toISOString(),
      };
    }
    return null;
  }).filter((item): item is UserEarnedBadge => !!item && !!item.badgeId);
}

export const badgeService = {
  /**
   * Retorna todo o catálogo de insígnias ordenado.
   */
  getAllBadges(): BadgeDefinition[] {
    return [...BADGE_CATALOG].sort((a, b) => a.order - b.order);
  },

  /**
   * Busca as insígnias desbloqueadas do usuário (localStorage + user_stats).
   */
  async getUserBadges(userId: string): Promise<UserEarnedBadge[]> {
    if (!userId) return [];

    // 1. Tenta carregar do cache local primeiro para resposta instantânea
    let localBadges: UserEarnedBadge[] = [];
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}`);
      if (stored) {
        localBadges = normalizeBadges(stored);
      }
    } catch (e) {
      console.warn('[BadgeService] Erro ao ler localStorage:', e);
    }

    // 2. Consulta tabela user_stats no Supabase
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('badges')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data?.badges) {
        const remoteBadges = normalizeBadges(data.badges);
        
        // Mescla garantindo unicidade por badgeId
        const map = new Map<string, UserEarnedBadge>();
        localBadges.forEach(b => map.set(b.badgeId, b));
        remoteBadges.forEach(b => map.set(b.badgeId, b));

        const merged = Array.from(map.values());
        try {
          localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${userId}`, JSON.stringify(merged));
        } catch {
          // ignora quota exceeded
        }
        return merged;
      }
    } catch (err) {
      console.warn('[BadgeService] Falha ao consultar user_stats no Supabase:', err);
    }

    return localBadges;
  },

  /**
   * Concede uma insígnia ao usuário se ainda não a possuir.
   * Dispara confete e modal de celebração apenas quando conquistada em ação direta (!silent).
   */
  async unlockBadge(
    userId: string, 
    badgeId: string, 
    options: { silent?: boolean } = {}
  ): Promise<{ unlocked: boolean; badge?: BadgeDefinition }> {
    if (!userId || !badgeId) return { unlocked: false };

    const badge = BADGE_CATALOG.find(b => b.id === badgeId);
    if (!badge) {
      console.warn(`[BadgeService] Insígnia não encontrada no catálogo: ${badgeId}`);
      return { unlocked: false };
    }

    const currentBadges = await this.getUserBadges(userId);
    const alreadyUnlocked = currentBadges.some(b => b.badgeId === badgeId);
    if (alreadyUnlocked) {
      return { unlocked: false, badge };
    }

    const newEarned: UserEarnedBadge = {
      badgeId,
      earnedAt: new Date().toISOString(),
    };
    const updated = [...currentBadges, newEarned];

    // 1. Atualiza cache local
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('[BadgeService] Erro ao salvar localmente:', e);
    }

    // 2. Salva em user_stats no Supabase (não bloqueia a UI)
    void (async () => {
      try {
        await supabase
          .from('user_stats')
          .upsert({
            user_id: userId,
            badges: JSON.stringify(updated),
          });
      } catch (err) {
        console.warn('[BadgeService] Erro ao persistir insígnia em user_stats:', err);
      }

      // Tenta também usuario_badges / user_badges caso a tabela exista
      try {
        await supabase
          .from('usuario_badges')
          .upsert({
            usuario_id: userId,
            badge_tipo: badgeId,
            conquistado_em: newEarned.earnedAt,
          });
      } catch {
        // Tabela opcional
      }
    })();

    // 3. Dispara celebração (Modal, Confetes) apenas se não for silencioso
    if (!options.silent && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ceep-badge-unlocked', {
          detail: {
            badge,
            earnedAt: newEarned.earnedAt,
            isNew: true,
          },
        })
      );
    }

    return { unlocked: true, badge };
  },

  /**
   * Sincronização manual (silenciosa) para atualizar insígnias já merecidas
   * sem disparar popups inesperados na tela do usuário.
   */
  async checkUserMilestones(userId: string, options: { silent?: boolean } = { silent: true }): Promise<void> {
    if (!userId) return;

    try {
      // Executa contagens em paralelo no Supabase
      const [
        postsRes,
        msgsRes,
        fichasRes,
        reactionsRes,
        pessoaRes
      ] = await Promise.all([
        supabase.from('lyka_posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('lyka_messages').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('entrevistas').select('id', { count: 'exact', head: true }).eq('entrevistador_id', userId),
        supabase.from('lyka_reactions').select('post_id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('pessoas').select('avatar_url, turma_ou_cargo').eq('id', userId).maybeSingle(),
      ]);

      const postsCount = postsRes.count || 0;
      const msgsCount = msgsRes.count || 0;
      const fichasCount = fichasRes.count || 0;
      const reactionsCount = reactionsRes.count || 0;

      // 1. Post no Feed
      if (postsCount >= 1) await this.unlockBadge(userId, 'primeiro_post', options);
      if (postsCount >= 5) await this.unlockBadge(userId, 'cronista_do_feed', options);

      // 2. Mensagens no Layka
      if (msgsCount >= 1) await this.unlockBadge(userId, 'primeira_mensagem', options);
      if (msgsCount >= 10) await this.unlockBadge(userId, 'comunicador_laika', options);

      // 3. Fichas de Entrevista
      if (fichasCount >= 1) await this.unlockBadge(userId, 'primeira_entrevista', options);
      if (fichasCount >= 5) await this.unlockBadge(userId, 'meta_5_entrevistas', options);
      if (fichasCount >= 10) await this.unlockBadge(userId, 'meta_10_entrevistas', options);
      if (fichasCount >= 20) await this.unlockBadge(userId, 'adinha_campea_meta_20', options);

      // 4. Reações
      if (reactionsCount >= 1) await this.unlockBadge(userId, 'primeira_reacao', options);

      // 5. Perfil Completo
      if (pessoaRes.data?.avatar_url && pessoaRes.data?.turma_ou_cargo) {
        await this.unlockBadge(userId, 'perfil_completo', options);
      }
    } catch (err) {
      console.warn('[BadgeService] Erro ao sincronizar marcos:', err);
    }
  },

  /**
   * Registra exploração ativa de conteúdo na Biblioteca ou Jornal
   */
  async recordExplorationVisit(userId: string, module: 'jornal' | 'biblioteca'): Promise<void> {
    if (!userId) return;
    try {
      localStorage.setItem(`${EXPLORATION_STORAGE_PREFIX}${userId}_${module}`, 'true');
      const visitJornal = localStorage.getItem(`${EXPLORATION_STORAGE_PREFIX}${userId}_jornal`);
      const visitBiblio = localStorage.getItem(`${EXPLORATION_STORAGE_PREFIX}${userId}_biblioteca`);
      if (visitJornal && visitBiblio) {
        await this.unlockBadge(userId, 'explorador_do_saber');
      }
    } catch {
      // ignora
    }
  },
};
