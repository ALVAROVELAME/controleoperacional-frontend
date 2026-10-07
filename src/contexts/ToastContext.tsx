// src/contexts/ToastContext.tsx
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { uid } from '../types/tarefa';
import type { Toast, ToastTipo } from '../types/tarefa';

type ToastCtx = {
  toasts: Toast[];
  push: (texto: string, tipo?: ToastTipo, acao?: Toast['acao']) => void;
  remover: (id: string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

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

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return ctx;
}