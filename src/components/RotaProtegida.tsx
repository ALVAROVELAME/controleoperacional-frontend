import CarregandoSessao from './CarregandoSessao';
// src/components/RotaProtegida.tsx
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function RotaProtegida({ children }: { children: ReactNode }) {
  const { autenticado, carregando } = useAuth();

  if (carregando) return <CarregandoSessao />;

  if (!autenticado) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}