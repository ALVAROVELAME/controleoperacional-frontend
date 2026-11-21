import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import RecoveryLayout from '../../components/auth/RecoveryLayout';
import PasswordStrength from '../../components/auth/PasswordStrength';
import EyeIcon from '../../components/icons/EyeIcon';
import { Icon } from '../../components/icons/LandingIcons';
import { authService } from '../../services/auth.service';
import { mensagemDeErro } from '../../services/http';

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
    {sucesso ? <div role="status"><h1>Senha redefinida</h1><p>Sua senha foi alterada. Agora você já pode entrar com a nova senha.</p><Link className="mt-6 inline-block font-semibold text-blue-600 no-underline" to="/login">Ir para o login →</Link></div> : !token ? <><h1>Link inválido</h1><p>Solicite um novo link para redefinir sua senha.</p><Link className="mt-6 inline-block font-semibold text-blue-600 no-underline" to="/forgot-password">Solicitar novo link →</Link></> : <>
      <h1>Crie uma nova senha</h1><p>Escolha uma senha com pelo menos 6 caracteres.</p>
      {erro && <p className="mb-[18px] rounded-lg border border-red-200 bg-red-50 p-3 !text-red-800" role="alert">{erro}</p>}
      <form onSubmit={enviar}>
        <div className="flex flex-col gap-2 [&_label]:text-[13px]">
          <label htmlFor="nova-senha">Nova senha</label>
          <div className="relative [&_input]:rounded-xl [&_input]:border-[1.5px] [&_input]:py-[13px] [&_input]:pr-[52px] [&_input]:pl-[14px] [&_input]:transition-[border-color,box-shadow,background] [&_input:focus]:border-blue-600 [&_input:focus]:shadow-[0_0_0_4px_rgba(59,130,246,0.15)] [&_input[aria-invalid=true]]:border-red-600">
            <input id="nova-senha" type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} autoComplete="new-password" placeholder="Mínimo 6 caracteres" minLength={6} maxLength={100} aria-describedby={senha ? 'recovery-strength' : undefined} disabled={carregando} required />
            <button type="button" className="absolute top-1/2 right-1.5 inline-grid size-[38px] -translate-y-1/2 cursor-pointer place-items-center rounded-[10px] border-0 bg-transparent p-0 text-slate-500 transition-[background,color,transform] hover:bg-blue-50 hover:text-blue-600 active:scale-94 disabled:cursor-wait disabled:opacity-65 [&_svg]:size-5" onClick={() => setMostrarSenha(v => !v)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={mostrarSenha} disabled={carregando}><EyeIcon aberto={mostrarSenha} /></button>
          </div>
          {senha && <PasswordStrength senha={senha} id="recovery-strength" />}
        </div>
        <div className="flex flex-col gap-2 [&_label]:text-[13px]">
          <label htmlFor="confirmar-nova-senha">Confirmar nova senha</label>
          <div className="relative [&_input]:rounded-xl [&_input]:border-[1.5px] [&_input]:py-[13px] [&_input]:pr-[52px] [&_input]:pl-[14px] [&_input]:transition-[border-color,box-shadow,background] [&_input:focus]:border-blue-600 [&_input:focus]:shadow-[0_0_0_4px_rgba(59,130,246,0.15)] [&_input[aria-invalid=true]]:border-red-600">
            <input id="confirmar-nova-senha" type={mostrarSenha ? 'text' : 'password'} value={confirmacao} onChange={e => setConfirmacao(e.target.value)} onBlur={() => setTocouConfirmacao(true)} autoComplete="new-password" placeholder="Repita a senha" minLength={6} maxLength={100} aria-invalid={tocouConfirmacao && !!confirmacao && senha !== confirmacao} aria-describedby={tocouConfirmacao && confirmacao && senha !== confirmacao ? 'recovery-confirm-error' : undefined} disabled={carregando} required />
            <button type="button" className="absolute top-1/2 right-1.5 inline-grid size-[38px] -translate-y-1/2 cursor-pointer place-items-center rounded-[10px] border-0 bg-transparent p-0 text-slate-500 transition-[background,color,transform] hover:bg-blue-50 hover:text-blue-600 active:scale-94 disabled:cursor-wait disabled:opacity-65 [&_svg]:size-5" onClick={() => setMostrarSenha(v => !v)} aria-label={mostrarSenha ? 'Ocultar senhas' : 'Mostrar senhas'} aria-pressed={mostrarSenha} disabled={carregando}><EyeIcon aberto={mostrarSenha} /></button>
          </div>
          {tocouConfirmacao && confirmacao && senha !== confirmacao && <span id="recovery-confirm-error" className="flex items-center gap-1.5 text-[12.5px] font-medium text-red-800 before:size-1.5 before:rounded-full before:bg-red-600 before:content-['']">As senhas não coincidem</span>}
          {confirmacao && senha === confirmacao && senha.length >= 6 && <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-600"><Icon name="check" size={15} /> Senhas conferem</span>}
        </div>
        <button className="cursor-pointer rounded-[9px] border-0 bg-blue-600 p-[14px] font-bold text-white disabled:cursor-wait disabled:opacity-65" disabled={carregando}>{carregando ? 'Salvando…' : 'Redefinir senha'}</button>
      </form>
      <Link className="mt-6 inline-block font-semibold text-blue-600 no-underline" to="/forgot-password">Solicitar outro link</Link>
    </>}
  </RecoveryLayout>;
}
