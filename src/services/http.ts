// src/services/http.ts
import axios, { isAxiosError, type AxiosError } from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');

if (!BASE_URL) {
  throw new Error(
    '[http] VITE_API_URL não definida. Crie .env com: VITE_API_URL=https://...',
  );
}

export const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ---------------- Interceptor: request ----------------
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Axios 1.x: config.headers é uma instância de AxiosHeaders.
    // Usar .set() em vez de atribuição direta.
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// ---------------- Interceptor: response ----------------
const ROTAS_SEM_REDIRECT = ['/api/auth/login', '/api/auth/confirmar'];

http.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';
    const publica = ROTAS_SEM_REDIRECT.some((r) => url.includes(r));
    const jaNoLogin = window.location.pathname.startsWith('/login');

    if (status === 401 && !publica && !jaNoLogin) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ---------------- Erro tipado ----------------

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly payload?: unknown;

  constructor(message: string, status?: number, code?: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

/**
 * Converte qualquer erro em ApiError com mensagem legível.
 * Entende ProblemDetails do ASP.NET (title/detail/errors) e { mensagem }.
 */
export function normalizarErro(
  err: unknown,
  padrao = 'Algo deu errado. Tente novamente.',
): ApiError {
  if (err instanceof ApiError) return err;

  if (!isAxiosError(err)) {
    return new ApiError(err instanceof Error ? err.message : padrao);
  }

  const ax = err as AxiosError;

  if (!ax.response) {
    const msg = ax.code === 'ECONNABORTED'
      ? 'O servidor demorou para responder. Tente novamente.'
      : 'Sem conexão com o servidor.';
    return new ApiError(msg, undefined, ax.code);
  }

  const { status, data } = ax.response;
  const payload = data as unknown;

  // string simples
  if (typeof payload === 'string' && payload.trim() && payload.length < 300) {
    return new ApiError(payload, status);
  }

  // ProblemDetails do ASP.NET
  if (payload && typeof payload === 'object') {
    const d = payload as Record<string, unknown>;

    if (typeof d.mensagem === 'string') return new ApiError(d.mensagem, status);
    if (typeof d.message === 'string') return new ApiError(d.message, status);

    // ValidationProblemDetails: { errors: { Field: ["msg"] } }
    if (d.errors && typeof d.errors === 'object') {
      const primeira = Object.values(d.errors as Record<string, unknown>)
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .find((v): v is string => typeof v === 'string');
      if (primeira) return new ApiError(primeira, status);
    }

    if (typeof d.detail === 'string') return new ApiError(d.detail, status);
    if (typeof d.title === 'string') return new ApiError(d.title, status);
  }

  if (status === 401) return new ApiError('Sessão expirada. Faça login novamente.', status);
  if (status === 403) return new ApiError('Sem permissão para esta ação.', status);
  if (status === 404) return new ApiError('Recurso não encontrado.', status);
  if (status === 429) return new ApiError('Muitas requisições. Aguarde um instante.', status);
  if (status >= 500) return new ApiError('Erro no servidor. Tente novamente em instantes.', status);

  return new ApiError(padrao, status);
}

// Compat: mantém `mensagemDeErro` funcionando
export function mensagemDeErro(err: unknown, padrao?: string): string {
  return normalizarErro(err, padrao).message;
}