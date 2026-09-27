import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './lib/supabase';
import { Login } from './pages/Login';
import { AdinhaAssistant } from './components/AdinhaAssistant';

export default function App() {
    const [session, setSession] = useState(null);
    const [role, setRole] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);

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

    const fetchUserRole = async (userId) => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();
            setRole(data?.role || 'aluno');
        } catch (err) {
            setRole('aluno');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => supabase.auth.signOut();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f4f8' }}>
                <p style={{ fontWeight: 'bold', color: '#1e2548' }}>A carregar Ágora OS...</p>
            </div>
        );
    }

    if (!session) {
        return <Login onLoginSuccess={() => setLoading(true)} />;
    }

    return (
        <div className="agora-layout">
            {/* Sidebar Lateral Estilo Ágora */}
            <aside className="agora-sidebar">
                <div>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2563eb, #1e2548)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        marginBottom: '2rem'
                    }}>
                        🏛️
                    </div>

                    <nav className="agora-sidebar-nav">
                        <button
                            className={`agora-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                            title="Dashboard ao Vivo"
                        >
                            📊
                        </button>
                        <button
                            className={`agora-nav-btn ${activeTab === 'auditoria' ? 'active' : ''}`}
                            onClick={() => setActiveTab('auditoria')}
                            title="Auditoria Oficial"
                        >
                            📋
                        </button>
                        <button
                            className={`agora-nav-btn ${activeTab === 'midias' ? 'active' : ''}`}
                            onClick={() => setActiveTab('midias')}
                            title="Estúdio de Mídias"
                        >
                            🎨
                        </button>
                        <button
                            className={`agora-nav-btn ${activeTab === 'perfil' ? 'active' : ''}`}
                            onClick={() => setActiveTab('perfil')}
                            title="Meu Perfil"
                        >
                            👤
                        </button>
                    </nav>
                </div>

                <div className="agora-sidebar-footer">
                    <button className="agora-logout-btn" onClick={handleLogout} title="Sair do Sistema">
                        ➔
                    </button>
                </div>
            </aside>

            {/* Área Central da Aplicação */}
            <main className="agora-content">
                {activeTab === 'dashboard' && (
                    <div>
                        <h1 className="agora-page-title" style={{ marginBottom: '1.5rem' }}>Dashboard ao Vivo</h1>

                        {/* Termômetro Escuro Superior */}
                        <div className="agora-dark-card" style={{ marginBottom: '1.5rem' }}>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: '#f97316', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                    🔥 Termômetro da Democracia
                                </span>
                                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>ELEITORADO BASE</span>
                                        <strong style={{ fontSize: '1.75rem' }}>38</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>CÉDULAS REGISTADAS</span>
                                        <strong style={{ fontSize: '1.75rem', color: '#22c55e' }}>35</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>COMPARECIMENTO</span>
                                        <strong style={{ fontSize: '1.75rem', color: '#3b82f6' }}>92.1%</strong>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                padding: '1rem 1.5rem',
                                borderRadius: '12px',
                                minWidth: '220px'
                            }}>
                                <span style={{ fontSize: '0.75rem', color: '#eab308', fontWeight: 'bold' }}>
                                    🏆 TOP 5 ZONAS (ENGAJAMENTO)
                                </span>
                                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>1º 3º ADM AM</span><strong>100%</strong></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}><span>2º 3º ADM BM</span><strong>96.8%</strong></div>
                                </div>
                            </div>
                        </div>

                        {/* Subcards Brancos de Informação */}
                        <div className="agora-card">
                            <h3>Status da Coleta de Dados</h3>
                            <p style={{ marginTop: '0.5rem', color: '#64748b' }}>
                                Conectado ao Supabase Realtime. Atualizações de entrevistas em tempo real ativas.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'auditoria' && (
                    <div>
                        <h1 className="agora-page-title" style={{ marginBottom: '1.5rem' }}>Auditoria Oficial</h1>
                        <div className="agora-card">
                            <p>Módulo de relatórios e exportação CSV/PDF de entrevistas do Censo CEEP.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'midias' && (
                    <div>
                        <h1 className="agora-page-title" style={{ marginBottom: '1.5rem' }}>Estúdio de Mídias</h1>
                        <div className="agora-card">
                            <p>Módulo de impressão de relatórios e identificadores visuais.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'perfil' && (
                    <div>
                        <h1 className="agora-page-title" style={{ marginBottom: '1.5rem' }}>Meu Perfil</h1>
                        <div className="agora-card" style={{ maxWidth: '480px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                                <div>
                                    <h3>{session.user.email}</h3>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Função: {role}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <AdinhaAssistant />
        </div>
    );
}