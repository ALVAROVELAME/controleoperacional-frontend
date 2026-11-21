import CarregandoSessao from './CarregandoSessao';
// src/components/auth/RotaPublica.tsx
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Rota para quem NÃO está logado (Landing, Login, Signup).
 * Se o usuário já estiver autenticado, redireciona direto pro Dashboard.
 */
export default function RotaPublica({ children }: { children: ReactNode }) {
  const { autenticado, carregando } = useAuth();

  if (carregando) return <CarregandoSessao />;

  if (autenticado) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}