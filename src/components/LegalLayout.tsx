import STYLES from '../styles/legallayout.css?inline';
import { Icon } from './LandingIcons';
import PUBLIC_STYLES from '../styles/publicstyles.css?inline';
// src/components/LegalLayout.tsx
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
   CSS — Paleta: Blue + Slate
   ============================================================ */


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
      <style>{STYLES}{PUBLIC_STYLES}</style>
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
            <Link to="/" className="legal-logo" aria-label="CtOperacional — início">
              <span className="legal-logo-mark" aria-hidden="true"><img src="/favicon.svg" alt="" /></span>
              <span><b>Ct</b>Operacional</span>
            </Link>
            <Link to={voltarPara.rota} className="legal-back">
              <span style={{ transform: 'rotate(180deg)' }}><Icon name="arrow" size={16} /></span>
              <span className="legal-back-texto">{voltarPara.texto}</span>
            </Link>
          </div>
        </header>

        {/* ---------- Hero ---------- */}
        <section className="legal-hero" aria-labelledby="legal-titulo">
          <div className="legal-hero-inner">
            <div className="legal-hero-badge-row">
              <span className="legal-badge">
                <Icon name="layers" size={15} /> Versão {versao}
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
              © {new Date().getFullYear()} CtOperacional · Documento do tipo{' '}
              <strong style={{ color: '#fff', fontWeight: 700 }}>
                {tipo === 'termos' ? 'Termos de Uso' : 'Política de Privacidade'}
              </strong>
            </span>
            <nav className="legal-footer-links" aria-label="Documentos legais">
              <Link to="/termos">Termos de Uso</Link>
              <Link to="/privacidade">Política de Privacidade</Link>
              <a href="mailto:contato@ctoperacional.app">Contato</a>
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