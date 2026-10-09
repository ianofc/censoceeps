import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X, Share2, PlusSquare, Sparkles } from 'lucide-react';

const adinhaAvatar = new URL('../assets/imgs/AdaLovelace.png', import.meta.url).href;

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, hasPrompt, isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(true);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  useEffect(() => {
    const dismissedInSession = sessionStorage.getItem('pwa_prompt_dismissed');
    if (!dismissedInSession && !isInstalled && isInstallable) {
      const timer = setTimeout(() => {
        setIsDismissed(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  useEffect(() => {
    const handleOpenManual = () => {
      setIsDismissed(false);
      if (isIOS) setShowIOSGuide(true);
    };
    window.addEventListener('open-pwa-install-modal', handleOpenManual);
    return () => window.removeEventListener('open-pwa-install-modal', handleOpenManual);
  }, [isIOS]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (hasPrompt) {
      const installed = await triggerInstall();
      if (installed) {
        setIsDismissed(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-[400px] animate-in fade-in slide-in-from-top-6 duration-300">
      <div className="relative bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 text-white">
        
        {/* Topo do popup */}
        <div className="flex items-center gap-3">
          <div className="shrink-0 relative">
            <img 
              src={adinhaAvatar} 
              alt="Ada" 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/50"
            />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white font-bold ring-2 ring-slate-900">
              <Sparkles size={10} />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">Censo CEEP</p>
            <p className="text-[11px] text-slate-300 truncate">Instale para melhor experiência</p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fechar aviso de instalação"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors border-0 bg-transparent cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Guia iOS ou Botões */}
        {showIOSGuide ? (
          <div className="mt-1 p-2 bg-indigo-950/80 border border-indigo-500/30 rounded-xl text-[11px] space-y-1.5 text-indigo-100">
            <p className="font-bold flex items-center gap-1 text-white">
              <Share2 size={12} className="text-blue-400" /> No Safari:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
              <li>Toque em <strong className="text-white">Compartilhar</strong></li>
              <li><strong className="text-white">Adicionar à Tela de Início</strong> <PlusSquare size={11} className="inline ml-0.5" /></li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-1 text-[11px] text-indigo-400 font-bold hover:underline bg-transparent border-0 cursor-pointer p-0"
            >
              Entendido
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors border-0 cursor-pointer"
            >
              <Download size={14} />
              <span>{isIOS ? 'Como Instalar (iOS)' : 'Instalar App'}</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-colors border-0 cursor-pointer"
            >
              Agora não
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
