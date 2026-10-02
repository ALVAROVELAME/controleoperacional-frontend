// src/services/auth.service.ts
import { api } from './api';
import type {
  LoginDTO,
  LoginRespostaDTO,
  Usuario,
  UsuarioCadastroDTO,
  ExcluirContaDTO,
  MensagemRespostaDTO,
} from '../types';

const TOKEN_KEY = 'token';
const USER_KEY = 'usuario';

export const authService = {
  // ============================================================
  // AUTENTICAÇÃO
  // ============================================================
  /**
   * Autentica o usuário e persiste token + dados no localStorage.
   * Endpoint: POST /api/auth/login
   */
  async login(dados: LoginDTO): Promise<LoginRespostaDTO> {
    const { data } = await api.post<LoginRespostaDTO>('/api/auth/login', dados);
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.usuario) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
      }
    }
    return data;
  },

  /**
   * Retorna os dados do usuário logado.
   * Endpoint: GET /api/auth/me
   */
  async me(): Promise<Usuario> {
    const { data } = await api.get<Usuario>('/api/auth/me');
    return data;
  },

  /**
   * Remove token e dados do usuário do localStorage.
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // ============================================================
  // CADASTRO / CONFIRMAÇÃO DE E-MAIL
  // ============================================================
  /**
   * Cadastra um novo usuário.
   * Endpoint: POST /api/usuarios
   */
  async cadastrar(dados: UsuarioCadastroDTO): Promise<MensagemRespostaDTO> {
    const { data } = await api.post<MensagemRespostaDTO>('/api/usuarios', dados);
    return data;
  },

  /**
   * Confirma o e-mail do usuário a partir do token recebido por e-mail.
   * Endpoint: GET /api/auth/confirmar?token=...
   * Retorna 200 se confirmou, ou 400/401/404/409/410 se o token é inválido/expirado.
   */
  async confirmarEmail(token: string): Promise<MensagemRespostaDTO> {
    const { data } = await api.get<MensagemRespostaDTO>('/api/auth/confirmar', {
      params: { token },
    });
    return data;
  },

  // ============================================================
  // EXCLUSÃO DE CONTA
  // ============================================================
  /**
   * Exclui a conta do usuário logado.
   * Requer a senha atual para confirmação.
   * Endpoint: DELETE /api/usuarios/me
   * Após sucesso, limpa o localStorage.
   */
  async excluirConta(dados: ExcluirContaDTO): Promise<MensagemRespostaDTO> {
    const { data } = await api.delete<MensagemRespostaDTO>('/api/usuarios/me', {
      data: dados,
    });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return data;
  },

  // ============================================================
  // HELPERS DE STORAGE
  // ============================================================
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Lê o usuário do localStorage.
   * Se o JSON estiver corrompido, limpa a entrada e retorna null.
   */
  getUsuario(): Usuario | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      // Dado corrompido → remove para não quebrar o app no próximo boot
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
};