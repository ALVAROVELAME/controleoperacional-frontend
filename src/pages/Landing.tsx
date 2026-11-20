import STYLES from '../styles/landing.css?inline';
import { useState, useEffect, useRef, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/LandingIcons';
import type { IconName } from '../components/LandingIcons';

const LINKS = {
  portfolio: 'https://alvarovelame.vercel.app',
  github: 'https://github.com/ALVAROVELAME',
  linkedin: 'https://www.linkedin.com/in/alvaro-velame/',
  email: 'alvarovelameprofissional@gmail.com',
};



const NAV = [
  { id: 'recursos', label: 'Recursos' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'arquitetura', label: 'Arquitetura' },
  { id: 'precos', label: 'Preços' },
  { id: 'faq', label: 'FAQ' },
];

const TECH: [IconName, string][] = [
  ['layers', 'React'], ['api', 'TypeScript'], ['board', 'Kanban'], ['api', 'C# API'], ['globe', 'Vercel'],
  ['timer', 'Pomodoro'], ['shield', 'Acessível'], ['chart', 'Relatórios'], ['command', 'Ctrl+K'], ['moon', 'Tema escuro'],
];

const STATS = [
  { n: 3, s: '', l: 'visões: Kanban, lista e relatórios' },
  { n: 25, s: ' min', l: 'por ciclo de foco no Pomodoro' },
  { n: 100, s: '%', l: 'web, sem instalar nada' },
  { n: 2, s: '', l: 'temas: claro e escuro' },
];

const FEATURES: { icon: IconName; t: string; d: string; w?: boolean }[] = [
  { icon: 'board', t: 'Quadros Kanban', d: 'Crie colunas personalizadas e mova cards com drag & drop fluido, sem recarregar nada.', w: true },
  { icon: 'chart', t: 'Relatórios operacionais', d: 'Acompanhe tarefas concluídas, gargalos e andamento por período.', w: true },
  { icon: 'tag', t: 'Prioridades e tags', d: 'Organize por urgência e categoria com filtros rápidos.' },
  { icon: 'timer', t: 'Pomodoro integrado', d: 'Foque em uma tarefa por vez e registre seus ciclos de trabalho.' },
  { icon: 'command', t: 'Atalhos de teclado', d: 'Command palette (Ctrl+K) para criar tarefas e navegar em segundos.' },
  { icon: 'moon', t: 'Tema claro e escuro', d: 'Interface confortável de dia ou de madrugada, você escolhe.', w: true },
  { icon: 'api', t: 'API própria', d: 'Backend REST documentado com Swagger, pronto para integrações.', w: true },
];

const PASSOS: { icon: IconName; t: string; d: string }[] = [
  { icon: 'user', t: 'Crie sua conta', d: 'Cadastro gratuito, sem cartão de crédito. Confirme o e-mail e pronto.' },
  { icon: 'board', t: 'Monte seu quadro', d: 'Crie colunas (A fazer, Em progresso, Concluído) e adicione as primeiras tarefas.' },
  { icon: 'chart', t: 'Acompanhe o fluxo', d: 'Mova cards, defina prioridades e veja a operação avançar nos relatórios.' },
];

const PLANOS = [
  { n: 'Grátis', p: 'R$ 0', per: '/ sempre', d: 'Ideal para times pequenos', f: ['Até 3 quadros', 'Até 100 tarefas', 'Colunas ilimitadas', 'Suporte por e-mail'], c: 'Começar grátis', ft: false },
  { n: 'Pro', p: 'R$ 29', per: '/ mês', d: 'Para quem quer produtividade máxima', f: ['Quadros ilimitados', 'Tarefas ilimitadas', 'Relatórios avançados', 'Tema escuro', 'Suporte prioritário'], c: 'Assinar Pro', ft: true },
  { n: 'Empresa', p: 'R$ 99', per: '/ mês', d: 'Multi-equipes e integrações', f: ['Tudo do Pro', 'Multi-usuários', 'API de integração', 'Relatórios personalizados', 'Gerente de conta'], c: 'Criar conta', ft: false },
];

const FAQ = [
  { q: 'Preciso instalar algo?', a: 'Não! O CtOperacional é 100% web. Basta acessar pelo navegador do computador, tablet ou celular.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Os dados são salvos automaticamente e você pode exportar um backup em JSON quando quiser.' },
  { q: 'Posso usar de graça para sempre?', a: 'Sim! O plano Grátis permite até 3 quadros e 100 tarefas sem custo e sem prazo de expiração.' },
  { q: 'Funciona offline?', a: 'A plataforma precisa de internet para sincronizar, mas os dados ficam em cache local para consulta rápida.' },
  { q: 'Como cancelo minha assinatura?', a: 'A qualquer momento, direto no painel, sem burocracia e sem multa. Você continua com o plano Grátis.' },
];

const TASKS = [
  { n: 'Revisar estoque', t: 'Alta', c: 't-r' }, { n: 'Planejar sprint', t: 'Média', c: 't-a' },
  { n: 'Atualizar relatório', t: 'Média', c: 't-a' }, { n: 'Ajustar fluxo', t: 'Baixa', c: 't-b' },
  { n: 'Cadastrar equipe', t: 'Feito', c: 't-g' }, { n: 'Publicar quadro', t: 'Feito', c: 't-g' },
];
const COLS = ['A fazer', 'Em progresso', 'Concluído'];
// cada linha = em qual coluna está cada tarefa (máx. 3 por coluna, altura nunca muda)
const STATES = [
  [0, 0, 0, 1, 1, 2],
  [1, 0, 0, 1, 1, 2],
  [1, 0, 0, 2, 1, 2],
  [1, 1, 0, 2, 1, 2],
  [1, 1, 0, 2, 2, 2],
];

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(hover:hover) and (pointer:fine)').matches;

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);
  const pos = STATES[step];
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  // scroll: navbar + barra de progresso
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
        const h = document.documentElement.scrollHeight - window.innerHeight;
        if (bar.current) bar.current.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, []);

  // menu mobile
  useEffect(() => {
    if (!menu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', k);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', k); };
  }, [menu]);

  // reveal
  useEffect(() => {
    const els = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-r]') ?? []);
    if (typeof IntersectionObserver === 'undefined') { els.forEach((e) => e.classList.add('on')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  // spotlight nos cards + botões magnéticos
  useEffect(() => {
    if (reduced()) return;
    const el = root.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const card = t.closest<HTMLElement>('.ag-spot');
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
      const mag = t.closest<HTMLElement>('[data-mag]');
      if (mag && finePointer()) {
        const r = mag.getBoundingClientRect();
        mag.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      }
    };
    const leave = (e: PointerEvent) => {
      const mag = (e.target as HTMLElement).closest<HTMLElement>('[data-mag]');
      if (mag) mag.style.transform = '';
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerout', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerout', leave); };
  }, []);

  // demo do kanban (move cards sozinho)
  useEffect(() => {
    if (paused || reduced()) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % STATES.length), 2600);
    return () => window.clearInterval(id);
  }, [paused]);

  const go = (id: string) => {
    setMenu(false);
    requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' })
    );
  };

  const tilt = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced() || !finePointer() || !stage.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    stage.current.style.setProperty('--ry', `${-6 + ((e.clientX - r.left) / r.width - 0.5) * 6}deg`);
    stage.current.style.setProperty('--rx', `${3 - ((e.clientY - r.top) / r.height - 0.5) * 6}deg`);
  };
  const untilt = () => {
    if (!stage.current) return;
    stage.current.style.removeProperty('--ry');
    stage.current.style.removeProperty('--rx');
  };

  const words = (txt: string, start: number, cls = '') =>
    txt.split(' ').map((w, i) => (
      <span key={w + i} className={`ag-w ${cls}`} style={{ ['--i' as string]: start + i }}>{w}</span>
    ));

  return (
    <>
      <style>{STYLES}</style>
      <div className={`ag${paused ? ' ag-paused' : ''}`} ref={root}>
        <div className="ag-prog" ref={bar} aria-hidden="true" />
        <a href="#ag-main" className="ag-skip">Ir para o conteúdo principal</a>

        <header className={`ag-nav${scrolled || menu ? ' sc' : ''}`}>
          <div className="ag-nav-in">
            <Link to="/" className="ag-logo" onClick={() => setMenu(false)} aria-label="CtOperacional — início">
              <img src="/favicon.svg" alt="" width={34} height={34} />
              <span><b>Ct</b>Operacional</span>
            </Link>
            <nav className="ag-links" aria-label="Principal">
              {NAV.map((n) => <button key={n.id} type="button" className="ag-link" onClick={() => go(n.id)}>{n.label}</button>)}
            </nav>
            <div className="ag-acts">
              <Link to="/login" className="ag-btn ag-btn-o">Entrar</Link>
              <Link to="/signup" className="ag-btn ag-btn-p" data-mag>Criar conta</Link>
            </div>
            <button type="button" className="ag-burger" onClick={() => setMenu((v) => !v)} aria-label={menu ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menu} aria-controls="ag-drawer">
              <Icon name={menu ? 'close' : 'menu'} size={20} />
            </button>
          </div>
          {menu && (
            <div className="ag-drawer" id="ag-drawer">
              {NAV.map((n) => <button key={n.id} type="button" className="ag-dl" onClick={() => go(n.id)}>{n.label}</button>)}
              <div className="ag-da">
                <Link to="/login" className="ag-btn ag-btn-o" onClick={() => setMenu(false)}>Entrar</Link>
                <Link to="/signup" className="ag-btn ag-btn-p" onClick={() => setMenu(false)}>Criar conta</Link>
              </div>
            </div>
          )}
        </header>

        <main id="ag-main">
          {/* HERO */}
          <section className="ag-hero" aria-labelledby="h1">
            <div className="ag-aurora" aria-hidden="true"><i /><i /><i /></div>
            <div className="ag-grid" aria-hidden="true" />
            <div className="ag-wrap ag-hero-grid">
              <div className="ag-hero-text">
                <span className="ag-badge" data-r><i aria-hidden="true" />Kanban, relatórios e Pomodoro em um só lugar</span>
                <h1 id="h1" className="ag-h1" aria-label="Seu fluxo de trabalho, finalmente visível.">
                  <span className="ag-ln" aria-hidden="true">{words('Seu fluxo de trabalho,', 0)}</span>
                  <span className="ag-ln" aria-hidden="true">{words('finalmente visível.', 4, 'ag-grad')}</span>
                </h1>
                <p className="ag-sub" data-r>
                  Organize tarefas, enxergue gargalos e mantenha a equipe alinhada com um quadro
                  Kanban rápido, claro e feito para o dia a dia.
                </p>
                <div className="ag-hacts" data-r>
                  <Link to="/signup" className="ag-btn ag-btn-p ag-btn-lg" data-mag>Começar grátis <Icon name="arrow" size={18} /></Link>
                  <button type="button" className="ag-btn ag-btn-o ag-btn-lg" onClick={() => go('como-funciona')}><Icon name="play" size={16} /> Ver como funciona</button>
                </div>
                <ul className="ag-trust" data-r>
                  {['Sem cartão de crédito', 'Configuração em 1 minuto', 'Tema claro e escuro'].map((t) => <li key={t}><Icon name="check" size={16} />{t}</li>)}
                </ul>
              </div>

              <div className="ag-stage" ref={stage} onMouseMove={tilt} onMouseLeave={untilt}>
                <p className="sr-only">Demonstração: um quadro Kanban com três colunas (A fazer, Em progresso e Concluído) em que os cards mudam de coluna automaticamente.</p>
                <div className="ag-board">
                  <div className="ag-bar">
                    <span className="ag-dot" style={{ background: '#ff5f56' }} aria-hidden="true" />
                    <span className="ag-dot" style={{ background: '#ffbd2e' }} aria-hidden="true" />
                    <span className="ag-dot" style={{ background: '#27c93f' }} aria-hidden="true" />
                    <span className="ag-url" aria-hidden="true">ctoperacional.vercel.app/dashboard</span>
                    <button type="button" className="ag-pause" onClick={() => setPaused((v) => !v)} aria-pressed={paused}>
                      {paused ? 'Retomar animações' : 'Pausar animações'}
                    </button>
                  </div>
                  <div className="ag-cols" aria-hidden="true">
                    {COLS.map((c, ci) => {
                      const list = TASKS.map((t, i) => ({ ...t, i })).filter((t) => pos[t.i] === ci);
                      return (
                        <div key={c} className="ag-col">
                          <div className="ag-ch"><span>{c}</span><span>{list.length}</span></div>
                          {list.map((t) => (
                            <div key={`${t.i}-${ci}`} className="ag-task">{t.n}<small className={t.c}>{t.t}</small></div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                  <div className="ag-chip-f a" aria-hidden="true"><span className="ic"><Icon name="timer" size={18} /></span><span>Pomodoro<small>25:00 em foco</small></span></div>
                  <div className="ag-chip-f b" aria-hidden="true"><span className="ic"><Icon name="chart" size={18} /></span><span>Concluídas<small>+12 esta semana</small></span></div>
                </div>
              </div>
            </div>
          </section>

          {/* MARQUEE */}
          <section className="ag-mq" aria-label="Tecnologias e recursos">
            <div className="ag-mq-t" aria-hidden="true">
              {[...TECH, ...TECH].map(([ic, t], i) => <span key={i} className="ag-mq-i"><Icon name={ic} size={16} />{t}</span>)}
            </div>
            <p className="sr-only">{TECH.map(([, t]) => t).join(', ')}</p>
          </section>

          {/* STATS */}
          <section className="ag-stats" aria-label="Em números">
            <div className="ag-wrap">
              <ul>
                {STATS.map((s, i) => (
                  <li key={s.l} className="ag-stat" data-r style={{ transitionDelay: `${i * 80}ms` }}>
                    <div className="ag-num"><Count to={s.n} suffix={s.s} /></div>
                    <p>{s.l}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* RECURSOS */}
          <section id="recursos" className="ag-sec" aria-labelledby="rec">
            <div className="ag-wrap">
              <header className="ag-head" data-r>
                <span className="ag-eye">Recursos</span>
                <h2 id="rec" className="ag-t">Tudo que sua operação precisa</h2>
                <p className="ag-st">Ferramentas pensadas para organizar o fluxo de trabalho e dar clareza à equipe.</p>
              </header>
              <div className="ag-bento">
                {FEATURES.map((f, i) => (
                  <div key={f.t} className={`ag-spot ag-f${f.w ? ' w' : ''}`} data-r style={{ transitionDelay: `${i * 60}ms` }}>
                    <div className="ag-fi"><Icon name={f.icon} /></div>
                    <h3 className="ag-ft">{f.t}</h3>
                    <p className="ag-fd">{f.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* COMO FUNCIONA */}
          <section id="como-funciona" className="ag-sec" style={{ background: 'var(--s1)' }} aria-labelledby="como">
            <div className="ag-wrap">
              <header className="ag-head" data-r>
                <span className="ag-eye">Como funciona</span>
                <h2 id="como" className="ag-t">Comece em 3 passos</h2>
                <p className="ag-st">Do cadastro ao primeiro quadro em poucos minutos.</p>
              </header>
              <div className="ag-steps">
                <div className="ag-line" data-r aria-hidden="true" />
                {PASSOS.map((p, i) => (
                  <div key={p.t} className="ag-spot ag-step" data-r style={{ transitionDelay: `${i * 120}ms` }}>
                    <div className="ag-fi"><Icon name={p.icon} /></div>
                    <div className="ag-sn" aria-hidden="true">PASSO 0{i + 1}</div>
                    <h3 className="ag-ft">{p.t}</h3>
                    <p className="ag-fd">{p.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ARQUITETURA */}
          <section id="arquitetura" className="ag-sec" aria-labelledby="arq">
            <div className="ag-wrap">
              <header className="ag-head" data-r>
                <span className="ag-eye">Arquitetura</span>
                <h2 id="arq" className="ag-t">Construído como um produto de verdade</h2>
                <p className="ag-st">Front-end moderno, API própria documentada e deploy em produção.</p>
              </header>
              <div className="ag-stack">
                {[
                  { icon: 'layers', t: 'Front-end', d: 'Interface responsiva e acessível, com componentes reutilizáveis e tipagem forte.', c: ['React', 'TypeScript', 'Vite'] },
                  { icon: 'api', t: 'API REST', d: 'Backend em C# com endpoints documentados e testáveis direto no navegador.', c: ['C#', 'REST', 'Swagger'] },
                  { icon: 'shield', t: 'Deploy', d: 'Front-end publicado na Vercel e API rodando em servidor próprio.', c: ['Vercel', 'HTTPS', 'DuckDNS'] },
                ].map((s, i) => (
                  <div key={s.t} className="ag-spot ag-sc" data-r style={{ transitionDelay: `${i * 80}ms` }}>
                    <div className="ag-fi"><Icon name={s.icon as IconName} /></div>
                    <h3>{s.t}</h3>
                    <p>{s.d}</p>
                    <div className="ag-chips">{s.c.map((c) => <span key={c} className="ag-chip">{c}</span>)}</div>
                  </div>
                ))}
              </div>
              <div className="ag-cta-row" data-r>
                <a href="#arquitetura" className="ag-btn ag-btn-p ag-btn-lg" data-mag>
                  <Icon name="api" size={18} /> Conhecer a arquitetura
                </a>
                <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className="ag-btn ag-btn-o ag-btn-lg" data-mag>
                  <Icon name="github" size={18} /> Código no GitHub<span className="sr-only"> (abre em nova aba)</span>
                </a>
              </div>
            </div>
          </section>

          {/* PREÇOS */}
          <section id="precos" className="ag-sec" style={{ background: 'var(--s1)' }} aria-labelledby="prc">
            <div className="ag-wrap">
              <header className="ag-head" data-r>
                <span className="ag-eye">Preços</span>
                <h2 id="prc" className="ag-t">Planos para todos os tamanhos</h2>
                <p className="ag-st">Comece grátis e evolua conforme sua operação cresce.</p>
              </header>
              <div className="ag-pr">
                {PLANOS.map((p, i) => (
                  <div key={p.n} className={`ag-spot ag-plan${p.ft ? ' ft' : ''}`} data-r style={{ transitionDelay: `${i * 80}ms` }}>
                    {p.ft && <span className="ag-pb">MAIS POPULAR</span>}
                    <h3 className="ag-pn">{p.n}</h3>
                    <div className="ag-pp"><span className="ag-pv">{p.p}</span><span className="ag-pd" style={{ margin: 0 }}>{p.per}</span></div>
                    <p className="ag-pd">{p.d}</p>
                    <ul className="ag-pl">
                      {p.f.map((f) => <li key={f}><span className="ag-ck"><Icon name="check" size={13} /></span>{f}</li>)}
                    </ul>
                    <Link to="/signup" className="ag-pc">{p.c}</Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="ag-sec" aria-labelledby="faq-t">
            <div className="ag-wrap">
              <header className="ag-head" data-r>
                <span className="ag-eye">Perguntas frequentes</span>
                <h2 id="faq-t" className="ag-t">Dúvidas? A gente responde</h2>
              </header>
              <div className="ag-faq" data-r>
                {FAQ.map((f, i) => <Faq key={f.q} i={i} q={f.q} a={f.a} />)}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="ag-final" aria-labelledby="cta">
            <div className="ag-wrap" data-r>
              <h2 id="cta">Pronto para organizar sua operação?</h2>
              <p>Crie sua conta em um minuto e monte seu primeiro quadro hoje.</p>
              <Link to="/signup" className="ag-btn ag-btn-p ag-btn-lg" data-mag>Criar conta gratuita <Icon name="arrow" size={18} /></Link>
              <p className="ag-note">Sem cartão de crédito · Cancele quando quiser</p>
            </div>
          </section>
        </main>

        <footer className="ag-foot">
          <div className="ag-fin">
            <div className="ag-fc">
              <div className="ag-logo"><img src="/favicon.svg" alt="" width={34} height={34} /><span><b>Ct</b>Operacional</span></div>
              <p className="ag-fdesc">Controle operacional e Kanban para equipes que precisam de clareza e velocidade.</p>
            </div>
            <nav className="ag-fc" aria-label="Produto">
              <h4 className="ag-fh">Produto</h4>
              <button type="button" className="ag-fl" onClick={() => go('recursos')}>Recursos</button>
              <button type="button" className="ag-fl" onClick={() => go('precos')}>Preços</button>
              <button type="button" className="ag-fl" onClick={() => go('faq')}>FAQ</button>
              <Link to="/login" className="ag-fl">Entrar</Link>
              <Link to="/signup" className="ag-fl">Criar conta</Link>
            </nav>
            <nav className="ag-fc" aria-label="Desenvolvedor">
              <h4 className="ag-fh">Desenvolvedor</h4>
              <a href="#arquitetura" className="ag-fl"><Icon name="api" size={16} />Arquitetura</a>
              <a href={LINKS.portfolio} target="_blank" rel="noopener noreferrer" className="ag-fl"><Icon name="globe" size={16} />Portfólio</a>
              <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className="ag-fl"><Icon name="github" size={16} />GitHub</a>
              <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="ag-fl"><Icon name="linkedin" size={16} />LinkedIn</a>
            </nav>
            <div className="ag-fc">
              <h4 className="ag-fh">Contato</h4>
              <a href={`mailto:${LINKS.email}`} className="ag-fl"><Icon name="mail" size={16} />{LINKS.email}</a>
            </div>
          </div>
          <div className="ag-fbm">
            <span>© {new Date().getFullYear()} CtOperacional. Todos os direitos reservados.</span>
            <span>Projeto de portfólio desenvolvido por Álvaro Velame</span>
          </div>
        </footer>
      </div>
    </>
  );
}

function Count({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [v, setV] = useState(reduced() ? to : 0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduced() || !ref.current || typeof IntersectionObserver === 'undefined') { setV(to); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - t0) / 1400, 1);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{v}{suffix}</span>;
}

function Faq({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`ag-fq${open ? ' open' : ''}`}>
      <h3 style={{ margin: 0 }}>
        <button type="button" className="ag-fb" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={`fa-${i}`} id={`fq-${i}`}>
          <span>{q}</span><span className="ag-fx" aria-hidden="true">+</span>
        </button>
      </h3>
      <div className="ag-fw" id={`fa-${i}`} role="region" aria-labelledby={`fq-${i}`}>
        <div><p>{a}</p></div>
      </div>
    </div>
  );
}
