import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserAvatar } from './UserAvatar';

interface NavbarProps {
  readonly user?: {
    name?: string;
    genero?: 'masculino' | 'feminino' | 'outro';
  };
  readonly onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    location.pathname === path ? 'bg-blue-700 font-bold' : 'hover:bg-blue-600';

  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
    navigate('/login');
  };

  // Detecta o gênero do usuário logado dinamicamente para o Avatar
  const nomeUsuario = user?.name || 'Pesquisador';
  let generoUsuario: 'masculino' | 'feminino' | 'outro' = user?.genero || 'masculino';
  if (!user?.genero && (nomeUsuario.toLowerCase().includes('juliana') || nomeUsuario.toLowerCase().includes('maria') || nomeUsuario.toLowerCase().includes('ana'))) {
    generoUsuario = 'feminino';
  }

  return (
    <nav className="bg-blue-800 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-black tracking-wide">CENSO CEEP</span>
          <span className="text-xs bg-blue-900 px-2.5 py-1 rounded-full text-blue-200 font-semibold">
            Ada Lovelace
          </span>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <Link to="/" className={`px-3 py-2 rounded transition ${isActive('/')}`}>
            Urna de Coleta
          </Link>
          <Link to="/dashboard" className={`px-3 py-2 rounded transition ${isActive('/dashboard')}`}>
            Estatísticas
          </Link>
          <Link to="/telao" className={`px-3 py-2 rounded transition ${isActive('/telao')}`}>
            Modo Telão
          </Link>
          <Link to="/admin" className={`px-3 py-2 rounded transition ${isActive('/admin')}`}>
            Painel Docente
          </Link>
          <Link to="/about" className={`px-3 py-2 rounded transition ${isActive('/about')}`}>
            Sobre
          </Link>

          {user ? (
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-blue-700">
              <div className="flex items-center gap-2">
                <UserAvatar genero={generoUsuario} name={nomeUsuario} className="w-8 h-8 text-xs" />
                <span className="text-xs font-bold hidden md:inline">{nomeUsuario}</span>
              </div>
              <button
                onClick={handleLogoutClick}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition text-xs font-semibold cursor-pointer border-0"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-4 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded transition text-xs font-semibold"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};