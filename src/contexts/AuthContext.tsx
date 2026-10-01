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
    const validar = async () => {
      const token = authService.getToken();
      if (!token) {
        setUsuario(null);
        setCarregando(false);
        return;
      }
      try {
        const dados = await authService.me();
        setUsuario(dados);
        localStorage.setItem('usuario', JSON.stringify(dados));
      } catch {
        authService.logout();
        setUsuario(null);
      } finally {
        setCarregando(false);
      }
    };
    validar();
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