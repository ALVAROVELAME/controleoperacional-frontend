import { createContext, useContext } from 'react';
import type { StatusColuna, Tarefa } from '../types/domain';
import type { TarefaInput } from '../mappers/tarefa.mapper';

export type EstadoSync = 'carregando' | 'pronto' | 'offline';

export type TarefasCtx = {
  tarefas: Tarefa[];
  estado: EstadoSync;
  sincronizando: boolean;
  recarregar: () => void;
  salvar: (dados: TarefaInput, id?: string) => Promise<Tarefa | null>;
  excluir: (id: string) => Promise<Tarefa | null>;
  restaurar: (t: Tarefa) => Promise<Tarefa | null>;
  mover: (id: string, status: StatusColuna) => Promise<boolean>;
  registrarPomodoro: (id: string) => Promise<void>;
  importar: (itens: TarefaInput[]) => Promise<number | null>;
  zerar: () => Promise<boolean>;
};

export const Ctx = createContext<TarefasCtx | null>(null);

export function useTarefas() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTarefas precisa estar dentro de <TarefasProvider>');
  return ctx;
}