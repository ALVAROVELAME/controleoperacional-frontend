// src/services/tarefas.service.ts
import { http } from './http';
import { sanitizarTarefa, sanitizarLista, paraPayloadCriar, paraPayloadAtualizar } from '../mappers/tarefa.mapper';
import type { Tarefa, StatusColuna } from '../types/domain';
import type {
  CriarTarefaRequest,
  AtualizarTarefaRequest,
  MudarStatusRequest,
  TarefaResponse,
} from '../types/api';

const BASE = '/api/tarefas';

function uma(raw: unknown): Tarefa {
  const t = sanitizarTarefa(raw);
  if (!t) throw new Error('Resposta inválida da API de tarefas.');
  return t;
}

export const tarefasService = {
  async listar(signal?: AbortSignal): Promise<Tarefa[]> {
    const { data } = await http.get<TarefaResponse[]>(BASE, { signal });
    return sanitizarLista(data);
  },

  async criar(t: Omit<Tarefa, 'id' | 'criadoEm'>): Promise<Tarefa> {
    const body: CriarTarefaRequest = paraPayloadCriar(t as Tarefa);
    const { data } = await http.post<TarefaResponse>(BASE, body);
    return uma(data);
  },

  async atualizar(id: string, t: Omit<Tarefa, 'id' | 'criadoEm'>): Promise<Tarefa> {
    const body: AtualizarTarefaRequest = paraPayloadAtualizar(t as Tarefa);
    const { data } = await http.put<TarefaResponse>(
      `${BASE}/${encodeURIComponent(id)}`,
      body,
    );
    return uma(data);
  },

  async mudarStatus(id: string, status: StatusColuna): Promise<void> {
    const body: MudarStatusRequest = { status };
    await http.patch(`${BASE}/${encodeURIComponent(id)}/status`, body);
  },

  async registrarPomodoro(id: string): Promise<void> {
    await http.post(`${BASE}/${encodeURIComponent(id)}/pomodoros`);
  },

  async excluir(id: string): Promise<void> {
    await http.delete(`${BASE}/${encodeURIComponent(id)}`);
  },

  async zerar(): Promise<void> {
    await http.delete(BASE);
  },

  async importar(itens: Array<Omit<Tarefa, 'id' | 'criadoEm'>>): Promise<Tarefa[]> {
    const body = itens.map((t) => paraPayloadCriar(t as Tarefa));
    const { data } = await http.post<TarefaResponse[]>(`${BASE}/importar`, body);
    return sanitizarLista(data);
  },
};