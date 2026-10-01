import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface LoginResposta {
  sucesso: boolean;
  mensagem: string;
  token: string;
  usuario?: {
    id: number;
    nome: string;
    email: string;
    ativo: boolean;
  };
}

/* ============================================================
   CSS do componente
   ============================================================ */
const STYLES = `
.lg {
  --bg: #ffffff;
  --bg-soft: #f6faf7;
  --ink: #0b1a12;
  --ink-soft: #3d5648;
  --muted: #4f6a5b;
  --line: #e6efe9;
  --line-strong: #c9d9cd;
  --brand: #166534;
  --brand-2: #22c55e;
  --brand-3: #0f4a24;
  --danger-bg: #fef2f2;
  --danger-ink: #991b1b;
  --danger-line: #fecaca;

  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: var(--ink);
  background: var(--bg-soft);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.lg *, .lg *::before, .lg *::after { box-sizing: border-box; }
.lg h1, .lg h2, .lg h3 { margin: 0; letter-spacing: -.02em; }
.lg p { margin: 0; }
.lg a { color: inherit; text-decoration: none; }
.lg button { font-family: inherit; }

/* ---------- Skip link ---------- */
.lg-skip {
  position: absolute; top: -100px; left: 12px; z-index: 9999;
  padding: 12px 18px; background: var(--brand); color: #fff !important;
  font-weight: 600; font-size: 14px;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 10px 24px -10px rgba(0,0,0,.35);
  transition: top .18s ease;
}
.lg-skip:focus { top: 0; outline: 3px solid #fff; outline-offset: 2px; }

/* ---------- Foco visível ---------- */
.lg a:focus-visible,
.lg button:focus-visible,
.lg input:focus-visible {
  outline: 3px solid var(--brand-2);
  outline-offset: 2px;
  border-radius: 8px;
}
.lg-btn-primary:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
  box-shadow: 0 0 0 6px rgba(22,101,52,.55);
}

/* ---------- Layout base ---------- */
.lg-wrap {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  min-height: 100vh;
  min-height: 100dvh;
}

/* ---------- Painel esquerdo (marca) ---------- */
.lg-brand {
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, var(--brand-3) 0%, var(--brand) 55%, #1a7a3e 100%);
  color: #fff;
  padding: 48px 56px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 40px;
}
.lg-brand::before {
  content: "";
  position: absolute; inset: 0;
  background:
    radial-gradient(700px 400px at 90% 10%, rgba(34,197,94,.28), transparent 60%),
    radial-gradient(500px 300px at 10% 90%, rgba(255,255,255,.08), transparent 60%);
  pointer-events: none;
}
.lg-brand > * { position: relative; }

.lg-brand-top { display: flex; flex-direction: column; }
.lg-brand-logo {
  display: inline-flex; align-items: center; gap: 12px;
  color: #fff; font-weight: 700; font-size: 20px; letter-spacing: -.02em;
  width: fit-content;
  margin-bottom: 48px;
}
.lg-brand-logo-mark {
  width: 44px; height: 44px; border-radius: 12px;
  display: grid; place-items: center; font-size: 22px;
  background: rgba(255,255,255,.12);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.18);
  backdrop-filter: blur(6px);
}
.lg-brand-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 14px; border-radius: 999px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.18);
  font-size: 12px; font-weight: 600;
  color: #ecfdf5;
  margin-bottom: 20px;
  width: fit-content;
  backdrop-filter: blur(6px);
}
.lg-brand-badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 3px rgba(74,222,128,.28);
}
.lg-brand-title {
  font-size: clamp(28px, 3.4vw, 40px);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -.03em;
  color: #ffffff;
  margin-bottom: 18px;
  max-width: 480px;
}
.lg-brand-title em {
  font-style: normal;
  background: linear-gradient(120deg, #bbf7d0, #4ade80);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.lg-brand-sub {
  font-size: 16px;
  line-height: 1.6;
  color: #d1fae5;
  max-width: 440px;
  margin-bottom: 32px;
}
.lg-brand-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 14px;
}
.lg-brand-item {
  display: flex; align-items: center; gap: 12px;
  font-size: 14.5px; color: #ecfdf5; font-weight: 500;
}
.lg-brand-check {
  width: 22px; height: 22px; border-radius: 50%;
  display: inline-grid; place-items: center;
  background: rgba(74,222,128,.18);
  border: 1px solid rgba(74,222,128,.35);
  color: #bbf7d0;
  font-size: 11px; font-weight: 800;
  flex-shrink: 0;
}
.lg-brand-footer {
  font-size: 12.5px; color: #a7f3d0;
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.lg-brand-footer-dot { width: 4px; height: 4px; border-radius: 50%; background: #4ade80; }

/* ---------- Painel direito (formulário) ---------- */
.lg-form-side {
  display: flex; align-items: center; justify-content: center;
  padding: 48px 32px;
  background:
    radial-gradient(600px 400px at 100% 0%, rgba(34,197,94,.06), transparent 60%),
    var(--bg-soft);
}
.lg-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow:
    0 1px 2px rgba(11,26,18,.04),
    0 20px 50px -25px rgba(11,26,18,.22);
}
.lg-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -.025em;
  color: var(--ink);
  margin-bottom: 6px;
}
.lg-sub {
  font-size: 14.5px;
  color: var(--muted);
  margin-bottom: 28px;
}

/* ---------- Alerta de erro ---------- */
.lg-alert {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px;
  background: var(--danger-bg);
  border: 1px solid var(--danger-line);
  border-radius: 12px;
  color: var(--danger-ink);
  font-size: 13.5px;
  line-height: 1.5;
  margin-bottom: 22px;
  animation: lgShake .35s ease;
}
.lg-alert-icon {
  flex-shrink: 0;
  width: 20px; height: 20px; border-radius: 50%;
  display: inline-grid; place-items: center;
  background: #fee2e2; color: var(--danger-ink);
  font-size: 12px; font-weight: 800;
}
@keyframes lgShake {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
@media (prefers-reduced-motion: reduce) {
  .lg-alert { animation: none; }
  .lg-spinner { animation-duration: 1.4s !important; }
}

/* ---------- Campos ---------- */
.lg-form { display: flex; flex-direction: column; gap: 18px; }
.lg-field { display: flex; flex-direction: column; gap: 8px; }
.lg-label-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.lg-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}
.lg-forgot {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--brand);
  transition: color .15s;
}
.lg-forgot:hover { color: var(--brand-3); text-decoration: underline; text-underline-offset: 3px; }

.lg-input-wrap { position: relative; }
.lg-input {
  width: 100%;
  padding: 13px 52px 13px 14px; /* espaço à direita para o ícone do olho */
  font-size: 16px; /* evita zoom automático no iOS */
  font-family: inherit;
  color: var(--ink);
  background: #fff;
  border: 1.5px solid var(--line-strong);
  border-radius: 12px;
  transition: border-color .15s, box-shadow .15s, background .15s;
}

/* Esconde o botão nativo de revelar senha (Edge/IE) — evita duplicação */
.lg-input::-ms-reveal,
.lg-input::-ms-clear {
  display: none;
}
/* Esconde o botão nativo de limpar do WebKit */
.lg-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.lg-input::placeholder { color: #9bafa3; }
.lg-input:hover { border-color: #a9c1b0; }
.lg-input:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 4px rgba(34,197,94,.15);
}
.lg-input.has-error { border-color: #dc2626; }
.lg-input.has-error:focus { box-shadow: 0 0 0 4px rgba(220,38,38,.15); }
.lg-input[aria-busy="true"] { opacity: .8; }

/* ---------- Botão de revelar senha (SVG customizado) ---------- */
.lg-input-icon {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  display: inline-grid;
  place-items: center;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  color: var(--muted);
  transition: background .15s, color .15s, transform .1s;
}
.lg-input-icon:hover {
  background: var(--bg-soft);
  color: var(--brand);
}
.lg-input-icon:active {
  transform: translateY(-50%) scale(.94);
}
.lg-input-icon svg {
  width: 20px;
  height: 20px;
  display: block;
  pointer-events: none;
}

/* ---------- Botão primário ---------- */
.lg-btn-primary {
  margin-top: 6px;
  padding: 14px 20px;
  background: var(--brand);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -.01em;
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  box-shadow: 0 12px 26px -12px rgba(22,101,52,.6);
  transition: transform .15s ease, box-shadow .2s ease, background .15s ease;
}
.lg-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--brand-3);
  box-shadow: 0 16px 32px -14px rgba(22,101,52,.7);
}
.lg-btn-primary:active:not(:disabled) { transform: translateY(0); }
.lg-btn-primary:disabled {
  opacity: .75;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
.lg-spinner {
  width: 16px; height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  animation: lgSpin .7s linear infinite;
}
@keyframes lgSpin { to { transform: rotate(360deg); } }

/* ---------- Rodapé ---------- */
.lg-divider {
  display: flex; align-items: center; gap: 12px;
  margin: 26px 0 20px;
  color: var(--muted); font-size: 12px;
}
.lg-divider::before,
.lg-divider::after {
  content: ""; height: 1px; flex: 1;
  background: var(--line);
}

.lg-footer-text {
  text-align: center;
  font-size: 14px;
  color: var(--muted);
}
.lg-footer-text a {
  color: var(--brand);
  font-weight: 700;
  margin-left: 4px;
}
.lg-footer-text a:hover { text-decoration: underline; text-underline-offset: 3px; }

.lg-legal {
  margin-top: 26px;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
}

/* ---------- Responsivo ---------- */
@media (max-width: 960px) {
  .lg-wrap { grid-template-columns: 1fr; }
  .lg-brand {
    padding: 28px 24px;
    gap: 24px;
    justify-content: flex-start;
  }
  .lg-brand-logo { margin-bottom: 20px; font-size: 18px; }
  .lg-brand-logo-mark { width: 38px; height: 38px; font-size: 19px; }
  .lg-brand-title { font-size: 26px; margin-bottom: 10px; }
  .lg-brand-sub { font-size: 15px; margin-bottom: 16px; }
  .lg-brand-list { gap: 10px; }
  .lg-brand-item { font-size: 14px; }
  .lg-brand-footer { display: none; }
  .lg-form-side { padding: 32px 20px 48px; }
}
@media (max-width: 600px) {
  .lg-brand { padding: 24px 20px; }
  .lg-brand-badge { font-size: 11px; padding: 5px 11px; margin-bottom: 14px; }
  .lg-brand-title { font-size: 22px; }
  .lg-brand-sub { font-size: 14px; }
  .lg-brand-list { display: none; } /* deixa a marca enxuta no mobile */
  .lg-card {
    padding: 28px 22px;
    border-radius: 16px;
    box-shadow: 0 10px 30px -18px rgba(11,26,18,.22);
  }
  .lg-title { font-size: 22px; }
  .lg-sub { font-size: 14px; margin-bottom: 22px; }
}
`;

/* ============================================================
   Componente
   ============================================================ */
export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Limpa erro quando o usuário digita
  useEffect(() => {
    if (erro) setErro(null);
  }, [email, senha]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const { data } = await api.post<LoginResposta>('/api/auth/login', {
        email,
        senha,
      });

      if (!data.token || !data.usuario) {
        throw new Error('Resposta inválida do servidor.');
      }

      login(data.usuario, data.token);

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from || '/dashboard', { replace: true });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { mensagem?: string } } };
      setErro(
        apiErr?.response?.data?.mensagem ||
          'Credenciais inválidas ou e-mail não confirmado.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="lg">
        <a href="#lg-main" className="lg-skip">Ir para o formulário</a>

        <div className="lg-wrap">
          {/* ============ PAINEL ESQUERDO — BRANDING ============ */}
          <aside className="lg-brand" aria-label="Sobre o AgroGestor">
            <div className="lg-brand-top">
              <Link to="/" className="lg-brand-logo" aria-label="AgroGestor — início">
                <span className="lg-brand-logo-mark" aria-hidden="true">🐄</span>
                <span>AgroGestor</span>
              </Link>

              <span className="lg-brand-badge">
                <span className="lg-brand-badge-dot" aria-hidden="true" />
                Plataforma 2.0
              </span>

              <h2 className="lg-brand-title">
                Gestão inteligente do <em>seu rebanho</em>.
              </h2>
              <p className="lg-brand-sub">
                Controle produção, categorias e relatórios em um só lugar.
                Simples como deve ser.
              </p>

              <ul className="lg-brand-list">
                {[
                  'Dashboard em tempo real',
                  'Backup automático na nuvem',
                  'Relatórios prontos em um clique',
                ].map((item) => (
                  <li key={item} className="lg-brand-item">
                    <span className="lg-brand-check" aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg-brand-footer">
              <span>© {new Date().getFullYear()} AgroGestor</span>
              <span className="lg-brand-footer-dot" aria-hidden="true" />
              <span>Feito no Brasil 🇧🇷</span>
            </div>
          </aside>

          {/* ============ PAINEL DIREITO — FORMULÁRIO ============ */}
          <main className="lg-form-side" id="lg-main">
            <div className="lg-card">
              <h1 className="lg-title">Bem-vindo de volta</h1>
              <p className="lg-sub">Entre com suas credenciais para continuar.</p>

              {erro && (
                <div
                  className="lg-alert"
                  role="alert"
                  aria-live="polite"
                  id="lg-erro"
                >
                  <span className="lg-alert-icon" aria-hidden="true">!</span>
                  <span>{erro}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="lg-form" noValidate>
                <div className="lg-field">
                  <label htmlFor="email" className="lg-label">E-mail</label>
                  <div className="lg-input-wrap">
                    <input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                      className={`lg-input${erro ? ' has-error' : ''}`}
                      aria-invalid={!!erro}
                      aria-describedby={erro ? 'lg-erro' : undefined}
                      disabled={carregando}
                      spellCheck={false}
                    />
                  </div>
                </div>

                <div className="lg-field">
                  <div className="lg-label-row">
                    <label htmlFor="senha" className="lg-label">Senha</label>
                    <Link to="/forgot-password" className="lg-forgot">
                      Esqueci minha senha
                    </Link>
                  </div>
                  <div className="lg-input-wrap">
                    <input
                      id="senha"
                      type={mostrarSenha ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                      autoComplete="current-password"
                      className={`lg-input${erro ? ' has-error' : ''}`}
                      aria-invalid={!!erro}
                      aria-describedby={erro ? 'lg-erro' : undefined}
                      disabled={carregando}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      className="lg-input-icon"
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-pressed={mostrarSenha}
                    >
                      {mostrarSenha ? (
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
                      ) : (
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
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="lg-btn-primary"
                  disabled={carregando}
                  aria-busy={carregando}
                >
                  {carregando ? (
                    <>
                      <span className="lg-spinner" aria-hidden="true" />
                      Entrando…
                    </>
                  ) : (
                    <>
                      Entrar
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>
              </form>

              <div className="lg-divider" aria-hidden="true">ou</div>

              <p className="lg-footer-text">
                Não tem conta?
                <Link to="/signup">Criar conta grátis</Link>
              </p>

              <p className="lg-legal">
                Ao continuar, você concorda com os{' '}
                <Link to="/termos" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                  Termos
                </Link>{' '}
                e a{' '}
                <Link to="/privacidade" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}