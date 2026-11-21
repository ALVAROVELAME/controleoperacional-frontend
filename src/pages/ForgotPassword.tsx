import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import RecoveryLayout from '../components/RecoveryLayout';
import { authService } from '../services/auth.service';
import { mensagemDeErro } from '../services/http';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  async function enviar(event: FormEvent) {
    event.preventDefault(); setErro(''); setCarregando(true);
    try { await authService.recuperarSenha(email.trim()); setEnviado(true); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível enviar a solicitação.')); }
    finally { setCarregando(false); }
  }
  return <RecoveryLayout>
    {enviado ? <div role="status"><h1>Confira seu e-mail</h1><p>Se existir uma conta com esse e-mail, enviaremos instruções para redefinir sua senha. Confira também a caixa de spam.</p></div> : <>
      <h1>Recuperar senha</h1><p>Informe o e-mail da sua conta para receber um link de recuperação.</p>
      {erro && <p className="recovery-error" role="alert">{erro}</p>}
      <form onSubmit={enviar}><label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="seu@email.com" maxLength={200} required /></label>
        <button disabled={carregando}>{carregando ? 'Enviando…' : 'Enviar link de recuperação'}</button></form>
    </>}
    <Link className="recovery-back" to="/login">← Voltar ao login</Link>
  </RecoveryLayout>;
}
