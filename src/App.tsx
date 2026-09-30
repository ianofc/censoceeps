import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import { supabase } from './lib/supabaseClient';
import { AdinhaMascote } from './components/AdinhaMascote';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const PublicDisplay = lazy(() => import('./pages/PublicDisplay').then(m => ({ default: m.PublicDisplay })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const AdinhaAssistant = lazy(() => import('./components/AdinhaAssistant').then(m => ({ default: m.AdinhaAssistant })));
const MeuPerfil = lazy(() => import('./pages/MeuPerfil').then(m => ({ default: m.MeuPerfil })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));

import { 
  BarChart3, 
  ClipboardList, 
  Tv2, 
  FolderCheck, 
  User, 
  LogOut, 
  Flame,
  Award,
  Info
} from 'lucide-react';

const adinhaAvatar = new URL('./assets/imgs/AdaLovelace.png', import.meta.url).href;

interface LayoutProps {
  readonly session: any;
}

function Layout({ session }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 overflow-hidden font-sans relative">
      <aside className="fixed bottom-0 left-0 right-0 z-40 m-3 lg:m-auto lg:ml-6 lg:static bg-slate-900/95 backdrop-blur-md border border-slate-800/80 rounded-3xl flex lg:flex-col items-center justify-between p-3 shadow-2xl shrink-0">
        <div className="hidden lg:flex flex-col items-center gap-1 mb-2">
          <button
            type="button"
            onClick={() => handleNavigation('/')}
            title="Censo CEEP — Projeto Ada Lovelace"
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-md shadow-blue-500/20 ring-2 ring-white/20 transition-transform hover:scale-105 cursor-pointer flex items-center justify-center border-0"
          >
            <img src={adinhaAvatar} alt="Ada Lovelace" className="w-full h-full rounded-2xl object-cover" />
          </button>
        </div>

        <nav className="flex lg:flex-col gap-2 w-full items-center justify-around lg:justify-center relative">
          <button
            type="button"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
              isActive('/') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => handleNavigation('/')}
            title="Dashboard de Indicadores"
          >
            <BarChart3 className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>

          <button
            type="button"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
              isActive('/coleta') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => handleNavigation('/coleta')}
            title="Ficha de Coleta do Censo"
          >
            <ClipboardList className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>

          <button
            type="button"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
              isActive('/telao') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => handleNavigation('/telao')}
            title="Modo Telão"
          >
            <Tv2 className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>

          <button
            type="button"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
              isActive('/sobre') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => handleNavigation('/sobre')}
            title="Sobre o Projeto"
          >
            <Info className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>

          <div className="hidden lg:contents">
            <button
              type="button"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
                isActive('/auditoria') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => handleNavigation('/auditoria')}
              title="Painel Docente"
            >
              <FolderCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>

            <button
              type="button"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
                isActive('/perfil') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => handleNavigation('/perfil')}
              title="Meu Perfil"
            >
              <User className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
          </div>
        </nav>

        <div className="mt-auto pt-2 hidden lg:block">
          <button 
            type="button"
            onClick={handleLogout} 
            className="w-11 h-11 rounded-2xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white flex items-center justify-center transition duration-200 border-0 cursor-pointer"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 pb-28 lg:pb-10 relative flex flex-col items-center">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
          <Suspense fallback={
            <div className="w-full h-96 flex flex-col items-center justify-center gap-4">
              <AdinhaMascote pose="correndo" className="w-20 h-20" />
              <span className="text-xs font-black uppercase tracking-widest text-blue-600 animate-pulse">
                Carregando módulo...
              </span>
            </div>
          }>
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
              <Route path="/coleta" element={<Home userId={session?.user?.id} />} />
              <Route path="/telao" element={<PublicDisplay />} />
              <Route path="/auditoria" element={<TeacherDashboard />} />
              <Route path="/perfil" element={<MeuPerfil escolaNome="CEEP Seabra — Censo CEEP" />} />
              <Route path="/sobre" element={<About escolaNome="CEEP Seabra" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-sans gap-4">
        <AdinhaMascote pose="correndo" className="w-24 h-24" />
        <p className="font-bold text-slate-300 animate-pulse">Carregando Censo CEEP...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <BrowserRouter>
        <Login onLoginSuccess={() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
          });
        }} />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Layout session={session} />
    </BrowserRouter>
  );
}