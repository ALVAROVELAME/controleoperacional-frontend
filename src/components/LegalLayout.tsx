import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface SecaoLegal {
  id: string;
  titulo: string;
  conteudo: ReactNode;
}

export interface LegalLayoutProps {
  tipo: 'termos' | 'privacidade';
  titulo: string;
  subtitulo: string;
  atualizadoEm: string;
  versao: string;
  secoes: SecaoLegal[];
  voltarPara?: { rota: string; texto: string };
}

/* ============================================================
   CSS
   ============================================================ */
const STYLES = `
.legal {
  --bg: #ffffff;
  --bg-soft: #f6faf7;
  --ink: #0a1810;
  --ink-soft: #2a4033;
  --muted: #3f5a48;
  --line: #e3ebe6;
  --line-strong: #c9d9cd;
  --brand: #14532d;
  --brand-2: #22c55e;
  --brand-3: #0f4a24;
  --brand-soft: #e8f5ec;
  --shadow-sm: 0 1px 2px rgba(11,26,18,.04);
  --shadow-md: 0 20px 50px -25px rgba(11,26,18,.18);

  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg-soft);
  color: var(--ink);
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.legal *, .legal *::before, .legal *::after { box-sizing: border-box; }
.legal h1, .legal h2, .legal h3 { margin: 0; letter-spacing: -.02em; color: var(--ink); }
.legal p { margin: 0 0 14px; }
.legal p:last-child { margin-bottom: 0; }
.legal a { color: var(--brand); text-decoration: underline; text-underline-offset: 3px; transition: color .15s; }
.legal a:hover { color: var(--brand-3); }
.legal button { font-family: inherit; }
.legal ul, .legal ol { margin: 0 0 14px; padding-left: 22px; }
.legal li { margin-bottom: 6px; }
.legal li::marker { color: var(--brand); }
.legal strong { color: var(--ink); font-weight: 700; }

/* Skip link */
.legal-skip {
  position: absolute; top: -100px; left: 12px; z-index: 9999;
  padding: 12px 18px; background: var(--brand); color: #fff !important;
  font-weight: 600; font-size: 14px;
  border-radius: 0 0 10px 10px;
  text-decoration: none !important;
  transition: top .18s ease;
}
.legal-skip:focus { top: 0; outline: 3px solid #fff; outline-offset: 2px; }

/* Foco visível */
.legal a:focus-visible,
.legal button:focus-visible,
.legal summary:focus-visible {
  outline: 3px solid var(--brand-2);
  outline-offset: 3px;
  border-radius: 8px;
}

/* ---------- Barra de progresso ---------- */
.legal-progress {
  position: fixed; top: 0; left: 0; right: 0;
  height: 3px;
  background: transparent;
  z-index: 100;
  pointer-events: none;
}
.legal-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-2), var(--brand));
  width: 0%;
  transition: width .12s linear;
  box-shadow: 0 0 8px rgba(34,197,94,.4);
}

/* ---------- Header ---------- */
.legal-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255,255,255,.9);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--line);
}
.legal-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.legal-logo {
  display: inline-flex; align-items: center; gap: 10px;
  color: var(--brand); font-weight: 700; font-size: 17px;
  text-decoration: none !important;
}
.legal-logo-mark {
  width: 34px; height: 34px; border-radius: 10px;
  display: grid; place-items: center; font-size: 18px;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  box-shadow: inset 0 0 0 1px rgba(20,83,45,.08);
}
.legal-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none !important;
  transition: border-color .15s, background .15s, color .15s;
}
.legal-back:hover {
  border-color: var(--brand);
  background: #fff;
  color: var(--brand);
}

/* ---------- Hero ---------- */
.legal-hero {
  padding: 56px 24px 40px;
  background:
    radial-gradient(800px 400px at 80% -20%, rgba(34,197,94,.10), transparent 60%),
    linear-gradient(180deg, #f6faf7 0%, #ffffff 100%);
  border-bottom: 1px solid var(--line);
}
.legal-hero-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.legal-hero-badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}
.legal-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: var(--brand-soft);
  color: var(--brand);
  border: 1px solid rgba(20,83,45,.12);
}
.legal-badge--neutral {
  background: #fff;
  color: var(--muted);
  border-color: var(--line);
}
.legal-hero h1 {
  font-size: clamp(30px, 4.4vw, 44px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -.03em;
  max-width: 780px;
  margin-bottom: 14px;
}
.legal-hero-sub {
  font-size: 16.5px;
  color: var(--ink-soft);
  max-width: 720px;
  line-height: 1.65;
}

/* ---------- Grid principal ---------- */
.legal-grid {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 48px;
  align-items: start;
}

/* ---------- TOC desktop ---------- */
.legal-toc {
  position: sticky;
  top: 88px;
  align-self: start;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  padding-right: 8px;
}
.legal-toc-titulo {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 12px;
}
.legal-toc-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-left: 2px solid var(--line);
}
.legal-toc-link {
  display: block;
  padding: 8px 14px;
  font-size: 13.5px;
  color: var(--muted);
  text-decoration: none !important;
  border-left: 2px solid transparent;
  margin-left: -2px;
  transition: color .15s, border-color .15s, background .15s;
  border-radius: 0 8px 8px 0;
}
.legal-toc-link:hover { color: var(--brand); background: var(--brand-soft); }
.legal-toc-link.is-ativo {
  color: var(--brand);
  border-left-color: var(--brand);
  font-weight: 600;
  background: var(--brand-soft);
}

/* ---------- TOC mobile (details/summary) ---------- */
.legal-toc-mobile {
  display: none;
  margin-bottom: 24px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
}
.legal-toc-mobile summary {
  list-style: none;
  cursor: pointer;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 700;
  font-size: 14px;
  color: var(--ink);
  user-select: none;
}
.legal-toc-mobile summary::-webkit-details-marker { display: none; }
.legal-toc-mobile summary::after {
  content: "▾";
  font-size: 12px;
  color: var(--muted);
  transition: transform .2s ease;
}
.legal-toc-mobile[open] summary::after { transform: rotate(180deg); }
.legal-toc-mobile-nav {
  border-top: 1px solid var(--line);
  padding: 8px 0;
  display: flex;
  flex-direction: column;
}
.legal-toc-mobile-nav a {
  padding: 11px 18px;
  font-size: 14px;
  color: var(--ink-soft);
  text-decoration: none !important;
  transition: background .15s, color .15s;
}
.legal-toc-mobile-nav a:hover,
.legal-toc-mobile-nav a:active {
  background: var(--brand-soft);
  color: var(--brand);
}

/* ---------- Artigo ---------- */
.legal-article {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 44px 48px;
  box-shadow: var(--shadow-sm);
  min-width: 0;
}
.legal-article > * { max-width: 720px; }

.legal-sec {
  scroll-margin-top: 96px;
  padding-top: 8px;
}
.legal-sec + .legal-sec { margin-top: 40px; padding-top: 34px; border-top: 1px solid var(--line); }

.legal-sec-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px; height: 28px;
  padding: 0 8px;
  border-radius: 8px;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 12.5px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  margin-bottom: 10px;
}
.legal-sec-titulo {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -.02em;
  margin-bottom: 14px;
}
.legal-sec h3 {
  font-size: 15.5px;
  font-weight: 700;
  margin: 22px 0 10px;
  color: var(--ink);
}
.legal-sec p,
.legal-sec li {
  font-size: 15px;
  line-height: 1.75;
  color: var(--ink-soft);
}

/* Callout para destaques */
.legal-callout {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px 18px;
  background: var(--brand-soft);
  border: 1px solid rgba(20,83,45,.14);
  border-left: 4px solid var(--brand);
  border-radius: 12px;
  margin: 16px 0;
}
.legal-callout-icon {
  flex-shrink: 0;
  width: 22px; height: 22px;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  background: #fff;
  color: var(--brand);
  font-size: 12px;
  font-weight: 800;
  margin-top: 1px;
}
.legal-callout p { margin: 0; font-size: 14.5px; color: var(--ink); }

/* Caixa de contato */
.legal-contato-box {
  margin-top: 32px;
  padding: 22px 24px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--bg-soft);
}
.legal-contato-box h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 10px;
}
.legal-contato-box p {
  font-size: 14px;
  color: var(--ink-soft);
  line-height: 1.7;
}

/* ---------- Footer ---------- */
.legal-footer {
  background: #0a1710;
  color: #d7e3da;
  padding: 40px 24px 28px;
}
.legal-footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 13px;
}
.legal-footer a { color: #a7f3d0; text-decoration: none; }
.legal-footer a:hover { color: #fff; text-decoration: underline; }
.legal-footer-links {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}

/* ---------- Back to top ---------- */
.legal-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--brand);
  color: #fff;
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 18px;
  box-shadow: 0 14px 30px -10px rgba(20,83,45,.5);
  z-index: 60;
  opacity: 0;
  pointer-events: none;
  transform: translateY(12px);
  transition: opacity .2s ease, transform .2s ease, background .15s ease;
}
.legal-top.is-visible {
  opacity: 1;
  pointer-events: auto;
  transform: none;
}
.legal-top:hover { background: var(--brand-3); }
.legal-top:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
  box-shadow: 0 0 0 6px rgba(34,197,94,.55);
}

/* ---------- Responsivo ---------- */
@media (max-width: 960px) {
  .legal-grid {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 28px 20px 60px;
  }
  .legal-toc { display: none; }
  .legal-toc-mobile { display: block; }
  .legal-article { padding: 32px 24px; border-radius: 16px; }
  .legal-hero { padding: 40px 20px 32px; }
  .legal-hero h1 { font-size: 28px; }
  .legal-hero-sub { font-size: 15.5px; }
}
@media (max-width: 600px) {
  .legal-header-inner { padding: 12px 16px; }
  .legal-back span.legal-back-texto { display: none; }
  .legal-article { padding: 26px 20px; }
  .legal-sec-titulo { font-size: 20px; }
  .legal-sec p, .legal-sec li { font-size: 14.5px; }
  .legal-top { right: 16px; bottom: 16px; width: 42px; height: 42px; }
  .legal-footer-inner { flex-direction: column; align-items: flex-start; }
}

@media (prefers-reduced-motion: reduce) {
  .legal-top, .legal-progress-bar, .legal-toc-mobile summary::after {
    transition: none;
  }
  .legal { scroll-behavior: auto; }
}

/* ---------- Impressão ---------- */
@media print {
  .legal-header,
  .legal-hero,
  .legal-toc,
  .legal-toc-mobile,
  .legal-footer,
  .legal-top,
  .legal-progress,
  .legal-skip { display: none !important; }

  .legal { background: #fff; color: #000; }
  .legal-grid { display: block; padding: 0; max-width: 100%; }
  .legal-article {
    box-shadow: none;
    border: none;
    padding: 0;
    border-radius: 0;
  }
  .legal-sec + .legal-sec { border-top: 1px solid #ccc; }
  .legal-sec { break-inside: avoid; }
  .legal a { color: #000; text-decoration: underline; }
}
`;

/* ============================================================
   Componente
   ============================================================ */
export default function LegalLayout({
  tipo,
  titulo,
  subtitulo,
  atualizadoEm,
  versao,
  secoes,
  voltarPara = { rota: '/', texto: 'Voltar' },
}: LegalLayoutProps) {
  const [progresso, setProgresso] = useState(0);
  const [ativo, setAtivo] = useState<string>(secoes[0]?.id ?? '');
  const [mostrarTopo, setMostrarTopo] = useState(false);

  // ---------- Barra de progresso ----------
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const atual = window.scrollY;
      const p = total > 0 ? Math.min(100, (atual / total) * 100) : 0;
      setProgresso(p);
      setMostrarTopo(atual > 400);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ---------- Seção ativa no TOC ----------
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const els = secoes
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visiveis = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
        if (visiveis.length > 0) setAtivo(visiveis[0].target.id);
      },
      { rootMargin: '-18% 0px -70% 0px', threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [secoes]);

  const voltarAoTopo = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="legal">
        <div className="legal-progress" aria-hidden="true">
          <div className="legal-progress-bar" style={{ width: `${progresso}%` }} />
        </div>

        <a href="#legal-conteudo" className="legal-skip">
          Ir para o conteúdo
        </a>

        {/* ---------- Header ---------- */}
        <header className="legal-header">
          <div className="legal-header-inner">
            <Link to="/" className="legal-logo" aria-label="AgroGestor — início">
              <span className="legal-logo-mark" aria-hidden="true">🐄</span>
              <span>AgroGestor</span>
            </Link>
            <Link to={voltarPara.rota} className="legal-back">
              <span aria-hidden="true">←</span>
              <span className="legal-back-texto">{voltarPara.texto}</span>
            </Link>
          </div>
        </header>

        {/* ---------- Hero ---------- */}
        <section className="legal-hero" aria-labelledby="legal-titulo">
          <div className="legal-hero-inner">
            <div className="legal-hero-badge-row">
              <span className="legal-badge">
                <span aria-hidden="true">📄</span> Versão {versao}
              </span>
              <span className="legal-badge legal-badge--neutral">
                Atualizado em {atualizadoEm}
              </span>
            </div>
            <h1 id="legal-titulo">{titulo}</h1>
            <p className="legal-hero-sub">{subtitulo}</p>
          </div>
        </section>

        {/* ---------- Grid ---------- */}
        <div className="legal-grid">
          {/* TOC desktop */}
          <aside className="legal-toc" aria-label="Índice do documento">
            <div className="legal-toc-titulo">Nesta página</div>
            <nav className="legal-toc-nav">
              {secoes.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`legal-toc-link${ativo === s.id ? ' is-ativo' : ''}`}
                  aria-current={ativo === s.id ? 'location' : undefined}
                >
                  {String(i + 1).padStart(2, '0')}. {s.titulo}
                </a>
              ))}
            </nav>
          </aside>

          {/* TOC mobile */}
          <details className="legal-toc-mobile">
            <summary>Índice do documento</summary>
            <nav className="legal-toc-mobile-nav">
              {secoes.map((s, i) => (
                <a key={s.id} href={`#${s.id}`}>
                  {String(i + 1).padStart(2, '0')}. {s.titulo}
                </a>
              ))}
            </nav>
          </details>

          {/* Artigo */}
          <article className="legal-article" id="legal-conteudo">
            {secoes.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="legal-sec"
                aria-labelledby={`${s.id}-titulo`}
              >
                <span className="legal-sec-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 id={`${s.id}-titulo`} className="legal-sec-titulo">
                  {s.titulo}
                </h2>
                {s.conteudo}
              </section>
            ))}
          </article>
        </div>

        {/* ---------- Footer ---------- */}
        <footer className="legal-footer">
          <div className="legal-footer-inner">
            <span>
              © {new Date().getFullYear()} AgroGestor · Documento do tipo{' '}
              <strong style={{ color: '#fff', fontWeight: 700 }}>
                {tipo === 'termos' ? 'Termos de Uso' : 'Política de Privacidade'}
              </strong>
            </span>
            <nav className="legal-footer-links" aria-label="Documentos legais">
              <Link to="/termos">Termos de Uso</Link>
              <Link to="/privacidade">Política de Privacidade</Link>
              <a href="mailto:contato@agrogestor.app">Contato</a>
            </nav>
          </div>
        </footer>

        {/* ---------- Voltar ao topo ---------- */}
        <button
          type="button"
          onClick={voltarAoTopo}
          className={`legal-top${mostrarTopo ? ' is-visible' : ''}`}
          aria-label="Voltar ao topo"
        >
          <span aria-hidden="true">↑</span>
        </button>
      </div>
    </>
  );
}