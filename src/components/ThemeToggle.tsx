import React from 'react';
import { useTheme, AppTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: number;
}

const THEME_INFO: Record<AppTheme, { name: string; color: string; border: string; ring: string }> = {
  clean: { name: 'Clean', color: 'bg-slate-100', border: 'border-slate-300', ring: 'ring-slate-400' },
  rosa: { name: 'Rosa', color: 'bg-gradient-to-tr from-rose-400 to-pink-500', border: 'border-rose-300', ring: 'ring-rose-400' },
  azul: { name: 'Azul', color: 'bg-gradient-to-tr from-blue-500 to-indigo-600', border: 'border-blue-300', ring: 'ring-blue-400' },
  dark: { name: 'Dark', color: 'bg-slate-900', border: 'border-amber-400/80', ring: 'ring-amber-400' },
};

/**
 * Botão circular minimalista para alternar temas clicando em sequência:
 * Clean -> Rosa -> Azul -> Dark -> Clean
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 32 }) => {
  const { theme, cycleTheme } = useTheme();
  const current = THEME_INFO[theme];

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={`Tema atual: ${current.name} (Clique para alternar: Clean, Rosa, Azul, Dark)`}
      aria-label={`Alternar tema do sistema (atual: ${current.name})`}
      className={`relative rounded-full transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shadow-md ${current.color} ${current.border} border-2 hover:ring-2 ${current.ring} ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Indicador interno visual com mini círculo decorativo */}
      <span className="w-2.5 h-2.5 rounded-full bg-white/90 shadow-xs" />
    </button>
  );
};
