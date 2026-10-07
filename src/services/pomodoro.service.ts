// src/services/pomodoro.service.ts
import { http } from './http';
import type { EventoPomodoroRequest, ModoPomodoro } from '../types/api';

export type { ModoPomodoro };

/** Payload emitido pelo hook local — o Dashboard enriquece com dados da tarefa. */
export type EventoPomodoroLocal = Omit<
  EventoPomodoroRequest,
  'tarefaId' | 'tarefaTitulo' | 'statusTarefa'
>;

export const pomodoroApi = {
  /** fire-and-forget: nunca bloqueia o timer */
  registrarEvento(evento: EventoPomodoroRequest): void {
    http.post('/api/pomodoros/eventos', evento).catch((err) => {
      console.warn('[pomodoro] evento não enviado', err);
    });
  },
};