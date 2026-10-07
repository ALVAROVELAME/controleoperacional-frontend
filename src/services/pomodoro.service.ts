// src/services/pomodoro.service.ts
import { api } from './api';
import type { StatusColuna } from '../types/tarefa';

/** Uma sessão de foco concluída. */
export type SessaoPomodoro = {
  tarefaId: string | null; // null quando o foco foi feito sem tarefa selecionada
  tarefaTitulo: string | null;
  statusTarefa: StatusColuna | null;
  minutos: number;
  concluidoEm: string; // ISO (DateTimeOffset no C#)
};

export const pomodoroApi = {
  /** POST /api/pomodoros/sessoes — "fire and forget": falha aqui nunca deve atrapalhar o foco. */
  registrarSessao(sessao: SessaoPomodoro) {
    api.post('/api/pomodoros/sessoes', sessao).catch((err) => {
      console.warn('[pomodoro] sessão não enviada para a API', err);
    });
  },
};