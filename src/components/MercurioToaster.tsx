import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Zap, Bell, X, Rss, Trophy, Newspaper } from 'lucide-react';
import { useUserSession } from '../hooks/useUserSession';

interface MercurioToast {
  id: string;
  title: string;
  message: string;
  icon: 'zap' | 'rss' | 'trophy' | 'news';
  duration: number;
}

/**
 * MERCÚRIO - O Mensageiro e Notificador
 * Ouve eventos do Supabase Realtime e joga notificações na tela do usuário.
 */
export function MercurioToaster() {
  const { profile } = useUserSession();
  const [toasts, setToasts] = useState<MercurioToast[]>([]);

  const addToast = (toast: Omit<MercurioToast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration);
  };

  useEffect(() => {
    if (!profile?.id) return;

    // Conecta o Mercúrio no canal global do Supabase (Feed Posts)
    const channelFeed = supabase.channel('mercurio-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lyka_posts' }, (payload) => {
        // Ignora posts do próprio usuário
        if (payload.new.user_id !== profile.id) {
          addToast({
            title: "Novo Post no Feed!",
            message: "Alguém acabou de publicar uma atualização. Corra para ver!",
            icon: 'rss',
            duration: 6000
          });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lyka_messages' }, (payload) => {
        if (payload.new.user_id !== profile.id && (payload.new.conversation_key?.includes(profile.id) || !payload.new.conversation_key)) {
          addToast({
            title: "Mensagem no LykaChat",
            message: "Você tem uma nova mensagem não lida.",
            icon: 'zap',
            duration: 5000
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelFeed);
    };
  }, [profile?.id]);

  const IconComponent = ({ icon }: { icon: string }) => {
    switch (icon) {
      case 'zap': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'rss': return <Rss className="w-5 h-5 text-blue-500" />;
      case 'trophy': return <Trophy className="w-5 h-5 text-orange-500" />;
      case 'news': return <Newspaper className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 md:top-6 right-4 md:right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <style>{`
        @keyframes slideInDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .mercurio-toast {
          animation: slideInDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          pointer-events: auto;
        }
      `}</style>
      
      {toasts.map(t => (
        <div key={t.id} className="mercurio-toast w-80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-2xl rounded-2xl p-4 flex gap-4 items-start relative overflow-hidden group">
          
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600"></div>

          <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-full flex-shrink-0">
            <IconComponent icon={t.icon} />
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-0.5">{t.title}</h4>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-tight">
              {t.message}
            </p>
          </div>

          <button 
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
