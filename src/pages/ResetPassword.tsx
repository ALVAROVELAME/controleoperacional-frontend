import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import RecoveryLayout from '../components/RecoveryLayout';
import { authService } from '../services/auth.service';
import { mensagemDeErro } from '../services/http';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [token] = useState(() => params.get('token') ?? '');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  async function enviar(event: FormEvent) {
    event.preventDefault(); setErro('');
    if (senha !== confirmacao) { setErro('As senhas não coincidem.'); return; }
    setCarregando(true);
    try { await authService.redefinirSenha(token, senha); setSucesso(true); setSenha(''); setConfirmacao(''); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível redefinir a senha.')); }
    finally { setCarregando(false); }
  }
  return <RecoveryLayout>
    {sucesso ? <div role="status"><h1>Senha redefinida</h1><p>Sua senha foi alterada. Agora você já pode entrar com a nova senha.</p><Link className="recovery-back" to="/login">Ir para o login →</Link></div> : !token ? <><h1>Link inválido</h1><p>Solicite um novo link para redefinir sua senha.</p><Link className="recovery-back" to="/forgot-password">Solicitar novo link →</Link></> : <>
      <h1>Crie uma nova senha</h1><p>Escolha uma senha com pelo menos 6 caracteres.</p>
      {erro && <p className="recovery-error" role="alert">{erro}</p>}
      <form onSubmit={enviar}>
        <label>Nova senha<input type="password" value={senha} onChange={e => setSenha(e.target.value)} autoComplete="new-password" minLength={6} maxLength={100} required /></label>
        <label>Confirmar nova senha<input type="password" value={confirmacao} onChange={e => setConfirmacao(e.target.value)} autoComplete="new-password" minLength={6} maxLength={100} required /></label>
        <button disabled={carregando}>{carregando ? 'Salvando…' : 'Redefinir senha'}</button>
      </form>
      <Link className="recovery-back" to="/forgot-password">Solicitar outro link</Link>
    </>}
  </RecoveryLayout>;
}
