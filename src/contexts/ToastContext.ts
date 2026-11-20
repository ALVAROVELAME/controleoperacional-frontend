import { createContext, useContext } from 'react';
import type { Toast, ToastTipo } from '../types/domain';

type ToastCtx = {
  toasts: Toast[];
  push: (texto: string, tipo?: ToastTipo, acao?: Toast['acao']) => void;
  remover: (id: string) => void;
};

export const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return ctx;
}