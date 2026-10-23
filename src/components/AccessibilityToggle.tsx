import React, { useState } from 'react';
import { 
  Eye, 
  ZoomIn, 
  Type, 
  RotateCcw, 
  Sparkles, 
  X 
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

interface AccessibilityToggleProps {
  className?: string;
  size?: number;
}

export const AccessibilityToggle: React.FC<AccessibilityToggleProps> = ({ className = '', size = 32 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    settings,
    toggleHighContrast,
    cycleFontSize,
    toggleReducedMotion,
    toggleDyslexicFont,
    resetAccessibility,
  } = useAccessibility();

  const isAnyActive = settings.highContrast || settings.fontSizeLevel > 0 || settings.reducedMotion || settings.dyslexicFont;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Painel de Acessibilidade (Alto Contraste, Fontes, Movimento)"
        aria-label="Abrir opções de acessibilidade"
        className={`rounded-full transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shadow-md border-2 ${
          isAnyActive
            ? 'bg-amber-500 text-white border-amber-300 ring-2 ring-amber-400'
            : 'bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-blue-500'
        } ${className}`}
        style={{ width: size, height: size }}
      >
        {/* Ícone universal de acessibilidade */}
        <Eye size={size > 30 ? 16 : 14} />
      </button>

      {/* Menu flutuante de configurações de acessibilidade */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[65]" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-2xl z-[70] animate-in fade-in zoom-in-95 font-sans">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Eye size={14} className="text-blue-600" /> Acessibilidade
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              {/* Alto Contraste */}
              <button
                type="button"
                onClick={toggleHighContrast}
                className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer text-left font-bold ${
                  settings.highContrast
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={14} /> Alto Contraste
                </span>
                <span className="text-[10px] uppercase font-black">
                  {settings.highContrast ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Tamanho da Fonte */}
              <button
                type="button"
                onClick={cycleFontSize}
                className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer text-left font-bold ${
                  settings.fontSizeLevel > 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ZoomIn size={14} /> Tamanho do Texto
                </span>
                <span className="text-[10px] uppercase font-black">
                  {settings.fontSizeLevel === 0 ? 'Normal' : settings.fontSizeLevel === 1 ? '+15%' : '+30%'}
                </span>
              </button>

              {/* Fonte Amigável para Dislexia */}
              <button
                type="button"
                onClick={toggleDyslexicFont}
                className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer text-left font-bold ${
                  settings.dyslexicFont
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Type size={14} /> Fonte p/ Dislexia
                </span>
                <span className="text-[10px] uppercase font-black">
                  {settings.dyslexicFont ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Resetar */}
              {isAnyActive && (
                <button
                  type="button"
                  onClick={resetAccessibility}
                  className="flex items-center justify-center gap-1.5 p-1.5 mt-1 rounded-xl text-slate-500 hover:text-rose-600 text-[11px] font-bold cursor-pointer"
                >
                  <RotateCcw size={12} /> Restaurar Padrões
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
