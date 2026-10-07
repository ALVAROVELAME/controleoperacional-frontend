// src/services/tarefas.service.ts
import { api } from './api';
import { sanitizar } from '../types/tarefa';
import type { StatusColuna, Tarefa, TarefaInput } from '../types/tarefa';

const BASE = '/api/tarefas';

const lista = (data: unknown): Tarefa[] =>
  Array.isArray(data) ? data.map(sanitizar).filter((t): t is Tarefa => t !== null) : [];

const uma = (data: unknown): Tarefa => {
  const t = sanitizar(data);
  if (!t) throw new Error('Resposta inválida da API de tarefas.');
  return t;
};

/** Corpo enviado ao C#. null explícito = "limpar o campo". */
const corpo = (t: TarefaInput, comPomodoros: boolean) => ({
  titulo: t.titulo,
  descricao: t.descricao ?? null,
  prioridade: t.prioridade, // 'baixa' | 'media' | 'alta'
  status: t.status, // 'a_fazer' | 'em_progresso' | 'revisao' | 'concluido'
  prazo: t.prazo ?? null, // 'YYYY-MM-DD' (DateOnly?)
  pomodorosPlanejados: t.pomodorosPlanejados ?? null,
  ...(comPomodoros ? { pomodoros: t.pomodoros ?? 0 } : {}),
});

export const tarefasService = {
  listar: async (signal?: AbortSignal) => lista((await api.get(BASE, { signal })).data),

  criar: async (t: TarefaInput) => uma((await api.post(BASE, corpo(t, true))).data),

  // PUT não envia "pomodoros": o contador pertence ao servidor (evita sobrescrever com valor velho).
  atualizar: async (id: string, t: TarefaInput) =>
    uma((await api.put(`${BASE}/${encodeURIComponent(id)}`, corpo(t, false))).data),

  mudarStatus: async (id: string, status: StatusColuna) => {
    await api.patch(`${BASE}/${encodeURIComponent(id)}/status`, { status });
  },

  /** Incrementa +1 no servidor. */
  registrarPomodoro: async (id: string) => {
    await api.post(`${BASE}/${encodeURIComponent(id)}/pomodoros`);
  },

  excluir: async (id: string) => {
    await api.delete(`${BASE}/${encodeURIComponent(id)}`);
  },

  zerar: async () => {
    await api.delete(BASE);
  },

  importar: async (itens: TarefaInput[]) =>
    lista((await api.post(`${BASE}/importar`, itens.map((t) => corpo(t, true)))).data),
};