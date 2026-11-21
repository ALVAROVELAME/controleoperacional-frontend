import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import RecoveryLayout from '../components/RecoveryLayout';
import PasswordStrength from '../components/PasswordStrength';
import EyeIcon from '../components/EyeIcon';
import { Icon } from '../components/LandingIcons';
import { authService } from '../services/auth.service';
import { mensagemDeErro } from '../services/http';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [token] = useState(() => params.get('token') ?? '');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [tocouConfirmacao, setTocouConfirmacao] = useState(false);
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  async function enviar(event: FormEvent) {
    event.preventDefault(); setErro('');
    if (!senha.trim()) { setErro('A senha não pode ficar em branco.'); return; }
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
        <div className="recovery-field">
          <label htmlFor="nova-senha">Nova senha</label>
          <div className="recovery-input-wrap">
            <input id="nova-senha" type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} autoComplete="new-password" placeholder="Mínimo 6 caracteres" minLength={6} maxLength={100} aria-describedby={senha ? 'recovery-strength' : undefined} disabled={carregando} required />
            <button type="button" className="recovery-eye" onClick={() => setMostrarSenha(v => !v)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={mostrarSenha} disabled={carregando}><EyeIcon aberto={mostrarSenha} /></button>
          </div>
          {senha && <PasswordStrength senha={senha} id="recovery-strength" />}
        </div>
        <div className="recovery-field">
          <label htmlFor="confirmar-nova-senha">Confirmar nova senha</label>
          <div className="recovery-input-wrap">
            <input id="confirmar-nova-senha" type={mostrarSenha ? 'text' : 'password'} value={confirmacao} onChange={e => setConfirmacao(e.target.value)} onBlur={() => setTocouConfirmacao(true)} autoComplete="new-password" placeholder="Repita a senha" minLength={6} maxLength={100} aria-invalid={tocouConfirmacao && !!confirmacao && senha !== confirmacao} aria-describedby={tocouConfirmacao && confirmacao && senha !== confirmacao ? 'recovery-confirm-error' : undefined} disabled={carregando} required />
            <button type="button" className="recovery-eye" onClick={() => setMostrarSenha(v => !v)} aria-label={mostrarSenha ? 'Ocultar senhas' : 'Mostrar senhas'} aria-pressed={mostrarSenha} disabled={carregando}><EyeIcon aberto={mostrarSenha} /></button>
          </div>
          {tocouConfirmacao && confirmacao && senha !== confirmacao && <span id="recovery-confirm-error" className="recovery-field-error">As senhas não coincidem</span>}
          {confirmacao && senha === confirmacao && senha.length >= 6 && <span className="recovery-field-ok"><Icon name="check" size={15} /> Senhas conferem</span>}
        </div>
        <button disabled={carregando}>{carregando ? 'Salvando…' : 'Redefinir senha'}</button>
      </form>
      <Link className="recovery-back" to="/forgot-password">Solicitar outro link</Link>
    </>}
  </RecoveryLayout>;
}
