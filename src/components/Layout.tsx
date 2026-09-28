import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string): boolean => location.pathname === path;

  return (
    <div className="agora-layout">
      {/* Sidebar Lateral Flutuante */}
      <aside className="agora-sidebar">
        <div>
          <div
            title="Censo CEEP — Projeto Ada Lovelace"
            style={{
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
            }}
          >
            🏛️
          </div>

          <nav className="agora-sidebar-nav">
            <button
              className={`agora-nav-btn ${isActive('/') ? 'active' : ''}`}
              onClick={() => navigate('/')}
              title="Dashboard Geral (Indicadores)"
            >
              📊
            </button>
            <button
              className={`agora-nav-btn ${isActive('/coleta') ? 'active' : ''}`}
              onClick={() => navigate('/coleta')}
              title="Ficha de Coleta de Campo"
            >
              📋
            </button>
            <button
              className={`agora-nav-btn ${isActive('/telao') ? 'active' : ''}`}
              onClick={() => navigate('/telao')}
              title="Modo Telão (Projeção)"
            >
              📺
            </button>
            <button
              className={`agora-nav-btn ${isActive('/auditoria') ? 'active' : ''}`}
              onClick={() => navigate('/auditoria')}
              title="Painel Docente / Auditoria"
            >
              📁
            </button>
            <button
              className={`agora-nav-btn ${isActive('/perfil') ? 'active' : ''}`}
              onClick={() => navigate('/perfil')}
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

      {/* Conteúdo dinâmico renderizado pelo React Router */}
      <main className="agora-content">
        <Outlet />
      </main>
    </div>
  );
};