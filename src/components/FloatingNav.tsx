import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Plus, 
  Menu, 
  X, 
  User 
} from 'lucide-react';

export const FloatingNav: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = location.pathname;

  const navItems = [
    { id: '/', label: 'Feed', icon: Home },
    { id: '/auditoria', label: 'Censo', icon: Users },
    { id: '/chat', label: 'Layka Chat', icon: MessageSquare },
    { id: '/telao', label: 'Painel', icon: BarChart3 },
    { id: '/perfil', label: 'Perfil', icon: User },
  ];

  const handleTabClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Menu Expandido para Mobile totalmente acessível */}
      {isMobileMenuOpen && (
        <dialog
          open
          aria-label="Menu de navegação"
          className="fixed inset-0 z-40 m-0 max-w-none max-h-none w-full h-full bg-black/50 backdrop-blur-sm lg:hidden flex flex-col justify-end p-4 border-0 p-0"
        >
          <button
            type="button"
            className="absolute inset-0 w-full h-full cursor-default border-0 bg-transparent"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Fechar menu flutuante"
          />
          
          <div
            className="relative z-10 bg-slate-900/95 border border-slate-700/50 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 text-white animate-in fade-in slide-in-from-bottom-5 mb-16"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outras Funções</span>
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer border-0 text-left ${
                    activeTab === item.id 
                      ? 'bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-600/30' 
                      : 'bg-transparent hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </dialog>
      )}

      {/* Navegação Flutuante Adaptativa (Esquerda em desktops / Inferior em celulares) */}
      <nav aria-label="Navegação Principal" className="fixed z-50 transition-all duration-300 
        lg:left-6 lg:top-1/2 lg:-translate-y-1/2 lg:flex-col lg:rounded-3xl lg:p-3 lg:bg-slate-900/80 lg:backdrop-blur-xl lg:border lg:border-slate-700/50 lg:shadow-2xl lg:gap-3
        max-lg:bottom-6 max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:flex-row max-lg:rounded-full max-lg:px-4 max-lg:py-2.5 max-lg:bg-slate-900/90 max-lg:backdrop-blur-xl max-lg:border max-lg:border-slate-700/50 max-lg:shadow-2xl max-lg:gap-2
        flex items-center justify-around"
      >
        <div className="flex lg:flex-col items-center gap-2">
          {navItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                title={item.label}
                aria-label={item.label}
                className={`relative group flex items-center justify-center p-3 rounded-2xl transition-all cursor-pointer border-0 ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105' 
                    : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={22} />
                <span className="hidden lg:block absolute left-full ml-3 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-slate-700">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Botão de Ação Principal (+) Flutuante */}
        <button
          type="button"
          onClick={() => navigate('/')}
          title="Nova Adição / Entrevista"
          aria-label="Nova Adição"
          className="flex items-center justify-center p-3.5 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all cursor-pointer border-0"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

        {/* Botão de Menu (3 tracinhos) para Mobile */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          title="Mais opções"
          aria-label="Mais opções"
          className="lg:hidden flex items-center justify-center p-3 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-2xl transition-all cursor-pointer border-0 bg-transparent"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Itens restantes para Desktop */}
        <div className="hidden lg:flex flex-col items-center gap-2 pt-2 border-t border-slate-800">
          {navItems.slice(3).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                title={item.label}
                aria-label={item.label}
                className={`relative group flex items-center justify-center p-3 rounded-2xl transition-all cursor-pointer border-0 ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105' 
                    : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={22} />
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-slate-700">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};