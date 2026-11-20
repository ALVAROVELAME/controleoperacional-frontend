import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { http, normalizarErro } from '../src/services/http';
import { tarefasService } from '../src/services/tarefas.service';

let api: MockAdapter;
beforeEach(() => { api = new MockAdapter(http); });
afterEach(() => api.restore());
describe('API e sessão', () => {
  it('envia o token e codifica o identificador da tarefa', async () => {
    localStorage.setItem('token', 'abc');
    api.onPatch('/api/tarefas/a%2Fb/status').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer abc');
      expect(JSON.parse(config.data)).toEqual({ status: 'concluido' });
      return [204];
    });
    await tarefasService.mudarStatus('a/b', 'concluido');
  });
  it('encerra uma sessão inválida sem navegar diretamente', async () => {
    localStorage.setItem('token', 'expirado');
    localStorage.setItem('usuario', '{}');
    const listener = vi.fn();
    window.addEventListener('auth:session-expired', listener);
    api.onGet('/privado').reply(401);
    await expect(http.get('/privado')).rejects.toBeDefined();
    expect(localStorage.getItem('token')).toBeNull();
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('auth:session-expired', listener);
  });
  it('não invalida uma sessão nova por resposta antiga', async () => {
    localStorage.setItem('token', 'antigo');
    api.onGet('/privado').reply(() => { localStorage.setItem('token', 'novo'); return [401]; });
    await expect(http.get('/privado')).rejects.toBeDefined();
    expect(localStorage.getItem('token')).toBe('novo');
  });
  it('não encerra sessão em erro de login', async () => {
    localStorage.setItem('token', 'atual');
    api.onPost('/api/auth/login').reply(401);
    await expect(http.post('/api/auth/login')).rejects.toBeDefined();
    expect(localStorage.getItem('token')).toBe('atual');
  });
  it('normaliza erros de rede e mensagens de validação', async () => {
    api.onGet('/rede').networkError();
    try { await http.get('/rede'); } catch (error) { expect(normalizarErro(error).message).toBe('Sem conexão com o servidor.'); }
    api.onGet('/invalido').reply(400, { errors: { titulo: ['Título obrigatório'] } });
    try { await http.get('/invalido'); } catch (error) { expect(normalizarErro(error).message).toBe('Título obrigatório'); }
  });
});
