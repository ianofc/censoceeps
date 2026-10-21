import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Trophy, Lock, CheckCircle2, RefreshCw, Sparkles, Filter, 
  HelpCircle, ChevronRight, Zap
} from 'lucide-react';
import { 
  badgeService, 
  BadgeDefinition, 
  UserEarnedBadge, 
  BadgeCategory 
} from '../../services/badgeService';

interface BadgeListProps {
  userId: string;
}

type FilterTab = 'all' | 'unlocked' | 'locked';

export const BadgeList: React.FC<BadgeListProps> = ({ userId }) => {
  const [earnedBadges, setEarnedBadges] = useState<UserEarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  const allBadges = useMemo(() => badgeService.getAllBadges(), []);

  const loadBadges = useCallback(async (isRefresh = false) => {
    if (!userId) return;
    try {
      if (isRefresh) setSyncing(true);
      else setLoading(true);

      // Checa marcos pendentes no banco e obtém lista atualizada
      if (isRefresh) {
        await badgeService.checkUserMilestones(userId);
      }
      const userBadges = await badgeService.getUserBadges(userId);
      setEarnedBadges(userBadges);
    } catch (err) {
      console.error('Erro ao carregar insígnias:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBadges();

    // Ouve desbloqueios em tempo real para atualizar a lista sem recarregar
    const handleUnlocked = () => {
      loadBadges();
    };
    window.addEventListener('ceep-badge-unlocked', handleUnlocked);
    return () => {
      window.removeEventListener('ceep-badge-unlocked', handleUnlocked);
    };
  }, [loadBadges]);

  const earnedMap = useMemo(() => {
    const map = new Map<string, string>();
    earnedBadges.forEach(b => map.set(b.badgeId, b.earnedAt));
    return map;
  }, [earnedBadges]);

  const unlockedCount = earnedBadges.length;
  const totalCount = allBadges.length;
  const progressPercent = Math.round((unlockedCount / (totalCount || 1)) * 100);

  // Filtra as insígnias
  const filteredBadges = useMemo(() => {
    return allBadges.filter(b => {
      const isUnlocked = earnedMap.has(b.id);
      if (activeTab === 'unlocked' && !isUnlocked) return false;
      if (activeTab === 'locked' && isUnlocked) return false;
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
      return true;
    });
  }, [allBadges, earnedMap, activeTab, selectedCategory]);

  const categoryLabels: Record<BadgeCategory | 'all', string> = {
    all: 'Todas Categorias',
    acesso: 'Boas-Vindas',
    chat: 'Layka Chat',
    social: 'Feed & Comunidade',
    censo: 'Censo & Entrevistas',
    perfil: 'Identidade',
    exploracao: 'Exploração',
  };

  const rarityColor = (rarity: string) => {
    switch (rarity) {
      case 'lendario': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'epico': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'raro': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-center gap-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
        <span className="text-sm font-semibold">Carregando quadro de insígnias...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-7 transition-all">
      {/* ─── CABEÇALHO DO QUADRO ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 text-lg">🏆</span>
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Insígnias & Conquistas
              </h3>
              <p className="text-xs text-slate-500">
                Ganhe insígnias e XP participando das atividades, chat, feed e entrevistas.
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Atualizar / Sincronizar */}
        <button
          type="button"
          onClick={() => loadBadges(true)}
          disabled={syncing}
          className="inline-flex items-center self-start sm:self-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50"
          title="Verificar se novas conquistas foram atingidas no banco"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{syncing ? 'Verificando...' : 'Sincronizar'}</span>
        </button>
      </div>

      {/* ─── BARRA DE PROGRESSO GERAL ──────────────────────────────────── */}
      <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex items-center justify-between text-xs mb-2 font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Progresso Científico: <strong className="text-indigo-600">{unlockedCount}</strong> de {totalCount} insígnias
          </span>
          <span className="text-indigo-600 font-black">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ─── FILTROS & ABAS ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Todas ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unlocked')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'unlocked' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Conquistadas ({unlockedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('locked')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'locked' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            A Conquistar ({totalCount - unlockedCount})
          </button>
        </div>

        {/* Seletor de Categoria */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filtrar por Categoria"
          className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500"
        >
          <option value="all">Todas as Categorias</option>
          <option value="acesso">Boas-Vindas</option>
          <option value="chat">Layka Chat</option>
          <option value="social">Feed & Social</option>
          <option value="censo">Censo & Entrevistas</option>
          <option value="perfil">Perfil</option>
          <option value="exploracao">Exploração</option>
        </select>
      </div>

      {/* ─── GRID DE INSÍGNIAS ──────────────────────────────────────────── */}
      {filteredBadges.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-xs">
          Nenhuma insígnia encontrada para os filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {filteredBadges.map((badge) => {
            const isUnlocked = earnedMap.has(badge.id);
            const earnedDate = earnedMap.get(badge.id);

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`relative flex flex-col items-center p-3.5 md:p-4 rounded-2xl border transition-all cursor-pointer group text-center ${
                  isUnlocked
                    ? 'bg-gradient-to-b from-white to-indigo-50/20 border-indigo-100 hover:border-indigo-300 hover:shadow-md'
                    : 'bg-slate-50/70 border-slate-200/60 opacity-80 hover:opacity-100 hover:bg-white hover:border-slate-300'
                }`}
              >
                {/* Ícone com indicador de desbloqueio */}
                <div className="relative mb-2.5">
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl select-none transition-transform group-hover:scale-105 ${
                    isUnlocked
                      ? 'bg-gradient-to-tr from-indigo-100 to-purple-100 shadow-sm border border-indigo-200'
                      : 'bg-slate-200/80 grayscale text-slate-400 border border-slate-300'
                  }`}>
                    {badge.icon}
                  </div>

                  {/* Cadeado ou Visto */}
                  <div className="absolute -bottom-1 -right-1">
                    {isUnlocked ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-white">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-400 text-white shadow-sm ring-2 ring-white">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Nome */}
                <h4 className={`text-xs md:text-sm font-black line-clamp-1 mb-1 ${
                  isUnlocked ? 'text-slate-800' : 'text-slate-500'
                }`}>
                  {badge.name}
                </h4>

                {/* Categoria / Raridade */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mb-2 uppercase tracking-wide ${rarityColor(badge.rarity)}`}>
                  {badge.rarity}
                </span>

                {/* Descrição resumida */}
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight mb-2">
                  {badge.description}
                </p>

                {/* Rodapé do Card: Data conquistada ou XP a ganhar */}
                <div className="mt-auto pt-2 border-t border-slate-100 w-full flex items-center justify-center gap-1 text-[10px] font-bold">
                  {isUnlocked ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-emerald-600" />
                      +{badge.xpReward} XP
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-slate-400" />
                      +{badge.xpReward} XP
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL DE DETALHES DA INSÍGNIA AO CLICAR ────────────────────── */}
      {selectedBadge && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setSelectedBadge(null)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-5xl mb-4 shadow-inner">
              {selectedBadge.icon}
            </div>

            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border mb-2 ${rarityColor(selectedBadge.rarity)}`}>
              {selectedBadge.rarity} · {categoryLabels[selectedBadge.category]}
            </span>

            <h3 className="text-lg font-black text-slate-900 mb-2">
              {selectedBadge.name}
            </h3>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {selectedBadge.description}
            </p>

            <div className="bg-slate-50 rounded-2xl p-3 text-left border border-slate-100 text-xs mb-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Critério de Conquista
              </div>
              <div className="font-semibold text-slate-700">
                {selectedBadge.criteria}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-2 px-3 bg-indigo-50/60 rounded-xl mb-5">
              <span className="text-slate-600 font-semibold">Recompensa:</span>
              <span className="font-black text-indigo-700 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-indigo-700" />
                +{selectedBadge.xpReward} XP no Ranking
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeList;
