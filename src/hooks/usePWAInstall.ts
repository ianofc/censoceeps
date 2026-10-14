import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Variável global para reter o evento antes do React montar
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('pwa-installable'));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInApp, setIsInApp] = useState<boolean>(false);
  const [isSafari, setIsSafari] = useState<boolean>(false);

  useEffect(() => {
    // 1. Verifica se já está rodando como PWA instalado (Standalone)
    const navWithStandalone = window.navigator as unknown as { standalone?: boolean };
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      navWithStandalone.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detecta iOS (iPhone, iPad, iPod ou iPadOS que envia MacIntel mas possui touch)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = 
      /iphone|ipad|ipod/.test(userAgent) || 
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // 3. Detecta se está rodando dentro de um In-App Browser (Instagram, WhatsApp, Facebook, TikTok, Twitter, Google App)
    const inApp = /fbav|instagram|fban|gsa|line|twitter|tiktok|bytedance|wv/i.test(userAgent) ||
      (isIOSDevice && !userAgent.includes('safari') && !userAgent.includes('crios') && !userAgent.includes('fxios'));
    setIsInApp(inApp);

    // 4. Detecta Safari nativo no iOS (onde o botão de Compartilhar está na barra inferior)
    const safari = isIOSDevice && userAgent.includes('safari') && !userAgent.includes('crios') && !userAgent.includes('fxios') && !inApp;
    setIsSafari(safari);

    // 5. Listener do evento nativo
    const handleInstallable = () => {
      setDeferredPrompt(globalDeferredPrompt);
    };

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
      return true;
    } catch (err) {
      console.warn('Erro ao disparar prompt PWA:', err);
      return false;
    }
  };

  return {
    isInstallable: !!deferredPrompt || (isIOS && !isInstalled),
    hasPrompt: !!deferredPrompt,
    isInstalled,
    isIOS,
    isInApp,
    isSafari,
    triggerInstall,
  };
}
