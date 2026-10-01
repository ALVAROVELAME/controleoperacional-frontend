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
        color: '#a03030',
        border: '1px solid #f5c6c6',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 0.15s',
        ...estilo,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#fdecec')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      Sair
    </button>
  );
}