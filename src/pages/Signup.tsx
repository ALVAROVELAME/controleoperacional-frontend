import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

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
   CSS do componente
   ============================================================ */
const STYLES = `
.sg {
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
.sg *, .sg *::before, .sg *::after { box-sizing: border-box; }
.sg h1, .sg h2, .sg h3 { margin: 0; letter-spacing: -.02em; }
.sg p { margin: 0; }
.sg a { color: inherit; text-decoration: none; }
.sg button, .sg input { font-family: inherit; }

/* ---------- Skip link ---------- */
.sg-skip {
  position: absolute; top: -100px; left: 12px; z-index: 9999;
  padding: 12px 18px; background: var(--brand); color: #fff !important;
  font-weight: 600; font-size: 14px;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 10px 24px -10px rgba(0,0,0,.35);
  transition: top .18s ease;
}
.sg-skip:focus { top: 0; outline: 3px solid #fff; outline-offset: 2px; }

/* ---------- Foco visível ---------- */
.sg a:focus-visible,
.sg button:focus-visible,
.sg input:focus-visible,
.sg .sg-termos:focus-within {
  outline: 3px solid var(--brand-2);
  outline-offset: 2px;
  border-radius: 8px;
}
.sg .sg-btn-primary:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
  box-shadow: 0 0 0 6px rgba(22,101,52,.55);
}

/* ---------- Layout base ---------- */
.sg-wrap {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  min-height: 100vh;
  min-height: 100dvh;
}

/* ---------- Painel esquerdo ---------- */
.sg-brand {
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
.sg-brand::before {
  content: "";
  position: absolute; inset: 0;
  background:
    radial-gradient(700px 400px at 90% 10%, rgba(34,197,94,.28), transparent 60%),
    radial-gradient(500px 300px at 10% 90%, rgba(255,255,255,.08), transparent 60%);
  pointer-events: none;
}
.sg-brand > * { position: relative; }

.sg-brand-top { display: flex; flex-direction: column; }
.sg-brand-logo {
  display: inline-flex; align-items: center; gap: 12px;
  color: #fff; font-weight: 700; font-size: 20px; letter-spacing: -.02em;
  width: fit-content;
  margin-bottom: 48px;
}
.sg-brand-logo-mark {
  width: 44px; height: 44px; border-radius: 12px;
  display: grid; place-items: center; font-size: 22px;
  background: rgba(255,255,255,.12);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.18);
  backdrop-filter: blur(6px);
}
.sg-brand-badge {
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
.sg-brand-badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 3px rgba(74,222,128,.28);
}
.sg-brand-title {
  font-size: clamp(28px, 3.4vw, 40px);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -.03em;
  color: #ffffff;
  margin-bottom: 18px;
  max-width: 480px;
}
.sg-brand-title em {
  font-style: normal;
  background: linear-gradient(120deg, #bbf7d0, #4ade80);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.sg-brand-sub {
  font-size: 16px;
  line-height: 1.6;
  color: #d1fae5;
  max-width: 440px;
  margin-bottom: 32px;
}
.sg-brand-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 14px;
}
.sg-brand-item {
  display: flex; align-items: center; gap: 12px;
  font-size: 14.5px; color: #ecfdf5; font-weight: 500;
}
.sg-brand-check {
  width: 22px; height: 22px; border-radius: 50%;
  display: inline-grid; place-items: center;
  background: rgba(74,222,128,.18);
  border: 1px solid rgba(74,222,128,.35);
  color: #bbf7d0;
  font-size: 11px; font-weight: 800;
  flex-shrink: 0;
}
.sg-brand-footer {
  font-size: 12.5px; color: #a7f3d0;
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.sg-brand-footer-dot { width: 4px; height: 4px; border-radius: 50%; background: #4ade80; }

/* ---------- Painel direito ---------- */
.sg-form-side {
  display: flex; align-items: center; justify-content: center;
  padding: 48px 32px;
  background:
    radial-gradient(600px 400px at 100% 0%, rgba(34,197,94,.06), transparent 60%),
    var(--bg-soft);
  overflow-y: auto;
}
.sg-card {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow:
    0 1px 2px rgba(11,26,18,.04),
    0 20px 50px -25px rgba(11,26,18,.22);
}
.sg-header { margin-bottom: 26px; }
.sg-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
  color: var(--muted);
  margin-bottom: 14px;
  transition: color .15s;
  width: fit-content;
}
.sg-back:hover { color: var(--brand); }
.sg-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -.025em;
  color: var(--ink);
  margin-bottom: 6px;
}
.sg-sub {
  font-size: 14.5px;
  color: var(--muted);
}

/* ---------- Alerta ---------- */
.sg-alert {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px;
  background: var(--danger-bg);
  border: 1px solid var(--danger-line);
  border-radius: 12px;
  color: var(--danger-ink);
  font-size: 13.5px;
  line-height: 1.5;
  margin-bottom: 22px;
  animation: sgShake .35s ease;
}
.sg-alert-icon {
  flex-shrink: 0;
  width: 20px; height: 20px; border-radius: 50%;
  display: inline-grid; place-items: center;
  background: #fee2e2; color: var(--danger-ink);
  font-size: 12px; font-weight: 800;
}
@keyframes sgShake {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* ---------- Form ---------- */
.sg-form { display: flex; flex-direction: column; gap: 16px; }
.sg-field { display: flex; flex-direction: column; gap: 8px; }
.sg-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}
.sg-input-wrap { position: relative; }
.sg-input {
  width: 100%;
  padding: 13px 14px;
  font-size: 16px;
  color: var(--ink);
  background: #fff;
  border: 1.5px solid var(--line-strong);
  border-radius: 12px;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.sg-input--with-icon {
  padding-right: 52px; /* espaço para o ícone do olho */
}

/* Esconde o botão nativo de revelar senha (Edge/IE) — evita duplicação */
.sg-input::-ms-reveal,
.sg-input::-ms-clear {
  display: none;
}
.sg-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.sg-input::placeholder { color: #9bafa3; }
.sg-input:hover { border-color: #a9c1b0; }
.sg-input:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 4px rgba(34,197,94,.15);
}
.sg-input.is-error { border-color: #dc2626; }
.sg-input.is-error:focus { box-shadow: 0 0 0 4px rgba(220,38,38,.15); }
.sg-input:disabled { opacity: .7; cursor: not-allowed; }

/* ---------- Botão de revelar senha (SVG customizado) ---------- */
.sg-input-icon {
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
.sg-input-icon:hover {
  background: var(--bg-soft);
  color: var(--brand);
}
.sg-input-icon:active {
  transform: translateY(-50%) scale(.94);
}
.sg-input-icon svg {
  width: 20px;
  height: 20px;
  display: block;
  pointer-events: none;
}

.sg-error-msg {
  font-size: 12.5px;
  color: var(--danger-ink);
  font-weight: 500;
  display: flex; align-items: center; gap: 6px;
}
.sg-error-msg::before {
  content: "";
  width: 6px; height: 6px; border-radius: 50%;
  background: #dc2626;
  flex-shrink: 0;
}
.sg-ok-msg {
  font-size: 12.5px;
  color: var(--brand);
  font-weight: 600;
  display: flex; align-items: center; gap: 6px;
}

/* ---------- Força da senha ---------- */
.sg-strength { display: flex; align-items: center; gap: 10px; margin-top: 2px; }
.sg-strength-bar {
  flex: 1;
  height: 5px;
  background: #e6efe9;
  border-radius: 999px;
  overflow: hidden;
}
.sg-strength-fill {
  height: 100%;
  border-radius: 999px;
  transition: width .25s ease, background .25s ease;
}
.sg-strength-label {
  font-size: 11.5px;
  font-weight: 700;
  min-width: 76px;
  text-align: right;
  letter-spacing: -.01em;
}

/* ---------- Requisitos ---------- */
.sg-req-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 2px;
}
.sg-req {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--muted);
  transition: color .15s;
}
.sg-req.is-ok { color: var(--brand); font-weight: 600; }
.sg-req-dot {
  width: 14px; height: 14px; border-radius: 50%;
  display: inline-grid; place-items: center;
  background: #eef4ee;
  color: #809988;
  font-size: 9px; font-weight: 800;
  flex-shrink: 0;
  transition: background .15s, color .15s;
}
.sg-req.is-ok .sg-req-dot {
  background: #dcfce7;
  color: var(--brand);
}

/* ---------- Checkbox de termos ---------- */
.sg-termos {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color .15s, background .15s;
  background: #fbfdfb;
  position: relative;
}
.sg-termos:hover { border-color: var(--line-strong); background: #fff; }
.sg-termos.is-checked { border-color: var(--brand); background: #f0fdf4; }
.sg-termos input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.sg-termos-box {
  width: 20px; height: 20px;
  border-radius: 6px;
  border: 1.5px solid var(--line-strong);
  background: #fff;
  display: inline-grid; place-items: center;
  color: transparent;
  font-size: 12px; font-weight: 800;
  flex-shrink: 0;
  margin-top: 1px;
  transition: background .15s, border-color .15s, color .15s;
}
.sg-termos.is-checked .sg-termos-box {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}
.sg-termos-text { font-size: 13px; color: var(--ink-soft); line-height: 1.55; }
.sg-termos-text a {
  color: var(--brand);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.sg-termos-text a:hover { color: var(--brand-3); }

/* ---------- Botão primário ---------- */
.sg-btn-primary {
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
  text-align: center;
}
.sg-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--brand-3);
  box-shadow: 0 16px 32px -14px rgba(22,101,52,.7);
}
.sg-btn-primary:active:not(:disabled) { transform: translateY(0); }
.sg-btn-primary:disabled {
  opacity: .55;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
.sg-spinner {
  width: 16px; height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  animation: sgSpin .7s linear infinite;
}
@keyframes sgSpin { to { transform: rotate(360deg); } }

/* ---------- Rodapé do card ---------- */
.sg-footer-text {
  margin-top: 22px;
  text-align: center;
  font-size: 14px;
  color: var(--muted);
}
.sg-footer-text a {
  color: var(--brand);
  font-weight: 700;
  margin-left: 4px;
}
.sg-footer-text a:hover { text-decoration: underline; text-underline-offset: 3px; }

/* ---------- Sucesso ---------- */
.sg-success {
  text-align: center;
  animation: sgPop .4s cubic-bezier(.2,.7,.2,1);
}
@keyframes sgPop {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to { opacity: 1; transform: none; }
}
.sg-success-icon {
  width: 76px; height: 76px; margin: 0 auto 20px;
  border-radius: 50%;
  display: grid; place-items: center;
  font-size: 36px;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border: 1px solid #bbf7d0;
  box-shadow: 0 12px 30px -14px rgba(22,101,52,.4);
}
.sg-success-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -.025em;
  color: var(--ink);
  margin-bottom: 10px;
}
.sg-success-text {
  font-size: 14.5px;
  color: var(--ink-soft);
  line-height: 1.65;
  margin-bottom: 26px;
}
.sg-success-text strong { color: var(--brand); font-weight: 700; }
.sg-success-note {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 18px;
}

/* ---------- Responsivo ---------- */
@media (max-width: 960px) {
  .sg-wrap { grid-template-columns: 1fr; }
  .sg-brand {
    padding: 28px 24px;
    gap: 24px;
    justify-content: flex-start;
  }
  .sg-brand-logo { margin-bottom: 20px; font-size: 18px; }
  .sg-brand-logo-mark { width: 38px; height: 38px; font-size: 19px; }
  .sg-brand-title { font-size: 26px; margin-bottom: 10px; }
  .sg-brand-sub { font-size: 15px; margin-bottom: 16px; }
  .sg-brand-list { gap: 10px; }
  .sg-brand-item { font-size: 14px; }
  .sg-brand-footer { display: none; }
  .sg-form-side { padding: 32px 20px 48px; }
}
@media (max-width: 600px) {
  .sg-brand { padding: 24px 20px; }
  .sg-brand-badge { font-size: 11px; padding: 5px 11px; margin-bottom: 14px; }
  .sg-brand-title { font-size: 22px; }
  .sg-brand-sub { font-size: 14px; }
  .sg-brand-list { display: none; }
  .sg-card {
    padding: 28px 22px;
    border-radius: 16px;
    box-shadow: 0 10px 30px -18px rgba(11,26,18,.22);
  }
  .sg-title { font-size: 22px; }
  .sg-sub { font-size: 14px; }
  .sg-success-icon { width: 64px; height: 64px; font-size: 30px; }
  .sg-success-title { font-size: 20px; }
}

@media (prefers-reduced-motion: reduce) {
  .sg-alert, .sg-success { animation: none; }
  .sg-spinner { animation-duration: 1.4s; }
}
`;

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

  // Limpa erro quando o usuário digita
  useEffect(() => {
    if (erro) setErro(null);
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
      { label: 'Boa',         cor: '#15803d' },
      { label: 'Forte',       cor: '#166534' },
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
        await api.post('/api/usuarios', { nome, email, senha });
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
      <style>{STYLES}</style>
      <div className="sg">
        <a href="#sg-main" className="sg-skip">Ir para o formulário</a>

        <div className="sg-wrap">
          {/* ============ PAINEL ESQUERDO — BRANDING ============ */}
          <aside className="sg-brand" aria-label="Sobre o AgroGestor">
            <div className="sg-brand-top">
              <Link to="/" className="sg-brand-logo" aria-label="AgroGestor — início">
                <span className="sg-brand-logo-mark" aria-hidden="true">🐄</span>
                <span>AgroGestor</span>
              </Link>

              <span className="sg-brand-badge">
                <span className="sg-brand-badge-dot" aria-hidden="true" />
                Grátis para começar
              </span>

              <h2 className="sg-brand-title">
                Comece a gerenciar o <em>seu rebanho</em> hoje.
              </h2>
              <p className="sg-brand-sub">
                Crie sua conta em menos de 1 minuto e tenha controle total sobre
                produção, categorias e relatórios.
              </p>

              <ul className="sg-brand-list">
                {[
                  '100% grátis, sem cartão de crédito',
                  'Dados salvos automaticamente na nuvem',
                  'Acesso de qualquer dispositivo',
                  'Cancele quando quiser, sem burocracia',
                ].map((item) => (
                  <li key={item} className="sg-brand-item">
                    <span className="sg-brand-check" aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="sg-brand-footer">
              <span>© {new Date().getFullYear()} AgroGestor</span>
              <span className="sg-brand-footer-dot" aria-hidden="true" />
              <span>Feito no Brasil 🇧🇷</span>
            </div>
          </aside>

          {/* ============ PAINEL DIREITO — FORMULÁRIO ============ */}
          <main className="sg-form-side" id="sg-main">
            <div className="sg-card">
              {sucesso ? (
                <div className="sg-success" role="status" aria-live="polite">
                  <div className="sg-success-icon" aria-hidden="true">✅</div>
                  <h2 className="sg-success-title">Cadastro realizado!</h2>
                  <p className="sg-success-text">
                    Enviamos um e-mail de confirmação para
                    <br />
                    <strong>{email}</strong>
                  </p>
                  <Link to="/login" className="sg-btn-primary" style={{ width: '100%' }}>
                    Ir para o login <span aria-hidden="true">→</span>
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
                          <span aria-hidden="true">✓</span> Senhas conferem
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
                          <span aria-hidden="true">→</span>
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