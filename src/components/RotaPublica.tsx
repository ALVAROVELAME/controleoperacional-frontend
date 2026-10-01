import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Rota para quem NÃO está logado (Landing, Login, Signup).
 * Se o usuário já estiver autenticado, redireciona direto pro Dashboard.
 */
export default function RotaPublica({ children }: { children: ReactNode }) {
  const { autenticado, carregando } = useAuth();

  if (carregando) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: '#6b806b',
          fontSize: 14,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Carregando...
      </div>
    );
  }

  if (autenticado) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}