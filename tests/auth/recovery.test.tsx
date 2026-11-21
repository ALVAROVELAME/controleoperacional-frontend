import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ForgotPassword from '../../src/pages/auth/ForgotPassword';
import ResetPassword from '../../src/pages/auth/ResetPassword';
import { http } from '../../src/services/http';
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
  it('atualiza os indicadores de força e permite mostrar as senhas', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/?token=abc']}><ResetPassword /></MemoryRouter>);
    const senha = screen.getByLabelText('Nova senha');
    await user.type(senha, 'abcdef');
    expect(screen.getByRole('progressbar', { name: 'Força da senha: Muito fraca' })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('6+ caracteres').closest('.sg-req')).toHaveClass('is-ok');
    expect(screen.getByText('1 maiúscula').closest('.sg-req')).not.toHaveClass('is-ok');
    await user.type(senha, 'A1!');
    expect(screen.getByRole('progressbar', { name: 'Força da senha: Forte' })).toHaveAttribute('aria-valuenow', '4');
    for (const requisito of ['1 maiúscula', '1 número', '1 símbolo']) expect(screen.getByText(requisito).closest('.sg-req')).toHaveClass('is-ok');
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'abcdefA1!');
    expect(screen.getByText('Senhas conferem')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(senha).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Confirmar nova senha')).toHaveAttribute('type', 'text');
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
