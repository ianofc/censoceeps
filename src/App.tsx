import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import { supabase } from './lib/supabaseClient';
import { AdinhaMascote } from './components/AdinhaMascote';
import { MercurioToaster } from './components/MercurioToaster';
import { tasOfflineSync } from './utils/tasOfflineSync';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const PublicDisplay = lazy(() => import('./pages/PublicDisplay').then(m => ({ default: m.PublicDisplay })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const AdinhaAssistant = lazy(() => import('./components/AdinhaAssistant').then(m => ({ default: m.AdinhaAssistant })));
const MeuPerfil = lazy(() => import('./pages/MeuPerfil').then(m => ({ default: m.MeuPerfil })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Feed = lazy(() => import('./pages/Feed').then(m => ({ default: m.Feed })));
const LykaChat = lazy(() => import('./pages/LykaChat').then(m => ({ default: m.LykaChat })));
const Ranking = lazy(() => import('./pages/Ranking').then(m => ({ default: m.Ranking })));
const Newspaper = lazy(() => import('./pages/Newspaper').then(m => ({ default: m.Newspaper })));

import { 
  ClipboardList, 
  Tv2, 
  FolderCheck, 
  User, 
  LogOut, 
  Info,
  Rss,
  Trophy,
  Newspaper as NewspaperIcon
} from 'lucide-react';

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

  useEffect(() => {
    const handleOnline = () => {
      console.log('[App] Rede restabelecida. Acionando TAS Offline Sync...');
      if (session?.user?.id) {
        tasOfflineSync.syncOfflineData(session.user.id);
      }
    };
    window.addEventListener('online', handleOnline);
    if (navigator.onLine && session?.user?.id) {
      tasOfflineSync.syncOfflineData(session.user.id);
    }
    return () => window.removeEventListener('online', handleOnline);
  }, [session?.user?.id]);

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 overflow-hidden font-sans relative">
      {/* Barra lateral flutuante em desktops e barra inferior flutuante em celulares */}
      <aside className="fixed bottom-4 left-4 right-4 lg:left-6 lg:top-1/2 lg:-translate-y-1/2 lg:bottom-auto lg:right-auto z-50 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl flex lg:flex-col items-center justify-around lg:justify-between p-3 shadow-2xl shrink-0 gap-2">
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

                <nav className="flex lg:flex-col gap-2 items-center justify-around lg:justify-center relative w-full lg:w-auto">

          {/* 1. Coleta — função principal */}
          <button
            type="button"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
              isActive('/coleta') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold scale-105' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => handleNavigation('/coleta')}
            title="Ficha de Coleta do Censo"
          >
            <ClipboardList className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>

          {/* 2. Feed — comunicação diária */}
          <button
            type="button"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
              isActive('/feed') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold scale-105' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => handleNavigation('/feed')}
            title="Feed da Turma"
          >
            <Rss className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>

          {/* 3. Ranking — gamificação */}
          <button
            type="button"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
              isActive('/ranking') ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 font-bold scale-105' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => handleNavigation('/ranking')}
            title="Ranking & Gamificação"
          >
            <Trophy className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>

          {/* Jornal Oficial — Scraping & Trends */}
          <button
            type="button"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
              isActive('/jornal') ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold scale-105' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => handleNavigation('/jornal')}
            title="Censo Tribune"
          >
            <NewspaperIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>

          {/* 4. Layka Chat — mensagens */}
          <button
            type="button"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
              isActive('/chat') ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 font-bold scale-105' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => handleNavigation('/chat')}
            title="Layka Chat"
          >
            <LaikaNavIcon size={20} />
          </button>

          {/* 5. Perfil — visível mobile e desktop */}
          <button
            type="button"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
              isActive('/perfil') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold scale-105' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => handleNavigation('/perfil')}
            title="Meu Perfil"
          >
            <User className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>

          {/* 6-8. Uso menos frequente — apenas desktop */}
          <div className="hidden lg:contents">
            <button
              type="button"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
                isActive('/telao') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold scale-105' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => handleNavigation('/telao')}
              title="Modo Telão"
            >
              <Tv2 className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>

            <button
              type="button"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
                isActive('/sobre') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold scale-105' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => handleNavigation('/sobre')}
              title="Sobre o Projeto"
            >
              <Info className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>

            <button
              type="button"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer border-0 ${
                isActive('/auditoria') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold scale-105' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => handleNavigation('/auditoria')}
              title="Painel Docente"
            >
              <FolderCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
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
              <Route path="/" element={<Navigate to="/feed" replace />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/jornal" element={<Newspaper />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/chat" element={<LykaChat />} />
              <Route path="/coleta" element={<Home />} />
              <Route path="/telao" element={<PublicDisplay />} />
              <Route path="/auditoria" element={<TeacherDashboard />} />
              <Route path="/perfil" element={<MeuPerfil escolaNome="CEEP Seabra — Censo CEEP" />} />
              <Route path="/sobre" element={<About escolaNome="CEEP Seabra" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
        <AdinhaAssistant />
        <MercurioToaster />
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
    }).catch(console.error);

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
          }).catch(console.error);
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
