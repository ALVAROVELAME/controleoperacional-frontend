import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Landing from '../src/pages/Landing';

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
});

describe('página inicial', () => {
  it('abre e fecha o menu pelo teclado', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Landing /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  });
  it('alterna o estado de pausa da demonstração', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Landing /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Pausar animações' }));
    expect(screen.getByRole('button', { name: 'Retomar animações' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Retomar animações' }));
    expect(screen.getByRole('button', { name: 'Pausar animações' })).toHaveAttribute('aria-pressed', 'false');
  });
});
