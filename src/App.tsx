import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { supabase } from './lib/supabaseClient';
import { AdinhaMascote } from './components/AdinhaMascote';
import { MercurioToaster } from './components/MercurioToaster';
import { FloatingNav } from './components/FloatingNav';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { CelebracaoAdinhaCampea } from './components/CelebracaoAdinhaCampea';
import { BadgeCelebrationModal } from './components/Gamification/BadgeCelebrationModal';
import { badgeService } from './services/badgeService';
import { tasOfflineSync } from './utils/tasOfflineSync';

function lazyRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await factory();
      return (mod as any).default ? mod : { default: (Object.values(mod)[0] as any) };
    } catch (err: any) {
      console.warn('[LazyRetry] Erro ao carregar módulo dinâmico:', err);
      const msg = String(err?.message || err);
      const isChunkError = 
        msg.includes('dynamically imported module') ||
        msg.includes('Expected a JavaScript-or-Wasm module script') ||
        msg.includes('MIME type');

      if (isChunkError && typeof window !== 'undefined') {
        const lastReload = Number(sessionStorage.getItem('last_version_reload') || 0);
        const now = Date.now();
        if (now - lastReload > 6000) {
          sessionStorage.setItem('last_version_reload', String(now));
          window.location.reload();
        }
      }
      throw err;
    }
  });
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ChunkErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.warn('[ChunkErrorBoundary] Capturou erro:', error);
    const msg = error?.message || '';
    if (
      msg.includes('dynamically imported module') ||
      msg.includes('Expected a JavaScript-or-Wasm module script') ||
      msg.includes('MIME type')
    ) {
      const lastReload = Number(sessionStorage.getItem('last_version_reload') || 0);
      const now = Date.now();
      if (now - lastReload > 6000) {
        sessionStorage.setItem('last_version_reload', String(now));
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-md mx-auto my-12 p-8 bg-white rounded-3xl shadow-xl border border-slate-200 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl">
            🔄
          </div>
          <h2 className="text-lg font-black text-slate-800">Nova versão do Censo CEEP</h2>
          <p className="text-xs text-slate-500 font-medium">
            O aplicativo recebeu uma atualização importante do sistema. Recarregue a página para continuar.
          </p>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('last_version_reload', String(Date.now()));
              window.location.reload();
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/30"
          >
            Atualizar e Acessar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Login = lazyRetry(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Home = lazyRetry(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Dashboard = lazyRetry(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const TeacherDashboard = lazyRetry(() => import('./pages/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const Admin = lazyRetry(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const PublicDisplay = lazyRetry(() => import('./pages/PublicDisplay').then(m => ({ default: m.PublicDisplay })));
const NotFound = lazyRetry(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const AdinhaAssistant = lazyRetry(() => import('./components/AdinhaAssistant').then(m => ({ default: m.AdinhaAssistant })));
const MeuPerfil = lazyRetry(() => import('./pages/MeuPerfil').then(m => ({ default: m.MeuPerfil || m.default })));
const About = lazyRetry(() => import('./pages/About').then(m => ({ default: m.About })));
const Feed = lazyRetry(() => import('./pages/Feed').then(m => ({ default: m.Feed })));
const LykaChat = lazyRetry(() => import('./pages/LykaChat').then(m => ({ default: m.LykaChat })));
const Ranking = lazyRetry(() => import('./pages/Ranking').then(m => ({ default: m.Ranking })));
const Newspaper = lazyRetry(() => import('./pages/Newspaper').then(m => ({ default: m.Newspaper })));
const GroupChannels = lazyRetry(() => import('./components/Chat/GroupChannels').then(m => ({ default: m.GroupChannels })));
const AdinhaDirectChat = lazyRetry(() => import('./components/Chat/AdinhaDirectChat').then(m => ({ default: m.AdinhaDirectChat })));
const Oportunidades = lazyRetry(() => import('./pages/Oportunidades'));
const Biblioteca = lazyRetry(() => import('./pages/Biblioteca'));
const Ouvidoria = lazyRetry(() => import('./pages/Ouvidoria'));
const Membros = lazyRetry(() => import('./pages/Membros').then(m => ({ default: m.Membros })));

interface LayoutProps {
  readonly session: any;
}

function Layout({ session }: LayoutProps) {
  const handleLogout = async () => {
    try {
      localStorage.removeItem('ceep_offline_session');
      localStorage.removeItem('ceep_cached_profile');
    } catch {
      // ignora
    }
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

  useEffect(() => {
    let uid = session?.user?.id;
    if (!uid && typeof window !== 'undefined') {
      try {
        const testUser = JSON.parse(localStorage.getItem('ceep_test_user') || '{}');
        uid = testUser?.id;
      } catch {
        // ignora
      }
    }
    if (uid) {
      // Concede estritamente apenas a insígnia de boas-vindas (primeiro acesso)
      void badgeService.unlockBadge(uid, 'primeiro_acesso');
    }
  }, [session?.user?.id]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 overflow-hidden font-sans relative">
      {/* Navegação Flutuante Adaptativa (Sidebar no Desktop / Barra com Drawer no Mobile) */}
      <FloatingNav onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 lg:pl-28 pb-28 lg:pb-10 relative flex flex-col items-center">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
          <ChunkErrorBoundary>
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
                <Route path="/membros" element={<Membros />} />
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
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/telao" element={<PublicDisplay />} />
                <Route path="/auditoria" element={<TeacherDashboard />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/perfil" element={<MeuPerfil escolaNome="CEEP Seabra — Censo CEEP" />} />
                <Route path="/sobre" element={<About escolaNome="CEEP Seabra" />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ChunkErrorBoundary>
        </div>
        <AdinhaAssistant />
        <MercurioToaster />
        <PWAInstallPrompt />
        <CelebracaoAdinhaCampea />
        <BadgeCelebrationModal />
      </main>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getOfflineSessionFallback = () => {
      try {
        const raw = localStorage.getItem('ceep_offline_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.user?.id) return parsed;
          if (parsed?.id) return { user: parsed };
        }
      } catch {}
      return null;
    };

    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      setSession(activeSession || getOfflineSessionFallback());
      setLoading(false);
    }).catch(() => {
      setSession(getOfflineSessionFallback());
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      setSession(activeSession || getOfflineSessionFallback());
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
        <ChunkErrorBoundary>
          <Suspense fallback={
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-sans gap-4">
              <AdinhaMascote pose="correndo" className="w-20 h-20" />
              <p className="font-bold text-slate-300 animate-pulse">Carregando tela de acesso...</p>
            </div>
          }>
            <Login onLoginSuccess={() => {
              supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
                if (activeSession) {
                  setSession(activeSession);
                } else {
                  try {
                    const raw = localStorage.getItem('ceep_offline_session');
                    if (raw) {
                      const parsed = JSON.parse(raw);
                      setSession(parsed?.user?.id ? parsed : { user: parsed });
                    }
                  } catch {}
                }
              }).catch(() => {
                try {
                  const raw = localStorage.getItem('ceep_offline_session');
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    setSession(parsed?.user?.id ? parsed : { user: parsed });
                  }
                } catch {}
              });
            }} />
          </Suspense>
        </ChunkErrorBoundary>
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
