import STYLES from '../styles/login.css?inline';
import { Icon } from '../components/LandingIcons';
import PUBLIC_STYLES from '../styles/publicstyles.css?inline';
// src/pages/Login.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

/* ============================================================
   CSS do componente — Paleta: Blue + Slate
   ============================================================ */


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

  // Limpa o erro a cada mudança nos campos (sem depender de `erro` para
  // não disparar re-render desnecessário nem quebrar o exhaustive-deps)
  useEffect(() => {
    setErro(null);
  }, [email, senha]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const data = await authService.login({ email, senha });

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
      <style>{STYLES}{PUBLIC_STYLES}</style>
      <div className="lg">
        <a href="#lg-main" className="lg-skip">Ir para o formulário</a>

        <div className="lg-wrap">
          {/* ============ PAINEL ESQUERDO — BRANDING ============ */}
          <aside className="lg-brand" aria-label="Sobre o CtOperacional">
            <div className="lg-brand-top">
              <Link to="/" className="lg-brand-logo" aria-label="CtOperacional — início">
                <span className="lg-brand-logo-mark" aria-hidden="true"><img src="/favicon.svg" alt="" /></span>
                <span><b>Ct</b>Operacional</span>
              </Link>

              <span className="lg-brand-badge">
                <span className="lg-brand-badge-dot" aria-hidden="true" />
                Sistema Operacional
              </span>

              <h2 className="lg-brand-title">
                Controle operacional <em>simples e visual</em>.
              </h2>
              <p className="lg-brand-sub">
                Organize tarefas, acompanhe o fluxo de trabalho e mantenha sua equipe
                alinhada em um só lugar.
              </p>

              <ul className="lg-brand-list">
                {[
                  'Quadro Kanban em tempo real',
                  'Histórico e backup na nuvem',
                  'Atalhos e busca rápida (Ctrl+K)',
                ].map((item) => (
                  <li key={item} className="lg-brand-item">
                    <span className="lg-brand-check" aria-hidden="true"><Icon name="check" size={15} /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg-brand-footer">
              <span>© {new Date().getFullYear()} CtOperacional</span>
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
                      <Icon name="arrow" size={18} />
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