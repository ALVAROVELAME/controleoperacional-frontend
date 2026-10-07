// src/services/auth.service.ts
import { http } from './http';
import type {
  LoginRequest,
  LoginResponse,
  UsuarioResponse,
  CadastroRequest,
  ExcluirContaRequest,
  MensagemResponse,
} from '../types/api';

const TOKEN_KEY = 'token';
const USER_KEY = 'usuario';

export const authService = {
  async login(dados: LoginRequest): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>('/api/auth/login', dados);
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.usuario) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
      }
    }
    return data;
  },

  async me(): Promise<UsuarioResponse> {
    const { data } = await http.get<UsuarioResponse>('/api/auth/me');
    return data;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async cadastrar(dados: CadastroRequest): Promise<MensagemResponse> {
    const { data } = await http.post<MensagemResponse>('/api/usuarios', dados);
    return data;
  },

  async confirmarEmail(token: string, signal?: AbortSignal): Promise<MensagemResponse> {
    const { data } = await http.get<MensagemResponse>('/api/auth/confirmar', {
      params: { token },
      signal,
    });
    return data;
  },

  /**
   * ⚠️ Mudou de DELETE com body para POST.
   * Backend deve expor: POST /api/usuarios/me/excluir
   * (ou aceitar via query string: DELETE /api/usuarios/me?senha=...)
   */
  async excluirConta(dados: ExcluirContaRequest): Promise<MensagemResponse> {
    const { data } = await http.post<MensagemResponse>(
      '/api/usuarios/me/excluir',
      dados,
    );
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return data;
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUsuario(): UsuarioResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UsuarioResponse;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
};