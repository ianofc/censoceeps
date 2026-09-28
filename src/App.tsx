import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import { supabase } from './lib/supabaseClient';

import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { PublicDisplay } from './pages/PublicDisplay';
import { NotFound } from './pages/NotFound';
import { AdinhaAssistant } from './components/AdinhaAssistant';

import { 
  BarChart3, 
  ClipboardList, 
  Tv2, 
  FolderCheck, 
  User, 
  LogOut, 
  Flame,
  Award,
  MoreHorizontal
} from 'lucide-react';

const adinhaAvatar = new URL('./assets/imgs/AdaLovelace.png', import.meta.url).href;

interface LayoutProps {
  readonly session: any;
}

function Layout({ session }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  // Fecha o menu "Mais" ao navegar
  const handleNavigation = (path: string) => {
    setShowMoreMenu(false);
    navigate(path);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 overflow-hidden font-sans relative">
      
      {/* 
        NAVBAR / DOCK FLUTUANTE RESPONSIVA:
        - Mobile: Barra Fixa na Parte Inferior (Bottom Bar) com tamanho dinâmico e menu "Mais"
        - Desktop: Barra Lateral Flutuante com bordas arredondadas à esquerda
      */}
      <aside className="fixed bottom-0 left-0 right-0 z-40 m-3 lg:m-auto lg:ml-6 lg:static bg-slate-900/95 backdrop-blur-md border border-slate-800/80 rounded-3xl flex lg:flex-col items-center justify-between p-3 shadow-2xl shrink-0">
        
        {/* Topo Desktop: Ícone da Adinha (Zios do Censo) */}
        <div className="hidden lg:flex flex-col items-center gap-1 mb-2">
          <button
            type="button"
            onClick={() => handleNavigation('/')}
            title="Censo CEEP — Projeto Ada Lovelace"
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-md shadow-blue-500/20 ring-2 ring-white/20 transition-transform hover:scale-105 cursor-pointer flex items-center justify-center border-0"
          >
            <img 
              src={adinhaAvatar} 
              alt="Ada Lovelace" 
              className="w-full h-full rounded-2xl object-cover" 
            />
          </button>
        </div>

        {/* Navegação Central com Ícones Dinâmicos */}
        <nav className="flex lg:flex-col gap-2 w-full items-center justify-around lg:justify-center relative">
          
          {/* Indicadores (Sempre visível) */}
          <button
            type="button"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${
              isActive('/') 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => handleNavigation('/')}
            title="Dashboard de Indicadores"
          >
            <BarChart3 className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="hidden lg:block absolute left-full ml-3 px-3 py-1 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Indicadores
            </span>
          </button>

          {/* Coleta de Campo (Sempre visível) */}
          <button
            type="button"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${
              isActive('/coleta') 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => handleNavigation('/coleta')}
            title="Ficha de Coleta do Censo"
          >
            <ClipboardList className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="hidden lg:block absolute left-full ml-3 px-3 py-1 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Coleta de Campo
            </span>
          </button>

          {/* Modo Telão (Visível no Desktop / Dentro do 'Mais' no Mobile se necessário, ou direto) */}
          <button
            type="button"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${
              isActive('/telao') 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => handleNavigation('/telao')}
            title="Modo Telão (Projeção)"
          >
            <Tv2 className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="hidden lg:block absolute left-full ml-3 px-3 py-1 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Modo Telão
            </span>
          </button>

          {/* Botões extras no Mobile agrupados no menu "Mais" para não lotar a tela */}
          <div className="lg:hidden relative">
            <button
              type="button"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                showMoreMenu || isActive('/auditoria') || isActive('/perfil')
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title="Mais Opções"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Menu Pop-up flutuante para telas pequenas quando clica em Mais */}
            {showMoreMenu && (
              <div className="absolute bottom-16 right-0 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl flex flex-col gap-2 min-w-[180px] z-50 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => handleNavigation('/auditoria')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-left transition ${
                    isActive('/auditoria') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FolderCheck className="w-4 h-4" /> Painel Docente
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigation('/perfil')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-left transition ${
                    isActive('/perfil') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <User className="w-4 h-4" /> Meu Perfil
                </button>
                <hr className="border-slate-800 my-1" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-left text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="w-4 h-4" /> Encerrar Sessão
                </button>
              </div>
            )}
          </div>

          {/* Ícones Individuais visíveis diretamente no Desktop */}
          <div className="hidden lg:contents">
            <button
              type="button"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${
                isActive('/auditoria') 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => handleNavigation('/auditoria')}
              title="Painel Docente & Auditoria"
            >
              <FolderCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="absolute left-full ml-3 px-3 py-1 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Painel Docente
              </span>
            </button>

            <button
              type="button"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${
                isActive('/perfil') 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => handleNavigation('/perfil')}
              title="Meu Perfil"
            >
              <User className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="absolute left-full ml-3 px-3 py-1 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Meu Perfil
              </span>
            </button>
          </div>
        </nav>

        {/* Rodapé da Navbar Desktop: Botão de Logout */}
        <div className="mt-auto pt-2 hidden lg:block">
          <button 
            type="button"
            onClick={handleLogout} 
            className="w-11 h-11 rounded-2xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white flex items-center justify-center transition duration-200 group relative border-0"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5" />
            <span className="absolute left-full ml-3 px-3 py-1 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Encerrar Sessão
            </span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Central Responsivo, Centralizado e com espaçamento inferior extra no mobile para a dock não cobrir conteúdo */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 pb-28 lg:pb-10 relative flex flex-col items-center">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
          <Routes>
            <Route
              path="/"
              element={
                <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-7xl">
                  <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-black text-slate-800">Estatísticas do Censo CEEP</h1>
                    <span className="bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-blue-200 shadow-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sincronização ao Vivo
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                    <div className="z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-orange-100 text-orange-600 p-1.5 rounded-xl border border-orange-200">
                          <Flame className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
                          Monitoramento Científico de Amostras
                        </span>
                      </div>

                      <div className="flex gap-8 mt-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            COMUNIDADE ESCOLAR
                          </span>
                          <strong className="text-2xl font-black text-slate-800">CEEP Seabra</strong>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            PESQUISA DE CAMPO
                          </span>
                          <strong className="text-2xl font-black text-blue-600">Ada Lovelace</strong>
                        </div>
                      </div>
                    </div>

                    <div className="z-10 bg-slate-50 border border-slate-200 p-4 rounded-2xl min-w-[240px] shadow-sm">
                      <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase mb-2">
                        <Award className="w-4 h-4" /> METODOLOGIA APLICADA
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Classificação:</span>
                          <strong className="text-slate-800">IBGE</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Eixos:</span>
                          <strong className="text-slate-800">Gênero, Raça & Pertencimento</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnalyticsDashboard />
                </div>
              }
            />

            {/* Telas centralizadas com layout profissional */}
            <Route 
              path="/coleta" 
              element={
                <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
                  <div className="w-full max-w-4xl">
                    <Home userId={session?.user?.id} />
                  </div>
                </div>
              } 
            />
            
            <Route path="/telao" element={<PublicDisplay />} />
            <Route path="/auditoria" element={<TeacherDashboard />} />
            
            <Route
              path="/perfil"
              element={
                <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
                  <div className="w-full max-w-xl space-y-6">
                    <h1 className="text-2xl font-black text-slate-800 text-center">Meu Perfil de Pesquisador</h1>
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm w-full">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-md shadow-blue-500/30">
                          {session?.user?.email ? session.user.email[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">{session?.user?.email}</h3>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
                            Coletor de Campo
                          </span>
                        </div>
                      </div>
                      <hr className="border-slate-100 my-4" />
                      <p className="text-xs text-slate-500 leading-relaxed text-center">
                        Centro Estadual de Educação Profissional de Seabra — CEEP<br />
                        Projeto de Pesquisa Científica Ada Lovelace
                      </p>
                    </div>
                  </div>
                </div>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        {/* Assistente Zios (Adinha) integrado globalmente */}
        <AdinhaAssistant />
      </main>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-slate-300">Carregando Censo CEEP...</p>
      </div>
    );
  }

  if (!session) {
    return <Login onLoginSuccess={() => setLoading(true)} />;
  }

  return (
    <BrowserRouter>
      <Layout session={session} />
    </BrowserRouter>
  );
}