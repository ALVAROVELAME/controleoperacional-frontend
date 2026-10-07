// src/contexts/TarefasContext.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { tarefasService } from '../services/tarefas.service';
import { mensagemDeErro } from '../services/api';
import { paraInput, sanitizar } from '../types/tarefa';
import type { StatusColuna, Tarefa, TarefaInput } from '../types/tarefa';

const LEGADO_KEY = 'ctoperacional:tarefas';
const cacheKey = (dono: string) => `ctoperacional:cache:${dono}`;

const lerLista = (key: string): Tarefa[] => {
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data.map(sanitizar).filter((t): t is Tarefa => t !== null) : [];
  } catch {
    return [];
  }
};

export const limparCacheTarefas = (dono = 'anon') => {
  try {
    localStorage.removeItem(cacheKey(dono));
    localStorage.removeItem(LEGADO_KEY);
  } catch {
    /* ignore */
  }
};

export type EstadoSync = 'carregando' | 'pronto' | 'offline';

type TarefasCtx = {
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

const Ctx = createContext<TarefasCtx | null>(null);

export function TarefasProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const dono = usuario?.email ?? 'anon';
  const { push } = useToast();

  const [tarefas, setTarefas] = useState<Tarefa[]>(() => lerLista(cacheKey(dono)));
  const [estado, setEstado] = useState<EstadoSync>('carregando');
  const [pendentes, setPendentes] = useState(0);
  const [tentativa, setTentativa] = useState(0);
  const ref = useRef(tarefas);

  useEffect(() => {
    ref.current = tarefas;
    try {
      localStorage.setItem(cacheKey(dono), JSON.stringify(tarefas));
    } catch {
      /* armazenamento cheio ou indisponível */
    }
  }, [tarefas, dono]);

  const executar = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setPendentes((n) => n + 1);
    try {
      return await fn();
    } finally {
      setPendentes((n) => n - 1);
    }
  }, []);

  /* ------------------------------- operações ------------------------------- */

  const salvar = useCallback(
    async (dados: TarefaInput, id?: string) => {
      try {
        const salva = await executar(() => (id ? tarefasService.atualizar(id, dados) : tarefasService.criar(dados)));
        setTarefas((prev) =>
          prev.some((t) => t.id === salva.id) ? prev.map((t) => (t.id === salva.id ? salva : t)) : [...prev, salva]
        );
        return salva;
      } catch (err) {
        push(mensagemDeErro(err, 'Não foi possível salvar a tarefa.'), 'erro');
        return null;
      }
    },
    [executar, push]
  );

  const restaurar = useCallback((t: Tarefa) => salvar(paraInput(t)), [salvar]);

  const excluir = useCallback(
    async (id: string) => {
      const antes = ref.current.find((t) => t.id === id);
      if (!antes) return null;
      setTarefas((prev) => prev.filter((t) => t.id !== id));
      try {
        await executar(() => tarefasService.excluir(id));
        return antes;
      } catch (err) {
        setTarefas((prev) => (prev.some((t) => t.id === id) ? prev : [...prev, antes]));
        push(mensagemDeErro(err, 'Não foi possível excluir a tarefa.'), 'erro');
        return null;
      }
    },
    [executar, push]
  );

  const mover = useCallback(
    async (id: string, status: StatusColuna) => {
      const antes = ref.current.find((t) => t.id === id);
      if (!antes || antes.status === status) return false;
      setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      try {
        await executar(() => tarefasService.mudarStatus(id, status));
        return true;
      } catch (err) {
        setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, status: antes.status } : t)));
        push(mensagemDeErro(err, 'Não foi possível mover a tarefa.'), 'erro');
        return false;
      }
    },
    [executar, push]
  );

  const registrarPomodoro = useCallback(
    async (id: string) => {
      setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, pomodoros: (t.pomodoros ?? 0) + 1 } : t)));
      try {
        await executar(() => tarefasService.registrarPomodoro(id));
      } catch (err) {
        setTarefas((prev) =>
          prev.map((t) => (t.id === id ? { ...t, pomodoros: Math.max(0, (t.pomodoros ?? 1) - 1) || undefined } : t))
        );
        push(mensagemDeErro(err, 'Não foi possível registrar o pomodoro.'), 'erro');
      }
    },
    [executar, push]
  );

  const importar = useCallback(
    async (itens: TarefaInput[]) => {
      if (itens.length === 0) return 0;
      try {
        const novas = await executar(() => tarefasService.importar(itens));
        setTarefas((prev) => {
          const ids = new Set(prev.map((t) => t.id));
          return [...prev, ...novas.filter((t) => !ids.has(t.id))];
        });
        return novas.length;
      } catch (err) {
        push(mensagemDeErro(err, 'Não foi possível importar as tarefas.'), 'erro');
        return null;
      }
    },
    [executar, push]
  );

  const zerar = useCallback(async () => {
    try {
      await executar(() => tarefasService.zerar());
      setTarefas([]);
      return true;
    } catch (err) {
      push(mensagemDeErro(err, 'Não foi possível apagar as tarefas.'), 'erro');
      return false;
    }
  }, [executar, push]);

  /* ------------------------------ carga inicial ------------------------------ */

  useEffect(() => {
    const ctrl = new AbortController();
    setEstado('carregando');

    tarefasService
      .listar(ctrl.signal)
      .then((lista) => {
        setTarefas(lista);
        setEstado('pronto');

        const legado = lista.length === 0 ? lerLista(LEGADO_KEY) : [];
        if (legado.length > 0) {
          push(`${legado.length} tarefas deste navegador ainda não estão na sua conta.`, 'info', {
            rotulo: 'Enviar',
            fn: () => {
              void importar(legado.map(paraInput)).then((n) => {
                if (n !== null) {
                  localStorage.removeItem(LEGADO_KEY);
                  push(`${n} tarefas enviadas para a sua conta`, 'sucesso');
                }
              });
            },
          });
        }
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setEstado('offline');
        push(mensagemDeErro(err, 'Não foi possível carregar as tarefas.'), 'erro');
      });

    return () => ctrl.abort();
  }, [tentativa, push, importar]);

  const recarregar = useCallback(() => setTentativa((n) => n + 1), []);

  const value = useMemo<TarefasCtx>(
    () => ({
      tarefas,
      estado,
      sincronizando: estado === 'carregando' || pendentes > 0,
      recarregar,
      salvar,
      excluir,
      restaurar,
      mover,
      registrarPomodoro,
      importar,
      zerar,
    }),
    [tarefas, estado, pendentes, recarregar, salvar, excluir, restaurar, mover, registrarPomodoro, importar, zerar]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTarefas() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTarefas precisa estar dentro de <TarefasProvider>');
  return ctx;
}