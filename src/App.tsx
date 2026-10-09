import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { supabase } from './lib/supabaseClient';
import { AdinhaMascote } from './components/AdinhaMascote';
import { MercurioToaster } from './components/MercurioToaster';
import { FloatingNav } from './components/FloatingNav';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { CelebracaoAdinhaCampea } from './components/CelebracaoAdinhaCampea';
import { tasOfflineSync } from './utils/tasOfflineSync';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const PublicDisplay = lazy(() => import('./pages/PublicDisplay').then(m => ({ default: m.PublicDisplay })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const AdinhaAssistant = lazy(() => import('./components/AdinhaAssistant').then(m => ({ default: m.AdinhaAssistant })));
const MeuPerfil = lazy(() => import('./pages/MeuPerfil').then(m => ({ default: m.MeuPerfil })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Feed = lazy(() => import('./pages/Feed').then(m => ({ default: m.Feed })));
const LykaChat = lazy(() => import('./pages/LykaChat').then(m => ({ default: m.LykaChat })));
const Ranking = lazy(() => import('./pages/Ranking').then(m => ({ default: m.Ranking })));
const Newspaper = lazy(() => import('./pages/Newspaper').then(m => ({ default: m.Newspaper })));
const GroupChannels = lazy(() => import('./components/Chat/GroupChannels').then(m => ({ default: m.GroupChannels })));
const AdinhaDirectChat = lazy(() => import('./components/Chat/AdinhaDirectChat').then(m => ({ default: m.AdinhaDirectChat })));
const Oportunidades = lazy(() => import('./pages/Oportunidades'));
const Biblioteca = lazy(() => import('./pages/Biblioteca'));
const Ouvidoria = lazy(() => import('./pages/Ouvidoria'));

interface LayoutProps {
  readonly session: any;
}

function Layout({ session }: LayoutProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const handleOnline = () => {
      console.info('[App] Rede restabelecida. Acionando TAS Offline Sync...');
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

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 overflow-hidden font-sans relative">
      {/* Navegação Flutuante Adaptativa (Sidebar no Desktop / Barra com Drawer no Mobile) */}
      <FloatingNav onLogout={handleLogout} />

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
              <Route path="/chat/turmas" element={<GroupChannels />} />
              <Route path="/chat/adinha" element={
                <div className="w-full h-full p-4 md:p-8 flex items-center justify-center">
                  {session?.user && <AdinhaDirectChat userId={session.user.id} />}
                </div>
              } />
              <Route path="/oportunidades" element={<Oportunidades />} />
              <Route path="/biblioteca" element={<Biblioteca />} />
              <Route path="/ouvidoria" element={<Ouvidoria />} />
              <Route path="/coleta" element={<Home />} />
              <Route path="/telao" element={<PublicDisplay />} />
              <Route path="/auditoria" element={<TeacherDashboard />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/perfil" element={<MeuPerfil escolaNome="CEEP Seabra — Censo CEEP" />} />
              <Route path="/sobre" element={<About escolaNome="CEEP Seabra" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
        <AdinhaAssistant />
        <MercurioToaster />
        <PWAInstallPrompt />
        <CelebracaoAdinhaCampea />
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
        <PWAInstallPrompt />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Layout session={session} />
    </BrowserRouter>
  );
}
