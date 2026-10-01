import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './index.css';
import { supabase } from './lib/supabaseClient';
import { AdinhaMascote } from './components/AdinhaMascote';
import { Navbar } from './components/Navbar';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Feed = lazy(() => import('./pages/Feed').then(m => ({ default: m.Feed })));
const LykaChat = lazy(() => import('./pages/LykaChat').then(m => ({ default: m.LykaChat })));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const PublicDisplay = lazy(() => import('./pages/PublicDisplay').then(m => ({ default: m.PublicDisplay })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const AdinhaAssistant = lazy(() => import('./components/AdinhaAssistant').then(m => ({ default: m.AdinhaAssistant })));
const MeuPerfil = lazy(() => import('./pages/MeuPerfil').then(m => ({ default: m.MeuPerfil })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));

interface LayoutProps {
  readonly session: any;
}

function Layout({ session }: LayoutProps) {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('pessoas')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (data) {
        setUserRole(data.papel);
        setUserData({
          name: data.nome_completo || session.user.email,
          genero: data.genero || 'masculino'
        });
      }
    }
    void fetchUserData();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isAdminOrTeacher = userRole === 'admin' || userRole === 'professor';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      <Navbar user={userData} onLogout={handleLogout} />

      <main className="flex-1 p-4 sm:p-8 relative flex flex-col items-center">
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
              <Route path="/" element={<Home />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/chat" element={<LykaChat />} />
              <Route 
                path="/telao" 
                element={isAdminOrTeacher ? <PublicDisplay /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/auditoria" 
                element={isAdminOrTeacher ? <TeacherDashboard /> : <Navigate to="/" replace />} 
              />
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
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao obter sessão:", err);
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
          supabase.auth.getSession()
            .then(({ data: { session } }) => {
              setSession(session);
            })
            .catch((err) => {
              console.error("Erro ao obter sessão após login:", err);
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