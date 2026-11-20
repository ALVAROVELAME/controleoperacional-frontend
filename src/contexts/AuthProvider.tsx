import {
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { authService } from '../services/auth.service';
import type { UsuarioResponse as Usuario } from '../types/api';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() =>
    authService.getUsuario()
  );
  const [carregando, setCarregando] = useState(true);

  // Valida o token ao montar o app
  useEffect(() => {
    let ativo = true;

    const validar = async () => {
      const token = authService.getToken();
      if (!token) {
        if (ativo) {
          setUsuario(null);
          setCarregando(false);
        }
        return;
      }

      try {
        const dados = await authService.me();
        if (ativo && authService.getToken() === token) {
          setUsuario(dados);
          localStorage.setItem('usuario', JSON.stringify(dados));
        }
      } catch (err: unknown) {
        if (!ativo) return;

        const status = (err as { response?: { status?: number } })
          ?.response?.status;

        // Só desloga em caso de problema de autenticação (401/403)
        // Em erros de rede/servidor mantém o usuário em cache (sessão otimista)
        if ((status === 401 || status === 403) && authService.getToken() === token) {
          authService.logout();
          setUsuario(null);
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    validar();
    return () => {
      ativo = false;
    };
  }, []);

  // Sincroniza logout entre abas (evento `storage`)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      // Se o token foi removido em outra aba, desloga aqui também
      if (e.key === 'token' && !e.newValue) {
        setUsuario(null);
      }
      // Se o usuário foi removido em outra aba, desloga aqui também
      if (e.key === 'usuario' && !e.newValue) {
        setUsuario(null);
      }
      // Se o usuário foi atualizado em outra aba, sincroniza
      if (e.key === 'usuario' && e.newValue && authService.getToken()) {
        try {
          setUsuario(JSON.parse(e.newValue) as Usuario);
        } catch {
          /* ignore */
        }
      }
    };

    const onSessionExpired = () => setUsuario(null);
    window.addEventListener('storage', onStorage);
    window.addEventListener('auth:session-expired', onSessionExpired);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth:session-expired', onSessionExpired);
    };
  }, []);

  const login = useCallback((user: Usuario, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(user));
    setUsuario(user);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        autenticado: !!usuario,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
