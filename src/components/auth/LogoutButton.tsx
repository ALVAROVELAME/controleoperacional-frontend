// src/components/auth/LogoutButton.tsx
import { useAuth } from '../../contexts/AuthContext';
import type { CSSProperties } from 'react';

interface Props {
  estilo?: CSSProperties;
  confirmar?: boolean;
  /** Pra onde redirecionar após logout. Default: '/login' */
  redirecionarPara?: string;
}

export default function LogoutButton({
  estilo,
  confirmar = true,
  redirecionarPara = '/login',
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
      className="logout-action"
      style={estilo}
    >
      Sair
    </button>
  );
}