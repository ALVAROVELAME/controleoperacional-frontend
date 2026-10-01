import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export interface StatusOpcoes {
  tipo: 'carregando' | 'sucesso' | 'erro' | 'info';
  titulo: string;
  mensagem: string;
  ctaTexto?: string;
  ctaLink?: string;
  autoRedirect?: number; // segundos
  detalhes?: string;
  onRetry?: () => void;
  retryTexto?: string;
}

/* ============================================================
   CSS
   ============================================================ */
const STYLES = `
.st {
  --bg: #ffffff;
  --bg-soft: #f6faf7;
  --ink: #0b1a12;
  --ink-soft: #3d5648;
  --muted: #4f6a5b;
  --line: #e6efe9;
  --brand: #166534;
  --brand-2: #22c55e;
  --brand-3: #0f4a24;

  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: var(--ink);
  background: var(--bg-soft);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.st *, .st *::before, .st *::after { box-sizing: border-box; }
.st h1, .st h2 { margin: 0; letter-spacing: -.025em; }
.st p { margin: 0; }
.st a { text-decoration: none; color: inherit; }

.st-skip {
  position: absolute; top: -100px; left: 12px; z-index: 9999;
  padding: 12px 18px; background: var(--brand); color: #fff !important;
  font-weight: 600; font-size: 14px;
  border-radius: 0 0 10px 10px;
  transition: top .18s ease;
}
.st-skip:focus { top: 0; outline: 3px solid #fff; outline-offset: 2px; }

.st a:focus-visible,
.st button:focus-visible {
  outline: 3px solid var(--brand-2);
  outline-offset: 3px;
  border-radius: 10px;
}
.st .st-btn-primary:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
  box-shadow: 0 0 0 6px rgba(22,101,52,.55);
}

.st-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background:
    radial-gradient(900px 500px at 80% -10%, rgba(34,197,94,.10), transparent 60%),
    radial-gradient(700px 400px at -10% 100%, rgba(22,101,52,.07), transparent 55%),
    linear-gradient(180deg, #f6faf7 0%, #ffffff 100%);
  position: relative;
  overflow: hidden;
}

.st-brand {
  position: absolute;
  top: 24px; left: 50%;
  transform: translateX(-50%);
  display: inline-flex; align-items: center; gap: 10px;
  color: var(--brand); font-weight: 700; font-size: 17px;
}
.st-brand-mark {
  width: 34px; height: 34px; border-radius: 10px;
  display: grid; place-items: center; font-size: 18px;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  box-shadow: inset 0 0 0 1px rgba(22,101,52,.08);
}

.st-card {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 48px 40px 40px;
  text-align: center;
  box-shadow:
    0 1px 2px rgba(11,26,18,.04),
    0 30px 70px -30px rgba(11,26,18,.28);
  position: relative;
  animation: stIn .45s cubic-bezier(.2,.7,.2,1);
}
@keyframes stIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

.st-icon {
  width: 88px; height: 88px; margin: 0 auto 26px;
  border-radius: 50%;
  display: grid; place-items: center;
  font-size: 38px;
  color: #fff;
  font-weight: 800;
  position: relative;
}
.st-icon--sucesso {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: 1px solid #16a34a;
  box-shadow: 0 16px 40px -18px rgba(22,101,52,.5);
}
.st-icon--erro {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: 1px solid #dc2626;
  box-shadow: 0 16px 40px -18px rgba(185,28,28,.5);
}
.st-icon--info {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: 1px solid #2563eb;
  box-shadow: 0 16px 40px -18px rgba(30,64,175,.5);
}
.st-icon--carregando {
  background: var(--bg-soft);
  border: 1px solid var(--line);
}

.st-spinner {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 3px solid #d7ebe0;
  border-top-color: var(--brand);
  animation: stSpin .8s linear infinite;
}
@keyframes stSpin { to { transform: rotate(360deg); } }

.st-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: 12px;
  line-height: 1.2;
}
.st-msg {
  font-size: 15.5px;
  color: var(--ink-soft);
  line-height: 1.65;
  max-width: 420px;
  margin: 0 auto 8px;
}
.st-detalhes {
  font-size: 13px;
  color: var(--muted);
  margin-top: 12px;
  font-style: italic;
}

.st-actions {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.st-btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%;
  padding: 15px 24px;
  background: var(--brand);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -.01em;
  cursor: pointer;
  box-shadow: 0 14px 30px -12px rgba(22,101,52,.6);
  transition: transform .15s ease, box-shadow .2s ease, background .15s ease;
  font-family: inherit;
}
.st-btn-primary:hover {
  transform: translateY(-2px);
  background: var(--brand-3);
  box-shadow: 0 20px 40px -16px rgba(22,101,52,.7);
}
.st-btn-primary:active { transform: translateY(0); }

.st-btn-secondary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%;
  padding: 14px 24px;
  background: #fff;
  color: var(--brand);
  border: 1.5px solid var(--line);
  border-radius: 14px;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color .15s, background .15s, color .15s;
  font-family: inherit;
}
.st-btn-secondary:hover {
  border-color: var(--brand);
  background: var(--bg-soft);
}

.st-countdown {
  margin-top: 22px;
  font-size: 13px;
  color: var(--muted);
  display: inline-flex; align-items: center; gap: 8px;
}
.st-countdown b {
  color: var(--brand);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 18px;
  display: inline-block;
  text-align: center;
}
.st-countdown-bar {
  width: 100%;
  height: 3px;
  background: var(--line);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 12px;
}
.st-countdown-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand), var(--brand-2));
  border-radius: 999px;
  transition: width 1s linear;
}

.st-footer {
  margin-top: 28px;
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  display: flex; align-items: center; justify-content: center;
  gap: 10px; flex-wrap: wrap;
}
.st-footer-dot {
  width: 4px; height: 4px; border-radius: 50%;
  background: #a7f3d0;
}

@media (max-width: 560px) {
  .st-card { padding: 36px 24px 30px; border-radius: 20px; }
  .st-title { font-size: 22px; }
  .st-msg { font-size: 15px; }
  .st-icon { width: 76px; height: 76px; font-size: 32px; margin-bottom: 22px; }
  .st-spinner { width: 34px; height: 34px; }
  .st-brand { font-size: 15px; top: 20px; }
  .st-brand-mark { width: 30px; height: 30px; font-size: 16px; }
}
@media (max-width: 400px) {
  .st-page { padding: 80px 16px 32px; }
  .st-card { padding: 32px 20px 26px; }
}

@media (prefers-reduced-motion: reduce) {
  .st-card { animation: none; }
  .st-spinner { animation-duration: 1.6s; }
  .st-countdown-fill { transition: none; }
}
`;

/* ============================================================
   Componente principal (named export)
   — Reutilizável por qualquer página
   ============================================================ */
export function StatusView({
  tipo,
  titulo,
  mensagem,
  ctaTexto,
  ctaLink,
  autoRedirect,
  detalhes,
  onRetry,
  retryTexto = 'Tentar novamente',
}: StatusOpcoes) {
  const navigate = useNavigate();
  const [segundos, setSegundos] = useState(autoRedirect ?? 0);

  useEffect(() => {
    if (!autoRedirect || !ctaLink) return;
    setSegundos(autoRedirect);
    const id = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          clearInterval(id);
          navigate(ctaLink, { replace: true });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [autoRedirect, ctaLink, navigate]);

  const icone =
    tipo === 'sucesso' ? '✓' :
    tipo === 'erro' ? '✕' :
    tipo === 'info' ? 'i' :
    null;

  const liveProps =
    tipo === 'erro'
      ? { role: 'alert' as const, 'aria-live': 'assertive' as const }
      : { role: 'status' as const, 'aria-live': 'polite' as const };

  return (
    <>
      <style>{STYLES}</style>
      <div className="st">
        <a href="#st-main" className="st-skip">Ir para o conteúdo</a>

        <div className="st-page">
          <Link to="/" className="st-brand" aria-label="AgroGestor — início">
            <span className="st-brand-mark" aria-hidden="true">🐄</span>
            <span>AgroGestor</span>
          </Link>

          <main className="st-card" id="st-main" {...liveProps}>
            <div className={`st-icon st-icon--${tipo}`} aria-hidden="true">
              {tipo === 'carregando' ? <span className="st-spinner" /> : icone}
            </div>

            <h1 className="st-title">{titulo}</h1>
            <p className="st-msg">{mensagem}</p>

            {detalhes && <p className="st-detalhes">{detalhes}</p>}

            {tipo !== 'carregando' && (ctaTexto || onRetry) && (
              <div className="st-actions">
                {ctaTexto && ctaLink && (
                  <Link to={ctaLink} className="st-btn-primary">
                    {ctaTexto}
                    <span aria-hidden="true">→</span>
                  </Link>
                )}

                {onRetry && (
                  <button
                    type="button"
                    className="st-btn-secondary"
                    onClick={onRetry}
                  >
                    <span aria-hidden="true">↻</span> {retryTexto}
                  </button>
                )}
              </div>
            )}

            {autoRedirect && ctaLink && segundos > 0 && (
              <>
                <p className="st-countdown">
                  Redirecionando em <b>{segundos}</b>s…
                </p>
                <div className="st-countdown-bar" aria-hidden="true">
                  <div
                    className="st-countdown-fill"
                    style={{ width: `${(segundos / autoRedirect) * 100}%` }}
                  />
                </div>
              </>
            )}

            <p className="st-footer">
              <span>© {new Date().getFullYear()} AgroGestor</span>
              <span className="st-footer-dot" aria-hidden="true" />
              <span>Feito no Brasil 🇧🇷</span>
            </p>
          </main>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Página padrão (default export)
   — Usada pela rota /status no App.tsx
   ============================================================ */
export default function StatusPage() {
  return (
    <StatusView
      tipo="info"
      titulo="Central de status"
      mensagem="Esta é a página genérica de status do AgroGestor. Se você chegou aqui por engano, volte para o início."
      ctaTexto="Voltar ao início"
      ctaLink="/"
    />
  );
}