import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'clean' | 'rosa' | 'azul' | 'dark';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'clean',
  setTheme: () => {},
  cycleTheme: () => {},
});

const THEME_STORAGE_KEY = 'ceep_global_theme';
const THEME_CYCLE: AppTheme[] = ['clean', 'rosa', 'azul', 'dark'];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window === 'undefined') return 'clean';
    const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('ceep_perfil_theme');
    if (saved === 'clean' || saved === 'rosa' || saved === 'azul' || saved === 'dark') {
      return saved;
    }
    return 'clean';
  });

  const applyTheme = (targetTheme: AppTheme) => {
    const root = document.documentElement;
    const body = document.body;

    // Remove classes anteriores
    root.classList.remove('theme-clean', 'theme-rosa', 'theme-azul', 'theme-dark', 'dark');
    body.classList.remove('theme-clean', 'theme-rosa', 'theme-azul', 'theme-dark', 'dark');

    // Aplica classes no elemento raiz e no body
    root.setAttribute('data-theme', targetTheme);
    root.classList.add(`theme-${targetTheme}`);
    body.classList.add(`theme-${targetTheme}`);

    if (targetTheme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    }
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      localStorage.setItem('ceep_perfil_theme', newTheme);
    } catch {}
    applyTheme(newTheme);
  };

  const cycleTheme = () => {
    const currentIndex = THEME_CYCLE.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    setTheme(THEME_CYCLE[nextIndex]);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
