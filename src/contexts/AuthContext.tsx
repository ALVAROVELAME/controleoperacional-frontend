// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { authService } from '../services/auth.service';
import type { Usuario } from '../types';

interface AuthContextType {
  usuario: Usuario | null;
  carregando: boolean;
  autenticado: boolean;
  login: (usuario: Usuario, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
        if (ativo) {
          setUsuario(dados);
          localStorage.setItem('usuario', JSON.stringify(dados));
        }
      } catch (err: unknown) {
        if (!ativo) return;

        const status = (err as { response?: { status?: number } })
          ?.response?.status;

        // Só desloga em caso de problema de autenticação (401/403)
        // Em erros de rede/servidor mantém o usuário em cache (sessão otimista)
        if (status === 401 || status === 403) {
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
      if (e.key === 'usuario' && e.newValue) {
        try {
          setUsuario(JSON.parse(e.newValue) as Usuario);
        } catch {
          /* ignore */
        }
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}