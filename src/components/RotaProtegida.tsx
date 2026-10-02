// src/components/RotaProtegida.tsx
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function RotaProtegida({ children }: { children: ReactNode }) {
  const { autenticado, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return (
      <div
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
        role="status"
        aria-live="polite"
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
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}