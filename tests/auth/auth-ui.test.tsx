import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthProvider } from '../../src/contexts/AuthProvider';
import RotaPublica from '../../src/components/auth/RotaPublica';
import RotaProtegida from '../../src/components/auth/RotaProtegida';
import Login from '../../src/pages/auth/Login';
import Signup from '../../src/pages/auth/Signup';
import { http } from '../../src/services/http';

let api: MockAdapter;
beforeEach(() => { api = new MockAdapter(http); });
afterEach(() => api.restore());
function app(path: string) {
  return render(<AuthProvider><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/" element={<RotaPublica><h1>Institucional</h1></RotaPublica>} />
    <Route path="/dashboard" element={<RotaProtegida><h1>Área protegida</h1></RotaProtegida>} />
    <Route path="/login" element={<RotaPublica><Login /></RotaPublica>} />
    <Route path="/signup" element={<RotaPublica><Signup /></RotaPublica>} />
  </Routes></MemoryRouter></AuthProvider>);
}
describe('acesso e formulários', () => {
  it.each(['/', '/dashboard'])('exibe o estado de carregamento ao validar a sessão em %s', async (path) => {
    localStorage.setItem('token', 'valido');
    api.onGet('/api/auth/me').reply(200, { nome: 'Ana', email: 'ana@teste.com' });
    app(path);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
    expect(screen.queryByRole('heading')).toBeNull();
    expect(await screen.findByRole('heading', { name: 'Área protegida' })).toBeInTheDocument();
  });
  it('abre a página institucional sem sessão e protege o dashboard', async () => {
    app('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Institucional' })).toBeInTheDocument();
  });
  it('retorna à página institucional quando o token expira', async () => {
    localStorage.setItem('token', 'expirado');
    localStorage.setItem('usuario', JSON.stringify({ nome: 'Ana', email: 'ana@teste.com' }));
    api.onGet('/api/auth/me').reply(401);
    app('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Institucional' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
  it('envia credenciais e entra no dashboard', async () => {
    const user = userEvent.setup();
    api.onPost('/api/auth/login').reply(200, { token: 'valido', usuario: { nome: 'Ana', email: 'ana@teste.com' } });
    app('/login');
    await user.type(await screen.findByLabelText('E-mail'), 'ana@teste.com');
    await user.type(screen.getByLabelText('Senha'), '123456');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: 'Área protegida' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('valido');
    expect(JSON.parse(api.history.post[0].data)).toEqual({ email: 'ana@teste.com', senha: '123456' });
  });
  it('mostra erro de credenciais sem sair do login', async () => {
    const user = userEvent.setup();
    api.onPost('/api/auth/login').reply(401, { mensagem: 'Senha incorreta' });
    app('/login');
    await user.type(await screen.findByLabelText('E-mail'), 'ana@teste.com');
    await user.type(screen.getByLabelText('Senha'), 'errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Senha incorreta');
  });
  it('exige aceite e senhas iguais antes de cadastrar', async () => {
    const user = userEvent.setup();
    api.onPost('/api/usuarios').reply(200, { mensagem: 'Criado' });
    app('/signup');
    await user.type(await screen.findByLabelText('Nome completo'), 'Ana Silva');
    await user.type(screen.getByLabelText('E-mail'), 'ana@teste.com');
    await user.type(screen.getByLabelText('Senha', { exact: true }), '123456');
    await user.type(screen.getByLabelText('Confirmar senha'), '123456');
    const submit = screen.getByRole('button', { name: /Criar conta grátis/i });
    expect(submit).toBeDisabled();
    await user.click(screen.getByText(/Concordo com os/));
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(await screen.findByText('Cadastro realizado!')).toBeInTheDocument();
    await waitFor(() => expect(api.history.post).toHaveLength(1));
  });
});
