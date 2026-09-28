import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps {
  user?: any;
  onLogout?: () => void;
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

          {user ? (
            <button
              onClick={handleLogoutClick}
              className="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition text-xs font-semibold"
            >
              Sair
            </button>
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