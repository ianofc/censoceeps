import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { supabase } from './lib/supabaseClient';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { PublicDisplay } from './pages/PublicDisplay';

export default function App(): React.JSX.Element {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
      else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      setRole(data?.role || 'aluno');
    } catch (err) {
      console.warn('Erro ao obter perfil do usuário, usando padrão:', err);
      setRole('aluno');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f4f8' }}>
        <p style={{ fontWeight: 'bold', color: '#1e2548' }}>Carregando Censo CEEP...</p>
      </div>
    );
  }

  if (!session) {
    return <Login onLoginSuccess={() => setLoading(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={
            <div>
              <h1 className="agora-page-title" style={{ marginBottom: '1.5rem' }}>Estatísticas do Censo CEEP</h1>
              <div className="agora-dark-card" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#f97316', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    🔥 Monitoramento de Amostras
                  </span>
                  <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>COMUNIDADE ESCOLAR</span>
                      <strong style={{ fontSize: '1.75rem' }}>CEEP Seabra</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>PESQUISA</span>
                      <strong style={{ fontSize: '1.75rem', color: '#3b82f6' }}>Ada Lovelace</strong>
                    </div>
                  </div>
                </div>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '1rem 1.5rem', borderRadius: '12px', minWidth: '220px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#eab308', fontWeight: 'bold' }}>
                    🏆 ESTATUTO / METODOLOGIA
                  </span>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Classificação:</span><strong>IBGE</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}><span>Análise:</span><strong>Gênero & Raça</strong></div>
                  </div>
                </div>
              </div>
              <AnalyticsDashboard />
            </div>
          } />
          <Route path="/coleta" element={<Home userId={session.user.id} />} />
          <Route path="/telao" element={<PublicDisplay />} />
          <Route path="/auditoria" element={<TeacherDashboard />} />
          <Route path="/perfil" element={
            <div>
              <h1 className="agora-page-title" style={{ marginBottom: '1.5rem' }}>Meu Perfil</h1>
              <div className="agora-card" style={{ maxWidth: '480px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    {session.user.email ? session.user.email[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{session.user.email}</h3>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Função: {role?.toUpperCase()}</span>
                  </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Centro Estadual de Educação Profissional de Seabra — CEEP<br />
                  Projeto Ada Lovelace
                </p>
              </div>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}