import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserSession } from '../hooks/useUserSession';
import { 
  ClipboardList, 
  Rss, 
  Trophy, 
  Newspaper as NewspaperIcon, 
  User, 
  Info, 
  FolderCheck, 
  LogOut, 
  Menu, 
  X, 
  Download, 
  Briefcase, 
  Library, 
  Headset } from 'lucide-react';

const adinhaAvatar = new URL('../assets/imgs/AdaLovelace.png', import.meta.url).href;

function LaikaNavIcon({ size = 20 }: { readonly size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8 C4 4 2 3 3 7" />
      <path d="M19 8 C20 4 22 3 21 7" />
      <ellipse cx="12" cy="10" rx="7" ry="6" />
      <ellipse cx="12" cy="13" rx="3" ry="2" />
      <ellipse cx="12" cy="12" rx="1.2" ry="0.8" fill="currentColor" stroke="none" />
      <circle cx="9" cy="9" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="0.9" fill="currentColor" stroke="none" />
      <path d="M7 15.5 C6 18 6 21 8 21 L16 21 C18 21 18 18 17 15.5" />
      <path d="M17 16 C21 14 22 10 20 9" />
    </svg>
  );
}

interface FloatingNavProps {
  readonly onLogout?: () => void;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({ onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useUserSession();

  const activeTab = location.pathname;

  const primaryItems = [
    { id: '/coleta', label: 'Ficha Censo', icon: ClipboardList, activeColor: 'bg-indigo-600 shadow-indigo-600/30' },
    { id: '/feed', label: 'Feed & Evidências', icon: Rss, activeColor: 'bg-blue-600 shadow-blue-600/30' },
    { id: '/ranking', label: 'Ranking', icon: Trophy, activeColor: 'bg-amber-500 shadow-amber-500/30' },
    { id: '/jornal', label: 'Censo Tribune', icon: NewspaperIcon, activeColor: 'bg-purple-600 shadow-purple-600/30' },
    ...(isAdmin ? [{ id: '/oportunidades', label: 'Oportunidades', icon: Briefcase, activeColor: 'bg-teal-600 shadow-teal-600/30' }] : []),
    { id: '/chat', label: 'Layka Chat', icon: LaikaNavIcon, activeColor: 'bg-violet-600 shadow-violet-600/30' },
    { id: '/perfil', label: 'Meu Perfil', icon: User, activeColor: 'bg-emerald-600 shadow-emerald-600/30' },
  ];

  const secondaryItems = [
    { id: '/biblioteca', label: 'Biblioteca Viva', icon: Library, activeColor: 'bg-blue-600 shadow-blue-600/30' },
    ...(isAdmin ? [{ id: '/ouvidoria', label: 'Ouvidoria', icon: Headset, activeColor: 'bg-rose-600 shadow-rose-600/30' }] : []),
    { id: '/sobre', label: 'Sobre o Projeto', icon: Info, activeColor: 'bg-blue-600 shadow-blue-600/30' },
    { id: '/auditoria', label: 'Painel Docente', icon: FolderCheck, activeColor: 'bg-blue-600 shadow-blue-600/30' },
  ];

  const handleTabClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleOpenInstall = () => {
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent('open-pwa-install-modal'));
  };

  return (
    <>
      {/* Drawer / Menu Modal Expandido para Mobile */}
      {isMobileMenuOpen && (
        <dialog
          open
          aria-label="Menu Completo"
          className="fixed inset-0 z-50 m-0 w-full h-full bg-blue-950/70 backdrop-blur-md flex flex-col justify-end lg:justify-center lg:items-center p-4 border-0"
        >
          <button
            type="button"
            className="absolute inset-0 w-full h-full cursor-default border-0 bg-transparent"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Fechar menu flutuante"
          />
          
          <div className="relative z-10 bg-blue-900 border border-blue-700/60 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 text-white animate-in fade-in slide-in-from-bottom-6 lg:zoom-in-95 mb-20 lg:mb-0 max-h-[80vh] overflow-y-auto w-full lg:w-[380px]">
            <div className="flex items-center justify-between pb-3 border-b border-blue-800">
              <div className="flex items-center gap-2.5">
                <img src={adinhaAvatar} alt="Ada Lovelace" className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/40" />
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight">Censo CEEP Seabra</h2>
                  <p className="text-[11px] text-blue-200">Projeto Ada Lovelace</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-blue-800 text-blue-200 hover:text-white transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-[11px] font-bold text-blue-200 uppercase tracking-wider pt-1">
              Módulos Principais
            </div>
            <div className="grid grid-cols-2 gap-2">
              {primaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer border-0 text-left text-xs font-semibold ${
                      isActive 
                        ? `${item.activeColor} text-white shadow-lg` 
                        : 'bg-blue-800/60 hover:bg-blue-800 text-blue-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] font-bold text-blue-200 uppercase tracking-wider pt-2 border-t border-blue-800">
              Ferramentas & Informações
            </div>
            <div className="flex flex-col gap-1.5">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer border-0 text-left text-xs font-medium ${
                      isActive 
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' 
                        : 'bg-transparent hover:bg-blue-800/80 text-blue-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-blue-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleOpenInstall}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 text-indigo-300 hover:text-white transition-all cursor-pointer border border-indigo-500/30 text-xs font-bold"
              >
                <Download size={16} />
                <span>Instalar Aplicativo (PWA)</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white transition-colors cursor-pointer border border-rose-500/20 text-xs font-bold"
                >
                  <LogOut size={16} />
                  <span>Sair do Sistema</span>
                </button>
              )}
            </div>
          </div>
        </dialog>
      )}

      {/* Barra de Navegação Flutuante Adaptativa (Sidebar no Desktop / Barra Inferior no Mobile) */}
      <aside 
        aria-label="Navegação do Censo"
        className="fixed z-40 transition-all duration-300
          lg:left-6 lg:top-1/2 lg:-translate-y-1/2 lg:flex-col lg:rounded-3xl lg:p-3 lg:bg-blue-900/95 lg:backdrop-blur-xl lg:border lg:border-blue-700/50 lg:shadow-2xl lg:gap-2
          max-lg:bottom-4 max-lg:left-4 max-lg:right-4 max-lg:flex-row max-lg:rounded-2xl max-lg:px-3 max-lg:py-2 max-lg:bg-blue-900/95 max-lg:backdrop-blur-xl max-lg:border max-lg:border-blue-700/50 max-lg:shadow-2xl
          flex items-center justify-between"
      >
        {/* Itens Unificados (Mobile e Desktop) */}
        <div className="flex max-lg:flex-row max-lg:justify-around lg:flex-col items-center w-full gap-1 lg:gap-3">
          {/* 1. Coleta */}
          <button
            type="button"
            onClick={() => handleTabClick('/coleta')}
            title="Ficha Censo"
            aria-label="Ficha Censo"
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border-0 ${
              activeTab === '/coleta' ? 'text-indigo-400 bg-indigo-950/60 font-bold' : 'text-blue-200 hover:text-white bg-transparent'
            }`}
          >
            <ClipboardList size={20} />
            <span className="text-[10px] mt-0.5">Coleta</span>
          </button>

          {/* 2. Feed */}
          <button
            type="button"
            onClick={() => handleTabClick('/feed')}
            title="Feed"
            aria-label="Feed"
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border-0 ${
              activeTab === '/feed' ? 'text-blue-400 bg-blue-950/60 font-bold' : 'text-blue-200 hover:text-white bg-transparent'
            }`}
          >
            <Rss size={20} />
            <span className="text-[10px] mt-0.5">Feed</span>
          </button>

          {/* Botão Central - Layka Chat */}
          <button
            type="button"
            onClick={() => handleTabClick('/chat')}
            title="Layka Chat"
            aria-label="Layka Chat"
            className={`flex items-center justify-center w-11 h-11 bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white font-black rounded-2xl shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-0 -my-2 ${
              activeTab === '/chat' ? 'ring-2 ring-white/40 scale-105' : ''
            }`}
          >
            <LaikaNavIcon size={26} />
          </button>

          {/* 3. Ranking */}
          <button
            type="button"
            onClick={() => handleTabClick('/ranking')}
            title="Ranking"
            aria-label="Ranking"
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border-0 ${
              activeTab === '/ranking' ? 'text-amber-400 bg-amber-950/60 font-bold' : 'text-blue-200 hover:text-white bg-transparent'
            }`}
          >
            <Trophy size={20} />
            <span className="text-[10px] mt-0.5">Ranking</span>
          </button>

          {/* 4. Menu Mais Opções */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Menu Completo"
            aria-label="Menu Completo"
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border-0 ${
              isMobileMenuOpen ? 'text-indigo-400 bg-indigo-950/60 font-bold' : 'text-blue-200 hover:text-white bg-transparent'
            }`}
          >
            <Menu size={20} />
            <span className="text-[10px] mt-0.5">Menu</span>
          </button>
        </div>

        </aside>
    </>
  );
};



