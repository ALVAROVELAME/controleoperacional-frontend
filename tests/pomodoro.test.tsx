import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePomodoro } from '../src/hooks/usePomodoro';

afterEach(() => vi.useRealTimers());
describe('temporizador Pomodoro', () => {
  it('inicia, pausa e reinicia o tempo de foco', () => {
    vi.useFakeTimers();
    const onEvento = vi.fn();
    const { result } = renderHook(() => usePomodoro({ onEvento }));
    expect(result.current.restanteMs).toBe(25 * 60_000);
    act(() => result.current.iniciar());
    expect(result.current.rodando).toBe(true);
    act(() => vi.advanceTimersByTime(5000));
    act(() => result.current.pausar());
    expect(result.current.rodando).toBe(false);
    expect(result.current.restanteMs).toBeLessThan(25 * 60_000);
    act(() => result.current.reiniciar());
    expect(result.current.restanteMs).toBe(25 * 60_000);
    expect(onEvento).toHaveBeenCalled();
  });
  it('conclui o foco, registra o contexto da tarefa e inicia a pausa curta', () => {
    vi.useFakeTimers();
    const onEvento = vi.fn();
    const contexto = { tarefaId: 't1', tarefaTitulo: 'Planejar' };
    const { result } = renderHook(() => usePomodoro({ onEvento }));
    act(() => result.current.atualizarConfig({ foco: 1, som: false }));
    act(() => result.current.iniciar(contexto));
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current.estado.modo).toBe('pausa_curta');
    expect(result.current.rodando).toBe(false);
    expect(result.current.dia.focos).toBe(1);
    expect(result.current.dia.minutos).toBe(1);
    expect(onEvento).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'foco_completado', minutosReais: 1 }), contexto);
  });
  it('restaura a configuração e o tempo pausado após remontar', () => {
    vi.useFakeTimers();
    const primeiro = renderHook(() => usePomodoro());
    act(() => primeiro.result.current.atualizarConfig({ foco: 10, som: false }));
    act(() => primeiro.result.current.iniciar());
    act(() => vi.advanceTimersByTime(10_000));
    act(() => primeiro.result.current.pausar());
    primeiro.unmount();
    const segundo = renderHook(() => usePomodoro());
    expect(segundo.result.current.config.foco).toBe(10);
    expect(segundo.result.current.restanteMs).toBe(590_000);
    expect(segundo.result.current.rodando).toBe(false);
  });
  it('troca de modo e retoma um foco pausado com o evento correto', () => {
    vi.useFakeTimers();
    const onEvento = vi.fn();
    const { result } = renderHook(() => usePomodoro({ onEvento }));
    act(() => result.current.trocarModo('pausa_longa'));
    expect(result.current.restanteMs).toBe(15 * 60_000);
    act(() => result.current.focarAgora({ tarefaId: 't1' }));
    act(() => vi.advanceTimersByTime(5000));
    act(() => result.current.pausar());
    act(() => result.current.focarAgora());
    expect(result.current.rodando).toBe(true);
    expect(onEvento).toHaveBeenLastCalledWith(expect.objectContaining({ tipo: 'foco_retomado' }), { tarefaId: 't1' });
  });
});
