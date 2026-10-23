import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';

// Auto-recuperação resiliente contra chunks desatualizados após deploys
if (typeof window !== 'undefined') {
  const triggerAutoReload = (reason: string) => {
    console.warn(`[AutoReload] Detectada inconsistência de versão (${reason}). Atualizando para nova versão...`);
    const lastReload = Number(sessionStorage.getItem('last_version_reload') || 0);
    const now = Date.now();
    // Previne loops de recarga rápida (espera no mínimo 6s entre recargas)
    if (now - lastReload > 6000) {
      sessionStorage.setItem('last_version_reload', String(now));
      // Se houver service worker, força atualização antes de recarregar
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => void reg.update());
        }).catch(() => {});
      }
      window.location.reload();
    }
  };

  // 1. Vite preloadError nativo
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    triggerAutoReload('vite:preloadError');
  });

  // 2. Erros globais de script ou CSS com MIME incorreto / chunk 404
  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    if (
      msg.includes('dynamically imported module') ||
      msg.includes('Expected a JavaScript-or-Wasm module script') ||
      msg.includes('MIME type')
    ) {
      triggerAutoReload('error: ' + msg);
    }
  });

  // 3. Rejeições de Promises não tratadas de import() dinâmico
  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event?.reason?.message || event?.reason || '');
    if (
      reason.includes('dynamically imported module') ||
      reason.includes('Expected a JavaScript-or-Wasm module script') ||
      reason.includes('MIME type')
    ) {
      triggerAutoReload('unhandledrejection: ' + reason);
    }
  });
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Elemento 'root' não encontrado no DOM.");
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </React.StrictMode>
    );
  } catch (error: any) {
    console.error('Erro na renderização do React:', error);
    rootElement.innerHTML = `
      <div style="color: #ef4444; padding: 20px; font-family: system-ui, sans-serif; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 20px;">
        <h2 style="margin-top: 0; font-size: 1.25rem;">Erro ao carregar a aplicação React</h2>
        <pre style="white-space: pre-wrap; font-size: 0.875rem; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #fee2e2;">${error?.stack || error?.message || error}</pre>
      </div>
    `;
  }
}
