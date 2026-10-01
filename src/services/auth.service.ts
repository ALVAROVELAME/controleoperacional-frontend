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

  async me(): Promise<Usuario> {
    const { data } = await api.get<Usuario>('/api/auth/me');
    return data;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // ============================================================
  // CADASTRO / CONFIRMAÇÃO DE E-MAIL
  // ============================================================
  async cadastrar(dados: UsuarioCadastroDTO): Promise<MensagemRespostaDTO> {
    const { data } = await api.post<MensagemRespostaDTO>('/api/usuarios', dados);
    return data;
  },

  /**
   * Confirma o e-mail do usuário a partir do token recebido por email.
   * O backend retorna 200 se confirmou, ou 400 se o token expirou/é inválido.
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
   * Após sucesso, limpa o localStorage.
   */
  async excluirConta(dados: ExcluirContaDTO): Promise<MensagemRespostaDTO> {
    const { data } = await api.delete<MensagemRespostaDTO>('/api/usuarios/me', {
      data: dados,
    });
    // Limpa os dados locais após exclusão bem-sucedida
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

  getUsuario(): Usuario | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  },
};