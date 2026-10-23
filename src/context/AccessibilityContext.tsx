import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  fontSizeLevel: number; // 0 = normal, 1 = grande (+15%), 2 = extragrande (+30%)
  reducedMotion: boolean;
  dyslexicFont: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  toggleHighContrast: () => void;
  cycleFontSize: () => void;
  toggleReducedMotion: () => void;
  toggleDyslexicFont: () => void;
  resetAccessibility: () => void;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  fontSizeLevel: 0,
  reducedMotion: false,
  dyslexicFont: false,
};

const AccessibilityContext = createContext<AccessibilityContextType>({
  settings: DEFAULT_SETTINGS,
  toggleHighContrast: () => {},
  cycleFontSize: () => {},
  toggleReducedMotion: () => {},
  toggleDyslexicFont: () => {},
  resetAccessibility: () => {},
});

const STORAGE_KEY = 'ceep_accessibility_settings';

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const applySettings = (s: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // Alto Contraste
    if (s.highContrast) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }

    // Tamanho da Fonte
    root.classList.remove('font-size-md', 'font-size-lg');
    if (s.fontSizeLevel === 1) root.classList.add('font-size-md');
    if (s.fontSizeLevel === 2) root.classList.add('font-size-lg');

    // Movimento Reduzido
    if (s.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Fonte para Dislexia
    if (s.dyslexicFont) {
      root.classList.add('font-dyslexic');
    } else {
      root.classList.remove('font-dyslexic');
    }
  };

  const update = (partial: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      applySettings(next);
      return next;
    });
  };

  const toggleHighContrast = () => update({ highContrast: !settings.highContrast });
  const cycleFontSize = () => update({ fontSizeLevel: (settings.fontSizeLevel + 1) % 3 });
  const toggleReducedMotion = () => update({ reducedMotion: !settings.reducedMotion });
  const toggleDyslexicFont = () => update({ dyslexicFont: !settings.dyslexicFont });
  const resetAccessibility = () => update(DEFAULT_SETTINGS);

  useEffect(() => {
    applySettings(settings);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        toggleHighContrast,
        cycleFontSize,
        toggleReducedMotion,
        toggleDyslexicFont,
        resetAccessibility,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
