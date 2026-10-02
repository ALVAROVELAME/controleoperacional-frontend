// src/services/api.ts
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  throw new Error(
    '[api] VITE_API_URL não definida. Crie um arquivo .env na raiz do projeto ' +
    'com a linha: VITE_API_URL=https://controle-operacional-api.duckdns.org'
  );
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ============ REQUEST: adiciona Authorization ============
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ RESPONSE: trata 401/403 (token expirado/inválido) ============
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';

    // Não redireciona se o próprio login falhou (401 esperado)
    const isLoginRequest = url.includes('/api/auth/login');
    const isConfirmarRequest = url.includes('/api/auth/confirmar');
    const jaEstouNoLogin = window.location.pathname.startsWith('/login');

    const precisaDeslogar =
      (status === 401 || status === 403) &&
      !isLoginRequest &&
      !isConfirmarRequest &&
      !jaEstouNoLogin;

    if (precisaDeslogar) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);