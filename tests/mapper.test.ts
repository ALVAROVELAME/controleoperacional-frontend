import { describe, expect, it } from 'vitest';
import { sanitizarTarefa, sanitizarLista, paraCriarRequest, paraAtualizarRequest } from '../src/mappers/tarefa.mapper';

describe('conversão de tarefas', () => {
  it('descarta entradas inválidas e normaliza respostas da API', () => {
    expect(sanitizarLista([null, {}, { titulo: '  Planejar  ', id: 12, status: 'Em Progresso', prioridade: 'ALTA', prazo: '2026-01-02T10:00:00Z', pomodoros: 2.9, pomodorosPlanejados: 100 }])).toEqual([
      expect.objectContaining({ id: '12', titulo: 'Planejar', status: 'em_progresso', prioridade: 'alta', prazo: '2026-01-02', pomodoros: 2, pomodorosPlanejados: 20 }),
    ]);
    expect(sanitizarLista({})).toEqual([]);
  });
  it('aplica padrões a enums e dados inválidos', () => {
    expect(sanitizarTarefa({ titulo: 'Teste', status: 99, prioridade: 99, prazo: 'inválido', pomodoros: -1 })).toEqual(expect.objectContaining({ status: 'a_fazer', prioridade: 'media', prazo: undefined, pomodoros: undefined }));
    expect(sanitizarTarefa({ titulo: '   ' })).toBeNull();
    expect(sanitizarTarefa({ titulo: 'Teste', status: 2, prioridade: 0 })).toEqual(expect.objectContaining({ status: 'revisao', prioridade: 'baixa' }));
  });
  it('gera contratos distintos para criação e edição', () => {
    const tarefa = { titulo: 'Teste', prioridade: 'alta' as const, status: 'a_fazer' as const, pomodoros: 3 };
    expect(paraCriarRequest(tarefa)).toEqual({ titulo: 'Teste', descricao: null, prioridade: 'alta', status: 'a_fazer', prazo: null, pomodorosPlanejados: null, pomodoros: 3 });
    expect(paraAtualizarRequest(tarefa)).not.toHaveProperty('pomodoros');
  });
});
