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
});
