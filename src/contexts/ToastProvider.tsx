import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { uid } from '../types/domain';
import type { Toast, ToastTipo } from '../types/domain';
import { Ctx } from './ToastContext';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remover = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (texto: string, tipo: ToastTipo = 'info', acao?: Toast['acao']) => {
      const id = uid();
      setToasts((t) => [...t.slice(-3), { id, texto, tipo, acao }]);
      window.setTimeout(() => remover(id), acao ? 7000 : 3600);
    },
    [remover]
  );

  const value = useMemo(() => ({ toasts, push, remover }), [toasts, push, remover]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
