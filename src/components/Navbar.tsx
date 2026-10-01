import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserAvatar } from './UserAvatar';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  readonly user?: {
    readonly name?: string;
    readonly genero?: 'masculino' | 'feminino' | 'outro';
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

  const nomeUsuario = user?.name || 'Pesquisador';
  let generoUsuario: 'masculino' | 'feminino' | 'outro' = user?.genero || 'masculino';
  if (!user?.genero && (nomeUsuario.toLowerCase().includes('juliana') || nomeUsuario.toLowerCase().includes('maria') || nomeUsuario.toLowerCase().includes('ana'))) {
    generoUsuario = 'feminino';
  }

  return (
    <nav className="bg-blue-800 dark:bg-slate-900 text-white shadow-md border-b border-blue-900 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-black tracking-wide">CENSO CEEP</span>
          <span className="text-xs bg-blue-900 dark:bg-slate-800 px-2.5 py-1 rounded-full text-blue-200 font-semibold">
            Ada Lovelace
          </span>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <Link to="/" className={`px-3 py-2 rounded transition ${isActive('/')}`}>
            Início
          </Link>
          <Link to="/feed" className={`px-3 py-2 rounded transition ${isActive('/feed')}`}>
            Feed
          </Link>
          <Link to="/chat" className={`px-3 py-2 rounded transition ${isActive('/chat')}`}>
            Lyka Chat
          </Link>
          <Link to="/telao" className={`px-3 py-2 rounded transition ${isActive('/telao')}`}>
            Modo Telão
          </Link>
          <Link to="/auditoria" className={`px-3 py-2 rounded transition ${isActive('/auditoria')}`}>
            Painel Docente
          </Link>
          <Link to="/perfil" className={`px-3 py-2 rounded transition ${isActive('/perfil')}`}>
            Meu Perfil
          </Link>

          <div className="ml-2">
            <ThemeToggle />
          </div>

          {user ? (
            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-blue-700 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserAvatar genero={generoUsuario} name={nomeUsuario} className="w-8 h-8 text-xs" />
                <span className="text-xs font-bold hidden md:inline">{nomeUsuario}</span>
              </div>
              <button
                type="button"
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