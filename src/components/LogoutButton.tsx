// src/components/LogoutButton.tsx
import { useAuth } from '../contexts/AuthContext';
import type { CSSProperties } from 'react';

interface Props {
  estilo?: CSSProperties;
  confirmar?: boolean;
  /** Pra onde redirecionar após logout. Default: '/' (landing) */
  redirecionarPara?: string;
}

export default function LogoutButton({
  estilo,
  confirmar = true,
  redirecionarPara = '/',
}: Props) {
  const { logout } = useAuth();

  const handleLogout = () => {
    if (confirmar && !window.confirm('Deseja realmente sair?')) return;

    // 1. Limpa o token/usuário do localStorage + state
    logout();

    // 2. Force reload completo — garante que o AuthContext
    //    remonta SEM token, evitando race condition
    window.location.href = redirecionarPara;
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      style={{
        padding: '8px 16px',
        background: 'transparent',
        color: '#dc2626',              /* danger (Red 600) */
        border: '1px solid #fecaca',   /* danger-line (Red 200) */
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        ...estilo,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#fef2f2'; /* danger-soft (Red 50) */
        e.currentTarget.style.borderColor = '#dc2626';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = '#fecaca';
      }}
    >
      Sair
    </button>
  );
}