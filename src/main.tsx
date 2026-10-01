import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Aplica o tema salvo no <html data-theme="dark|light">
const temaSalvo = localStorage.getItem('agrogestor:tema');
if (temaSalvo === 'escuro') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Elemento #root não encontrado.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);