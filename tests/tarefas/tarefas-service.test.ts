import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { http } from '../../src/services/http';
import { tarefasService } from '../../src/services/tarefas.service';
const input = { titulo: 'Planejar', prioridade: 'media' as const, status: 'a_fazer' as const };
const resposta = { ...input, id: '1', criadoEm: '2026-01-01' };
let api: MockAdapter;
beforeEach(() => { api = new MockAdapter(http); });
afterEach(() => api.restore());
describe('serviço de tarefas', () => {
  it('lista e filtra respostas inválidas', async () => {
    api.onGet('/api/tarefas').reply(200, [resposta, { titulo: '' }]);
    expect(await tarefasService.listar()).toEqual([expect.objectContaining(resposta)]);
  });
  it('cria e atualiza usando os payloads esperados', async () => {
    api.onPost('/api/tarefas').reply(201, resposta);
    api.onPut('/api/tarefas/1').reply(200, resposta);
    await tarefasService.criar(input);
    await tarefasService.atualizar('1', input);
    expect(JSON.parse(api.history.post[0].data)).toEqual(expect.objectContaining({ titulo: 'Planejar', pomodoros: 0, prazo: null }));
    expect(JSON.parse(api.history.put[0].data)).not.toHaveProperty('pomodoros');
  });
  it('rejeita resposta inválida de criação', async () => {
    api.onPost('/api/tarefas').reply(201, {});
    await expect(tarefasService.criar(input)).rejects.toThrow('Resposta inválida da API de tarefas.');
  });
  it('importa, registra pomodoro e exclui tarefas', async () => {
    api.onPost('/api/tarefas/importar').reply(200, [resposta]);
    api.onPost('/api/tarefas/1/pomodoros').reply(204);
    api.onDelete('/api/tarefas/1').reply(204);
    api.onDelete('/api/tarefas').reply(204);
    expect(await tarefasService.importar([input])).toHaveLength(1);
    await tarefasService.registrarPomodoro('1');
    await tarefasService.excluir('1');
    await tarefasService.zerar();
    expect(api.history.delete).toHaveLength(2);
  });
});
