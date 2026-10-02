// src/components/RotaPublica.tsx
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
      <>
        <style>{`
          @keyframes rot-spin { to { transform: rotate(360deg); } }
        `}</style>
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            color: '#64748b',       /* muted (Slate 500) */
            fontSize: 14,
            fontFamily: 'system-ui, sans-serif',
            gap: 10,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2px solid #dbeafe',       /* Blue 100 */
              borderTopColor: '#2563eb',         /* brand (Blue 600) */
              animation: 'rot-spin 0.8s linear infinite',
            }}
          />
          Carregando…
        </div>
      </>
    );
  }

  if (autenticado) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}