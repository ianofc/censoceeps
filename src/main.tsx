import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Elemento 'root' não encontrado no DOM.");
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error: unknown) {
    console.error('Erro na renderização do React:', error);
    rootElement.innerHTML = `
      <div style="color: #ef4444; padding: 20px; font-family: system-ui, sans-serif; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 20px;">
        <h2 style="margin-top: 0; font-size: 1.25rem;">Erro ao carregar a aplicação React</h2>
        <pre style="white-space: pre-wrap; font-size: 0.875rem; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #fee2e2;">${error?.stack || error?.message || error}</pre>
      </div>
    `;
  }
}