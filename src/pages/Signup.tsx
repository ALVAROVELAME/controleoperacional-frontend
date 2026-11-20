import STYLES from '../styles/signup.css?inline';
import { Icon } from '../components/LandingIcons';
import PUBLIC_STYLES from '../styles/publicstyles.css?inline';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth.service';

// ============================================================
// Regras de validação
// ============================================================
const VALIDACOES = {
  nome: {
    valido: (v: string) => v.trim().length >= 3,
    msg: 'Nome deve ter pelo menos 3 caracteres',
  },
  email: {
    valido: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    msg: 'Informe um e-mail válido',
  },
  senha: {
    valido: (v: string) => v.length >= 6,
    msg: 'Senha deve ter pelo menos 6 caracteres',
  },
};

/* ============================================================
   CSS do componente — Paleta: Blue + Slate
   ============================================================ */


/* ============================================================
   Subcomponente: ícone de olho (SVG)
   ============================================================ */
function EyeIcon({ aberto }: { aberto: boolean }) {
  if (aberto) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* ============================================================
   Componente
   ============================================================ */
export default function Signup() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [tocados, setTocados] = useState<Record<string, boolean>>({});

  // Limpa o erro a cada mudança nos campos (sem depender de `erro` para
  // não disparar re-render desnecessário nem quebrar o exhaustive-deps)
  useEffect(() => {
    setErro(null);
  }, [nome, email, senha, confirmar]);

  // ---------- Força da senha ----------
  const forca = useMemo(() => {
    let score = 0;
    if (senha.length >= 8) score++;
    if (/[A-Z]/.test(senha)) score++;
    if (/[0-9]/.test(senha)) score++;
    if (/[^A-Za-z0-9]/.test(senha)) score++;
    return score;
  }, [senha]);

  const forcaInfo = useMemo(() => {
    const map = [
      { label: 'Muito fraca', cor: '#b91c1c' },
      { label: 'Fraca',       cor: '#c2410c' },
      { label: 'Média',       cor: '#a16207' },
      { label: 'Boa',         cor: '#0ea5e9' },
      { label: 'Forte',       cor: '#2563eb' },
    ];
    return map[forca];
  }, [forca]);

  // ---------- Validação geral do form ----------
  const erros = useMemo(() => {
    const e: Record<string, string> = {};
    if (nome && !VALIDACOES.nome.valido(nome)) e.nome = VALIDACOES.nome.msg;
    if (email && !VALIDACOES.email.valido(email)) e.email = VALIDACOES.email.msg;
    if (senha && !VALIDACOES.senha.valido(senha)) e.senha = VALIDACOES.senha.msg;
    if (confirmar && confirmar !== senha) e.confirmar = 'As senhas não coincidem';
    return e;
  }, [nome, email, senha, confirmar]);

  const formValido = useMemo(
    () =>
      VALIDACOES.nome.valido(nome) &&
      VALIDACOES.email.valido(email) &&
      VALIDACOES.senha.valido(senha) &&
      senha === confirmar &&
      aceitouTermos,
    [nome, email, senha, confirmar, aceitouTermos]
  );

  const mostrarErro = (campo: string) =>
    tocados[campo] && erros[campo] ? erros[campo] : null;

  const marcarTocado = (campo: string) =>
    setTocados((t) => ({ ...t, [campo]: true }));

  // ---------- Submit ----------
  const handleCadastro = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErro(null);

      setTocados({ nome: true, email: true, senha: true, confirmar: true });

      if (!formValido) return;

      setCarregando(true);
      try {
        await authService.cadastrar({ nome, email, senha });
        setSucesso(true);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { mensagem?: string } } })?.response?.data
            ?.mensagem || 'Erro ao cadastrar. Verifique os dados e tente novamente.';
        setErro(msg);
      } finally {
        setCarregando(false);
      }
    },
    [nome, email, senha, formValido]
  );

  const confirmaOk = confirmar.length > 0 && confirmar === senha && senha.length >= 6;

  return (
    <>
      <style>{STYLES}{PUBLIC_STYLES}</style>
      <div className="sg">
        <a href="#sg-main" className="sg-skip">Ir para o formulário</a>

        <div className="sg-wrap">
          {/* ============ PAINEL ESQUERDO — BRANDING ============ */}
          <aside className="sg-brand" aria-label="Sobre o CtOperacional">
            <div className="sg-brand-top">
              <Link to="/" className="sg-brand-logo" aria-label="CtOperacional — início">
                <span className="sg-brand-logo-mark" aria-hidden="true"><img src="/favicon.svg" alt="" /></span>
                <span><b>Ct</b>Operacional</span>
              </Link>

              <span className="sg-brand-badge">
                <span className="sg-brand-badge-dot" aria-hidden="true" />
                Grátis para começar
              </span>

              <h2 className="sg-brand-title">
                Comece a organizar <em>sua operação</em> hoje.
              </h2>
              <p className="sg-brand-sub">
                Crie sua conta em menos de 1 minuto e tenha controle total sobre
                tarefas, quadros e o fluxo de trabalho da sua equipe.
              </p>

              <ul className="sg-brand-list">
                {[
                  '100% grátis, sem cartão de crédito',
                  'Dados salvos automaticamente na nuvem',
                  'Acesso de qualquer dispositivo',
                  'Cancele quando quiser, sem burocracia',
                ].map((item) => (
                  <li key={item} className="sg-brand-item">
                    <span className="sg-brand-check" aria-hidden="true"><Icon name="check" size={15} /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="sg-brand-footer">
              <span>© {new Date().getFullYear()} CtOperacional</span>
              <span className="sg-brand-footer-dot" aria-hidden="true" />
              <span>Feito no Brasil 🇧🇷</span>
            </div>
          </aside>

          {/* ============ PAINEL DIREITO — FORMULÁRIO ============ */}
          <main className="sg-form-side" id="sg-main">
            <div className="sg-card">
              {sucesso ? (
                <div className="sg-success" role="status" aria-live="polite">
                  <div className="sg-success-icon" aria-hidden="true"><Icon name="check" size={36} /></div>
                  <h2 className="sg-success-title">Cadastro realizado!</h2>
                  <p className="sg-success-text">
                    Enviamos um e-mail de confirmação para
                    <br />
                    <strong>{email}</strong>
                  </p>
                  <Link to="/login" className="sg-btn-primary" style={{ width: '100%' }}>
                    Ir para o login <Icon name="arrow" size={18} />
                  </Link>
                  <p className="sg-success-note">
                    Não recebeu? Verifique a caixa de spam ou promoções.
                  </p>
                </div>
              ) : (
                <>
                  <header className="sg-header">
                    <Link to="/" className="sg-back">
                      <span aria-hidden="true">←</span> Voltar
                    </Link>
                    <h1 className="sg-title">Criar conta</h1>
                    <p className="sg-sub">Preencha os dados para começar.</p>
                  </header>

                  {erro && (
                    <div className="sg-alert" role="alert" aria-live="polite" id="sg-erro">
                      <span className="sg-alert-icon" aria-hidden="true">!</span>
                      <span>{erro}</span>
                    </div>
                  )}

                  <form onSubmit={handleCadastro} className="sg-form" noValidate>
                    {/* Nome */}
                    <div className="sg-field">
                      <label htmlFor="nome" className="sg-label">Nome completo</label>
                      <div className="sg-input-wrap">
                        <input
                          id="nome"
                          type="text"
                          placeholder="João da Silva"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          onBlur={() => marcarTocado('nome')}
                          required
                          autoComplete="name"
                          autoFocus
                          className={`sg-input${mostrarErro('nome') ? ' is-error' : ''}`}
                          aria-invalid={!!mostrarErro('nome')}
                          aria-describedby={mostrarErro('nome') ? 'sg-erro-nome' : undefined}
                          disabled={carregando}
                        />
                      </div>
                      {mostrarErro('nome') && (
                        <span className="sg-error-msg" id="sg-erro-nome">
                          {erros.nome}
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="sg-field">
                      <label htmlFor="email" className="sg-label">E-mail</label>
                      <div className="sg-input-wrap">
                        <input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() => marcarTocado('email')}
                          required
                          autoComplete="email"
                          className={`sg-input${mostrarErro('email') ? ' is-error' : ''}`}
                          aria-invalid={!!mostrarErro('email')}
                          aria-describedby={mostrarErro('email') ? 'sg-erro-email' : undefined}
                          disabled={carregando}
                          spellCheck={false}
                        />
                      </div>
                      {mostrarErro('email') && (
                        <span className="sg-error-msg" id="sg-erro-email">
                          {erros.email}
                        </span>
                      )}
                    </div>

                    {/* Senha */}
                    <div className="sg-field">
                      <label htmlFor="senha" className="sg-label">Senha</label>
                      <div className="sg-input-wrap">
                        <input
                          id="senha"
                          type={mostrarSenha ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                          onBlur={() => marcarTocado('senha')}
                          required
                          autoComplete="new-password"
                          className={`sg-input sg-input--with-icon${mostrarErro('senha') ? ' is-error' : ''}`}
                          aria-invalid={!!mostrarErro('senha')}
                          aria-describedby={
                            [
                              senha ? 'sg-strength' : null,
                              mostrarErro('senha') ? 'sg-erro-senha' : null,
                            ]
                              .filter(Boolean)
                              .join(' ') || undefined
                          }
                          disabled={carregando}
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenha((v) => !v)}
                          className="sg-input-icon"
                          aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                          aria-pressed={mostrarSenha}
                          disabled={carregando}
                        >
                          <EyeIcon aberto={mostrarSenha} />
                        </button>
                      </div>

                      {senha && (
                        <>
                          <div
                            className="sg-strength"
                            id="sg-strength"
                            role="progressbar"
                            aria-valuenow={forca}
                            aria-valuemin={0}
                            aria-valuemax={4}
                            aria-label={`Força da senha: ${forcaInfo.label}`}
                          >
                            <div className="sg-strength-bar">
                              <div
                                className="sg-strength-fill"
                                style={{
                                  width: `${(forca / 4) * 100}%`,
                                  background: forcaInfo.cor,
                                }}
                              />
                            </div>
                            <span
                              className="sg-strength-label"
                              style={{ color: forcaInfo.cor }}
                            >
                              {forcaInfo.label}
                            </span>
                          </div>

                          <div className="sg-req-list">
                            <Requisito ok={senha.length >= 6} texto="6+ caracteres" />
                            <Requisito ok={/[A-Z]/.test(senha)} texto="1 maiúscula" />
                            <Requisito ok={/[0-9]/.test(senha)} texto="1 número" />
                            <Requisito ok={/[^A-Za-z0-9]/.test(senha)} texto="1 símbolo" />
                          </div>
                        </>
                      )}

                      {mostrarErro('senha') && (
                        <span className="sg-error-msg" id="sg-erro-senha">
                          {erros.senha}
                        </span>
                      )}
                    </div>

                    {/* Confirmar senha */}
                    <div className="sg-field">
                      <label htmlFor="confirmar" className="sg-label">Confirmar senha</label>
                      <div className="sg-input-wrap">
                        <input
                          id="confirmar"
                          type={mostrarSenha ? 'text' : 'password'}
                          placeholder="Repita a senha"
                          value={confirmar}
                          onChange={(e) => setConfirmar(e.target.value)}
                          onBlur={() => marcarTocado('confirmar')}
                          required
                          autoComplete="new-password"
                          className={`sg-input sg-input--with-icon${mostrarErro('confirmar') ? ' is-error' : ''}`}
                          aria-invalid={!!mostrarErro('confirmar')}
                          aria-describedby={
                            mostrarErro('confirmar') ? 'sg-erro-confirmar' : undefined
                          }
                          disabled={carregando}
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenha((v) => !v)}
                          className="sg-input-icon"
                          aria-label={mostrarSenha ? 'Ocultar senhas' : 'Mostrar senhas'}
                          aria-pressed={mostrarSenha}
                          disabled={carregando}
                        >
                          <EyeIcon aberto={mostrarSenha} />
                        </button>
                      </div>
                      {mostrarErro('confirmar') && (
                        <span className="sg-error-msg" id="sg-erro-confirmar">
                          {erros.confirmar}
                        </span>
                      )}
                      {confirmaOk && (
                        <span className="sg-ok-msg">
                          <span aria-hidden="true"><Icon name="check" size={15} /></span> Senhas conferem
                        </span>
                      )}
                    </div>

                    {/* Termos */}
                    <label className={`sg-termos${aceitouTermos ? ' is-checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={aceitouTermos}
                        onChange={(e) => setAceitouTermos(e.target.checked)}
                        disabled={carregando}
                      />
                      <span className="sg-termos-box" aria-hidden="true">
                        {aceitouTermos ? '✓' : ''}
                      </span>
                      <span className="sg-termos-text">
                        Concordo com os{' '}
                        <Link to="/termos" onClick={(e) => e.stopPropagation()}>
                          Termos de Uso
                        </Link>{' '}
                        e a{' '}
                        <Link to="/privacidade" onClick={(e) => e.stopPropagation()}>
                          Política de Privacidade
                        </Link>
                        .
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="sg-btn-primary"
                      disabled={carregando || !formValido}
                      aria-busy={carregando}
                    >
                      {carregando ? (
                        <>
                          <span className="sg-spinner" aria-hidden="true" />
                          Criando conta…
                        </>
                      ) : (
                        <>
                          Criar conta grátis
                          <Icon name="arrow" size={18} />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="sg-footer-text">
                    Já tem conta?
                    <Link to="/login">Fazer login</Link>
                  </p>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Subcomponente: Requisito da senha
// ============================================================
function Requisito({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span className={`sg-req${ok ? ' is-ok' : ''}`} aria-live="polite">
      <span className="sg-req-dot" aria-hidden="true">{ok ? '✓' : ''}</span>
      {texto}
    </span>
  );
}