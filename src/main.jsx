import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

const rootElement = document.getElementById('root');

if (rootElement) {
    try {
        ReactDOM.createRoot(rootElement).render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    } catch (error) {
        console.error('Erro na renderização do React:', error);
        rootElement.innerHTML = `
      <div style="color:red; padding:20px; font-family:sans-serif;">
        <h2>Erro ao carregar a aplicação React:</h2>
        <pre>${error.stack || error.message}</pre>
      </div>
    `;
    }
}