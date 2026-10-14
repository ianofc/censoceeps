import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { Trophy, Sparkles, X, ArrowRight, Zap } from 'lucide-react';
import { BadgeDefinition } from '../../services/badgeService';

export const BadgeCelebrationModal: React.FC = () => {
  const [currentBadge, setCurrentBadge] = useState<BadgeDefinition | null>(null);
  const [queue, setQueue] = useState<BadgeDefinition[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleBadgeUnlocked = (event: any) => {
      const badge: BadgeDefinition = event.detail?.badge;
      if (!badge) return;

      // Se já está exibindo um modal, enfileira o próximo
      setCurrentBadge(prev => {
        if (!prev) {
          triggerConfetti(badge.rarity);
          return badge;
        } else {
          setQueue(q => [...q, badge]);
          return prev;
        }
      });
    };

    window.addEventListener('ceep-badge-unlocked', handleBadgeUnlocked);
    return () => {
      window.removeEventListener('ceep-badge-unlocked', handleBadgeUnlocked);
    };
  }, []);

  const triggerConfetti = (rarity: string) => {
    try {
      const count = rarity === 'lendario' ? 80 : rarity === 'epico' ? 50 : 35;
      confetti({
        particleCount: count,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'],
      });
    } catch {
      // Ignora erro se canvas não estiver disponível
    }
  };

  const handleClose = () => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      setCurrentBadge(next);
      triggerConfetti(next.rarity);
    } else {
      setCurrentBadge(null);
    }
  };

  const handleGoToProfile = () => {
    handleClose();
    navigate('/perfil');
  };

  if (!currentBadge) return null;

  const rarityStyles = {
    comum: {
      bg: 'from-blue-600 to-indigo-700',
      badgeBg: 'bg-blue-100 text-blue-700 border-blue-200',
      label: 'Insígnia Descoberta',
      glow: 'shadow-blue-500/30',
    },
    raro: {
      bg: 'from-purple-600 to-fuchsia-700',
      badgeBg: 'bg-purple-100 text-purple-700 border-purple-200',
      label: 'Insígnia Rara',
      glow: 'shadow-purple-500/30',
    },
    epico: {
      bg: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      label: 'Conquista Épica',
      glow: 'shadow-amber-500/40',
    },
    lendario: {
      bg: 'from-yellow-400 via-amber-500 to-yellow-600',
      badgeBg: 'bg-yellow-100 text-yellow-900 border-yellow-400 font-black',
      label: 'Glória Lendária',
      glow: 'shadow-yellow-500/50',
    },
  }[currentBadge.rarity] || {
    bg: 'from-indigo-600 to-purple-700',
    badgeBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    label: 'Nova Conquista',
    glow: 'shadow-indigo-500/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-100 p-6 text-center overflow-hidden animate-in zoom-in-95 duration-300"
        style={{
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        }}
      >
        {/* Fundo decorativo no topo */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-tr ${rarityStyles.bg} opacity-15 blur-2xl pointer-events-none`} />

        {/* Botão Fechar */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone da Insígnia com Halo */}
        <div className="mx-auto mt-2 mb-4 relative flex items-center justify-center">
          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-tr ${rarityStyles.bg} flex items-center justify-center text-5xl shadow-xl ${rarityStyles.glow} transform hover:rotate-6 transition-transform select-none`}>
            {currentBadge.icon}
          </div>
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-white shadow">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Tag de Raridade */}
        <div className="mb-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${rarityStyles.badgeBg}`}>
            <Trophy className="w-3 h-3" />
            {rarityStyles.label}
          </span>
        </div>

        {/* Título e Descrição */}
        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
          {currentBadge.name}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed px-2 mb-4">
          {currentBadge.description}
        </p>

        {/* XP Bônus */}
        <div className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 py-2 px-3 rounded-xl mb-6">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-black text-slate-700">
            +{currentBadge.xpReward} XP de Pesquisador Conquistado!
          </span>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Continuar
          </button>
          <button
            type="button"
            onClick={handleGoToProfile}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Ver Insígnias</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadgeCelebrationModal;
