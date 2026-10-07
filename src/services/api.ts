// src/services/api.ts
import axios, { isAxiosError } from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');

if (!BASE_URL) {
  throw new Error(
    '[api] VITE_API_URL não definida. Crie um arquivo .env na raiz do projeto ' +
      'com a linha: VITE_API_URL=https://controle-operacional-api.duckdns.org'
  );
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ============ REQUEST: adiciona Authorization (JWT do ASP.NET) ============
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ RESPONSE: sessão expirada ============
// Só o 401 significa "token inválido/expirado". O 403 do ASP.NET é "sem permissão"
// para aquele recurso — deslogar nesse caso expulsaria o usuário sem motivo.
const ROTAS_SEM_REDIRECT = ['/api/auth/login', '/api/auth/confirmar'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';

    const rotaPublica = ROTAS_SEM_REDIRECT.some((r) => url.includes(r));
    const jaEstouNoLogin = window.location.pathname.startsWith('/login');

    if (status === 401 && !rotaPublica && !jaEstouNoLogin) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

/**
 * Extrai uma mensagem legível de qualquer erro da API.
 * Entende o formato do ASP.NET (ProblemDetails / ValidationProblemDetails)
 * e o formato antigo { mensagem: "..." }.
 */
export function mensagemDeErro(err: unknown, padrao = 'Algo deu errado. Tente novamente.'): string {
  if (!isAxiosError(err)) return err instanceof Error && err.message ? err.message : padrao;

  if (!err.response) {
    return err.code === 'ECONNABORTED'
      ? 'O servidor demorou para responder. Tente novamente.'
      : 'Sem conexão com o servidor.';
  }

  const data = err.response.data as unknown;
  if (typeof data === 'string' && data.trim() && data.length < 300) return data;

  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (typeof d.mensagem === 'string') return d.mensagem;
    if (typeof d.message === 'string') return d.message;

    if (d.errors && typeof d.errors === 'object') {
      const primeira = Object.values(d.errors as Record<string, unknown>)
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .find((v): v is string => typeof v === 'string');
      if (primeira) return primeira;
    }
    if (typeof d.detail === 'string') return d.detail;
    if (typeof d.title === 'string') return d.title;
  }

  if (err.response.status === 429) return 'Muitas requisições. Aguarde um instante.';
  if (err.response.status >= 500) return 'Erro no servidor. Tente novamente em instantes.';
  return padrao;
}