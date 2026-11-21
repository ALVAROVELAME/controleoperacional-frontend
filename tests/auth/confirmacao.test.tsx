import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ConfirmarEmail from '../../src/pages/auth/ConfirmarEmail';
import { http } from '../../src/services/http';
let api: MockAdapter;
beforeEach(() => { api = new MockAdapter(http); });
afterEach(() => api.restore());
const abrir = (url: string) => render(<MemoryRouter initialEntries={[url]}><Routes><Route path="/confirmar" element={<ConfirmarEmail />} /><Route path="/login" element={<h1>Login</h1>} /></Routes></MemoryRouter>);
describe('confirmação de e-mail', () => {
  it('informa quando o link não contém token', async () => {
    abrir('/confirmar');
    expect(await screen.findByRole('heading', { name: 'Link incompleto' })).toBeInTheDocument();
    expect(api.history.get).toHaveLength(0);
  });
  it('confirma o token e oferece acesso ao login', async () => {
    api.onGet('/api/auth/confirmar').reply(200, { mensagem: 'OK' });
    const user = userEvent.setup();
    abrir('/confirmar?token=abc');
    expect(await screen.findByRole('heading', { name: 'E-mail confirmado!' })).toBeInTheDocument();
    expect(api.history.get[0].params.token).toBe('abc');
    await user.click(screen.getByRole('link', { name: 'Ir para o login' }));
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });
  it('apresenta erro e permite tentar novamente', async () => {
    api.onGet('/api/auth/confirmar').replyOnce(410).onGet('/api/auth/confirmar').reply(200, { mensagem: 'OK' });
    const user = userEvent.setup();
    abrir('/confirmar?token=abc');
    expect(await screen.findByRole('alert')).toHaveTextContent('Este link expirou');
    await user.click(screen.getByRole('button', { name: /Tentar novamente/ }));
    expect(await screen.findByRole('heading', { name: 'E-mail confirmado!' })).toBeInTheDocument();
  });
});
