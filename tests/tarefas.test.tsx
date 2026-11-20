import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ToastProvider } from '../src/contexts/ToastProvider';
import { TarefasProvider } from '../src/contexts/TarefasProvider';
import { useTarefas } from '../src/contexts/TarefasContext';
import { tarefasService } from '../src/services/tarefas.service';

vi.mock('../src/contexts/AuthContext', () => ({ useAuth: () => ({ usuario: { email: 'ana@teste.com' } }) }));
vi.mock('../src/services/tarefas.service', () => ({ tarefasService: { listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn(), mudarStatus: vi.fn(), registrarPomodoro: vi.fn(), importar: vi.fn(), zerar: vi.fn() } }));
const tarefa = { id: '1', titulo: 'Planejar', prioridade: 'media' as const, status: 'a_fazer' as const, criadoEm: '2026-01-01' };
const wrapper = ({ children }: { children: ReactNode }) => <ToastProvider><TarefasProvider>{children}</TarefasProvider></ToastProvider>;
beforeEach(() => { vi.clearAllMocks(); vi.mocked(tarefasService.listar).mockResolvedValue([tarefa]); });
describe('tarefas e sincronização', () => {
  it('carrega tarefas e salva alterações confirmadas', async () => {
    vi.mocked(tarefasService.criar).mockResolvedValue({ ...tarefa, id: '2', titulo: 'Nova' });
    const { result } = renderHook(() => useTarefas(), { wrapper });
    await waitFor(() => expect(result.current.estado).toBe('pronto'));
    await act(async () => { await result.current.salvar({ titulo: 'Nova', prioridade: 'media', status: 'a_fazer' }); });
    expect(result.current.tarefas.map(t => t.titulo)).toEqual(['Planejar', 'Nova']);
  });
  it('restaura o status quando a movimentação falha', async () => {
    vi.mocked(tarefasService.mudarStatus).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useTarefas(), { wrapper });
    await waitFor(() => expect(result.current.estado).toBe('pronto'));
    await act(async () => { expect(await result.current.mover('1', 'concluido')).toBe(false); });
    expect(result.current.tarefas[0].status).toBe('a_fazer');
  });
  it('restaura a tarefa quando a exclusão falha', async () => {
    vi.mocked(tarefasService.excluir).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useTarefas(), { wrapper });
    await waitFor(() => expect(result.current.estado).toBe('pronto'));
    await act(async () => { expect(await result.current.excluir('1')).toBeNull(); });
    expect(result.current.tarefas).toEqual([tarefa]);
  });
  it('usa cache e informa estado offline quando a carga falha', async () => {
    localStorage.setItem('ctoperacional:cache:ana@teste.com', JSON.stringify([tarefa]));
    vi.mocked(tarefasService.listar).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useTarefas(), { wrapper });
    await waitFor(() => expect(result.current.estado).toBe('offline'));
    expect(result.current.tarefas[0].titulo).toBe('Planejar');
  });
});
