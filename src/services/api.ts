import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  throw new Error(
    '[api] VITE_API_URL não definida. Crie um arquivo .env na raiz do projeto ' +
    'com a linha: VITE_API_URL=https://sua-url-da-api'
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

// ============ RESPONSE: trata 401 (token expirado/inválido) ============
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';

    // Não redireciona se o próprio login falhou (401 esperado)
    const isLoginRequest = url.includes('/api/auth/login');
    const jaEstouNoLogin = window.location.pathname.startsWith('/login');

    if (status === 401 && !isLoginRequest && !jaEstouNoLogin) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);