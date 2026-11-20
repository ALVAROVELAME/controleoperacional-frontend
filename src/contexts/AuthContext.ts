import { createContext, useContext } from 'react';
import type { UsuarioResponse as Usuario } from '../types/api';

interface AuthContextType {
  usuario: Usuario | null;
  carregando: boolean;
  autenticado: boolean;
  login: (usuario: Usuario, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}