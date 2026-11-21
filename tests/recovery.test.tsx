import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ForgotPassword from '../src/pages/ForgotPassword';
import ResetPassword from '../src/pages/ResetPassword';
import { http } from '../src/services/http';
let api: MockAdapter;
beforeEach(() => { api = new MockAdapter(http); });
afterEach(() => api.restore());
describe('recuperação de senha', () => {
  it('solicita o link e exibe resposta genérica', async () => {
    const user = userEvent.setup(); api.onPost('/api/auth/recuperar-senha').reply(200, {});
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    await user.type(screen.getByLabelText('E-mail'), 'ana@teste.com');
    await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Se existir uma conta');
    expect(JSON.parse(api.history.post[0].data)).toEqual({ email: 'ana@teste.com' });
  });
  it('valida confirmação e envia token com nova senha', async () => {
    const user = userEvent.setup(); api.onPost('/api/auth/redefinir-senha').reply(200, {});
    render(<MemoryRouter initialEntries={['/redefinir-senha?token=abc']}><ResetPassword /></MemoryRouter>);
    await user.type(screen.getByLabelText('Nova senha'), 'nova123');
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'outra123');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));
    expect(screen.getByRole('alert')).toHaveTextContent('não coincidem');
    expect(api.history.post).toHaveLength(0);
    await user.clear(screen.getByLabelText('Confirmar nova senha'));
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'nova123');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Senha redefinida');
    expect(JSON.parse(api.history.post[0].data)).toEqual({ token: 'abc', senha: 'nova123' });
  });
  it('orienta quando o link não tem token', () => {
    render(<MemoryRouter><ResetPassword /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Link inválido' })).toBeInTheDocument();
  });
  it('mostra erro de token expirado', async () => {
    const user = userEvent.setup(); api.onPost('/api/auth/redefinir-senha').reply(400, { mensagem: 'Link invalido ou expirado.' });
    render(<MemoryRouter initialEntries={['/?token=expirado']}><ResetPassword /></MemoryRouter>);
    await user.type(screen.getByLabelText('Nova senha'), 'nova123');
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'nova123');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('expirado');
  });
});
