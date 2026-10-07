import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const THEME_KEY = 'ctoperacional:tema';

/** Aplica o tema salvo (ou o do SO) em <html data-theme="dark|light"> antes do React montar. */
function aplicarTemaInicial() {
  let tema: 'claro' | 'escuro';
  try {
    const salvo = localStorage.getItem(THEME_KEY);
    if (salvo === 'claro' || salvo === 'escuro') {
      tema = salvo;
    } else {
      tema = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
    }
  } catch {
    tema = 'claro';
  }
  document.documentElement.setAttribute('data-theme', tema === 'escuro' ? 'dark' : 'light');
}

aplicarTemaInicial();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Elemento #root não encontrado.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);