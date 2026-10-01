import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/* ============================================================
   CSS global do componente
   ============================================================ */
const STYLES = `
.ag {
  --bg: #ffffff;
  --bg-soft: #f6faf7;
  --ink: #0b1a12;
  --ink-soft: #3d5648;       /* 7.87:1 no branco — AAA */
  --muted: #4f6a5b;          /* 5.91:1 no branco — AA  */
  --line: #e6efe9;
  --brand: #166534;          /* 7.55:1 no branco — AAA */
  --brand-2: #22c55e;
  --brand-3: #0f4a24;
  --radius: 16px;
  --shadow-sm: 0 1px 2px rgba(11,26,18,.06);
  --shadow-md: 0 10px 30px -12px rgba(11,26,18,.18);
  --shadow-lg: 0 30px 70px -25px rgba(11,26,18,.35);

  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: var(--ink);
  background: var(--bg);
  overflow-x: clip;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.55;
}
.ag *, .ag *::before, .ag *::after { box-sizing: border-box; }
.ag h1, .ag h2, .ag h3, .ag h4 { margin: 0; letter-spacing: -.02em; color: var(--ink); }
.ag p { margin: 0; }
.ag a { text-decoration: none; }
.ag a:not([class]) { color: inherit; }
.ag button { font-family: inherit; }

/* ---------- Acessibilidade: foco visível ---------- */
.ag a:focus-visible,
.ag button:focus-visible {
  outline: 3px solid var(--brand-2);
  outline-offset: 3px;
  border-radius: 8px;
}
/* Anel adaptado para fundos escuros/verdes */
.ag-btn-primary:focus-visible,
.ag-cta-primary:focus-visible,
.ag-final-btn:focus-visible,
.ag-plan-cta:focus-visible,
.ag-plan.featured .ag-plan-cta:focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: 3px;
  box-shadow: 0 0 0 6px rgba(22,101,52,.55);
}

/* ---------- Skip link ---------- */
.ag-skip {
  position: absolute;
  top: -100px;
  left: 12px;
  z-index: 9999;
  padding: 12px 18px;
  background: var(--brand);
  color: #fff !important;
  font-weight: 600;
  font-size: 14px;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 10px 24px -10px rgba(0,0,0,.35);
  transition: top .18s ease;
}
.ag-skip:focus { top: 0; outline: 3px solid #fff; outline-offset: 2px; }

/* Offset para âncoras — evita sobreposição com a navbar fixa */
.ag [id] { scroll-margin-top: 96px; }

/* ---------- Reveal on scroll ---------- */
.ag [data-reveal] {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1);
}
.ag [data-reveal].is-visible { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .ag [data-reveal] { opacity: 1; transform: none; transition: none; }
  .ag-mock-bar-fill { animation: none !important; }
  .ag-drawer { animation: none !important; }
  .ag-faq-a { animation: none !important; }
  .ag * { scroll-behavior: auto !important; }
}

/* ---------- Layout helpers ---------- */
.ag-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

/* ---------- Navbar ---------- */
.ag-nav {
  position: fixed; inset: 0 0 auto 0; z-index: 100;
  transition: background .25s ease, border-color .25s ease, box-shadow .25s ease;
  background: rgba(255,255,255,.72);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid transparent;
}
.ag-nav.is-scrolled {
  background: rgba(255,255,255,.94);
  border-bottom-color: var(--line);
  box-shadow: 0 1px 0 rgba(11,26,18,.02), 0 8px 24px -16px rgba(11,26,18,.15);
}
.ag-nav-inner {
  max-width: 1200px; margin: 0 auto;
  padding: 14px 24px;
  display: flex; align-items: center; justify-content: space-between; gap: 24px;
}
.ag-logo {
  display: inline-flex; align-items: center; gap: 10px;
  color: var(--brand); font-weight: 700; font-size: 17px; letter-spacing: -.02em;
  flex-shrink: 0;
}
.ag-logo-mark {
  width: 34px; height: 34px; border-radius: 10px;
  display: grid; place-items: center; font-size: 18px;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  box-shadow: inset 0 0 0 1px rgba(22,101,52,.08);
}
.ag-nav-links { display: flex; gap: 4px; align-items: center; }
.ag-nav-link {
  background: transparent; border: 0; padding: 8px 14px;
  font-size: 14px; font-weight: 500; color: var(--ink-soft);
  border-radius: 8px; cursor: pointer; transition: color .2s, background .2s;
}
.ag-nav-link:hover { color: var(--brand); background: var(--bg-soft); }
.ag-nav-actions { display: flex; gap: 8px; align-items: center; }
.ag-btn-ghost {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 9px 16px; font-size: 14px; font-weight: 600;
  color: var(--brand); border-radius: 10px;
  transition: background .2s;
}
.ag-btn-ghost:hover { background: var(--bg-soft); }
.ag-btn-primary {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 9px 18px; font-size: 14px; font-weight: 600;
  background: var(--brand); color: #fff; border-radius: 10px;
  box-shadow: 0 6px 16px -8px rgba(22,101,52,.55);
  transition: transform .15s ease, box-shadow .2s ease, background .2s;
}
.ag-btn-primary:hover { transform: translateY(-1px); background: var(--brand-3); box-shadow: 0 10px 22px -10px rgba(22,101,52,.7); }
.ag-burger {
  display: none; width: 40px; height: 40px;
  background: transparent; border: 1px solid var(--line); border-radius: 10px;
  color: var(--brand); cursor: pointer; font-size: 18px;
  align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* ---------- Drawer mobile ---------- */
.ag-drawer {
  display: none;
  background: #fff; border-top: 1px solid var(--line);
  padding: 8px 0 20px;
  animation: agDrop .25s ease;
}
@keyframes agDrop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.ag-drawer-link {
  display: flex; width: 100%; text-align: left;
  background: transparent; border: 0; cursor: pointer;
  padding: 14px 24px; font-size: 15px; font-weight: 500; color: var(--ink-soft);
  transition: background .2s, color .2s;
}
.ag-drawer-link:hover { background: var(--bg-soft); color: var(--brand); }
.ag-drawer-actions { display: flex; gap: 10px; padding: 12px 24px 0; }
.ag-drawer-actions > * { flex: 1 1 0; min-width: 0; }

@media (max-width: 900px) {
  .ag-nav-links, .ag-nav-actions { display: none; }
  .ag-burger { display: inline-flex; }
  .ag-drawer { display: block; }
}

/* ---------- Hero ---------- */
.ag-hero {
  position: relative;
  padding: 132px 0 96px;
  background:
    radial-gradient(1200px 600px at 80% -10%, rgba(34,197,94,.12), transparent 60%),
    radial-gradient(900px 500px at -10% 10%, rgba(22,101,52,.08), transparent 55%),
    linear-gradient(180deg, #f6faf7 0%, #ffffff 100%);
  overflow: hidden;
}
.ag-hero-inner {
  max-width: 1200px; margin: 0 auto; padding: 0 24px;
  display: grid; grid-template-columns: 1.05fr .95fr; gap: 64px; align-items: center;
}
.ag-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: #fff; color: var(--brand);
  border: 1px solid var(--line);
  padding: 6px 14px; border-radius: 999px;
  font-size: 12px; font-weight: 600;
  box-shadow: var(--shadow-sm);
  margin-bottom: 22px;
}
.ag-badge-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--brand-2);
  box-shadow: 0 0 0 3px rgba(34,197,94,.2);
}
.ag-hero-title {
  font-size: clamp(34px, 5vw, 56px);
  font-weight: 800; line-height: 1.06;
  letter-spacing: -.035em; margin-bottom: 20px;
}
.ag-hero-title em {
  font-style: normal;
  background: linear-gradient(120deg, var(--brand) 0%, var(--brand-2) 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.ag-hero-sub {
  font-size: 17px; line-height: 1.65; color: var(--ink-soft);
  max-width: 520px; margin-bottom: 32px;
}
.ag-hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 28px; }
.ag-cta {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 24px; border-radius: 12px;
  font-size: 15px; font-weight: 600;
  transition: transform .15s ease, box-shadow .2s ease, background .2s ease, border-color .2s;
  white-space: nowrap;
}
.ag-cta-primary {
  background: var(--brand); color: #fff;
  box-shadow: 0 12px 28px -12px rgba(22,101,52,.6);
}
.ag-cta-primary:hover { transform: translateY(-2px); background: var(--brand-3); box-shadow: 0 18px 36px -14px rgba(22,101,52,.7); }
.ag-cta-ghost {
  background: #fff; color: var(--brand);
  border: 1px solid var(--line);
  cursor: pointer;
}
.ag-cta-ghost:hover { border-color: var(--brand); background: var(--bg-soft); }
.ag-trust { display: flex; flex-wrap: wrap; gap: 8px 20px; }
.ag-trust-item { font-size: 13px; color: var(--muted); display: inline-flex; align-items: center; gap: 6px; font-weight: 500; }
.ag-trust-item::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--brand-2); }

/* Hero visual */
.ag-hero-visual { position: relative; min-width: 0; }
.ag-mock {
  position: relative; z-index: 2;
  background: #fff; border-radius: 18px;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.ag-mock-head {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 16px; background: #f8faf9; border-bottom: 1px solid var(--line);
}
.ag-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.ag-mock-url {
  margin-left: 12px; font-size: 11px; color: var(--ink-soft);
  background: #fff; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--line);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  min-width: 0;
}
.ag-mock-body { padding: 20px; }
.ag-mock-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
.ag-mini {
  background: linear-gradient(180deg, #f9fdfa, #f4faf5);
  border: 1px solid var(--line);
  border-radius: 12px; padding: 12px 8px;
  text-align: center;
  min-width: 0;
}
.ag-mini-icon { font-size: 15px; margin-bottom: 4px; }
.ag-mini-label { font-size: 10px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: .06em; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ag-mini-value { font-size: 16px; font-weight: 700; color: var(--brand); margin-top: 2px; white-space: nowrap; }
.ag-mock-row { display: grid; grid-template-columns: 76px 1fr 48px; gap: 10px; align-items: center; padding: 6px 0; }
.ag-mock-row-label { font-size: 12px; font-weight: 600; color: var(--ink-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ag-mock-bar { height: 8px; background: #eef4ee; border-radius: 999px; overflow: hidden; }
.ag-mock-bar-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, var(--brand), var(--brand-2));
  animation: agGrow 1.2s cubic-bezier(.2,.7,.2,1) both;
}
@keyframes agGrow { from { transform: scaleX(0); transform-origin: left; } to { transform: scaleX(1); } }
.ag-mock-row-value { font-size: 12px; color: var(--ink-soft); text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ag-blob {
  position: absolute; border-radius: 50%;
  filter: blur(50px); opacity: .35; z-index: 1;
  pointer-events: none;
}

@media (max-width: 960px) {
  .ag-hero { padding: 108px 0 72px; }
  .ag-hero-inner { grid-template-columns: 1fr; gap: 48px; }
  .ag-hero-text { max-width: 640px; }
}
@media (max-width: 640px) {
  .ag-blob { display: none; }
}
@media (max-width: 480px) {
  .ag-mock-body { padding: 16px; }
  .ag-mock-row { grid-template-columns: 64px 1fr 44px; gap: 8px; }
  .ag-mock-stats { gap: 6px; }
  .ag-mini { padding: 10px 4px; }
  .ag-mini-value { font-size: 13px; }
  .ag-mini-label { font-size: 9px; }
  .ag-hero-actions { flex-direction: column; align-items: stretch; }
  .ag-cta { justify-content: center; }
}

/* ---------- Stats ---------- */
.ag-stats {
  background: linear-gradient(135deg, var(--brand-3) 0%, var(--brand) 100%);
  padding: 56px 24px; color: #fff;
  position: relative; overflow: hidden;
}
.ag-stats::before {
  content: ""; position: absolute; inset: 0;
  background: radial-gradient(600px 200px at 20% 0%, rgba(255,255,255,.08), transparent 60%);
  pointer-events: none;
}
.ag-stats-inner {
  max-width: 1100px; margin: 0 auto; position: relative;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; text-align: center;
}
.ag-stat-num { font-size: clamp(26px, 3.4vw, 38px); font-weight: 800; letter-spacing: -.03em; line-height: 1; color: #fff; }
.ag-stat-label { font-size: 13px; color: #d1fae5; margin-top: 10px; font-weight: 500; }
@media (max-width: 720px) {
  .ag-stats-inner { grid-template-columns: repeat(2, 1fr); gap: 32px 20px; }
}

/* ---------- Sections ---------- */
.ag-section { padding: 104px 0; }
.ag-section.soft { background: var(--bg-soft); }
.ag-section-head { text-align: center; max-width: 660px; margin: 0 auto 64px; }
.ag-eyebrow {
  display: inline-block; font-size: 12px; font-weight: 700;
  letter-spacing: .16em; color: var(--brand); text-transform: uppercase;
  margin-bottom: 14px;
}
.ag-title {
  font-size: clamp(28px, 3.6vw, 40px);
  font-weight: 800; line-height: 1.1; letter-spacing: -.03em;
  margin-bottom: 14px;
}
.ag-subtitle { font-size: 16px; color: var(--muted); line-height: 1.65; }
@media (max-width: 640px) { .ag-section { padding: 76px 0; } .ag-section-head { margin-bottom: 44px; } }

/* ---------- Features ---------- */
.ag-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.ag-card {
  background: #fff; border: 1px solid var(--line); border-radius: var(--radius);
  padding: 28px 24px;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
}
.ag-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: #cfe3d5; }
.ag-feature-icon {
  width: 48px; height: 48px; border-radius: 12px;
  display: grid; place-items: center; font-size: 22px;
  background: linear-gradient(135deg, #ecfdf3, #dcfce7);
  border: 1px solid #d7efe0;
  margin-bottom: 18px;
}
.ag-feature-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.ag-feature-desc { font-size: 14px; color: var(--muted); line-height: 1.65; }
@media (max-width: 960px) { .ag-features { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .ag-features { grid-template-columns: 1fr; } }

/* ---------- Steps ---------- */
.ag-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; position: relative; }
.ag-step { position: relative; text-align: center; padding: 0 12px; }
.ag-step-num { font-size: 12px; font-weight: 800; color: var(--brand); letter-spacing: .2em; margin-bottom: 14px; }
.ag-step-icon {
  width: 76px; height: 76px; margin: 0 auto 20px;
  border-radius: 50%; background: #fff;
  display: grid; place-items: center; font-size: 30px;
  border: 1px solid var(--line);
  box-shadow: 0 12px 24px -14px rgba(22,101,52,.35);
}
.ag-step-title { font-size: 17px; font-weight: 700; margin-bottom: 8px; }
.ag-step-desc { font-size: 14px; color: var(--muted); line-height: 1.65; max-width: 280px; margin: 0 auto; }
.ag-step-arrow {
  position: absolute; top: 44px; right: -18px;
  font-size: 20px; color: #9dbfa8; user-select: none;
}
@media (max-width: 900px) {
  .ag-steps { grid-template-columns: 1fr; gap: 40px; }
  .ag-step-arrow { display: none; }
}

/* ---------- Testimonials ---------- */
.ag-tests { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.ag-test {
  background: #fff; border: 1px solid var(--line); border-radius: var(--radius);
  padding: 28px 24px;
  display: flex; flex-direction: column; gap: 16px;
  transition: transform .25s, box-shadow .25s;
}
.ag-test:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
.ag-stars { color: #b45309; letter-spacing: 3px; font-size: 15px; font-weight: 700; }
.ag-test-text { font-size: 15px; color: var(--ink-soft); line-height: 1.65; flex: 1; }
.ag-test-author { display: flex; align-items: center; gap: 12px; }
.ag-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  display: grid; place-items: center; color: #fff;
  font-weight: 700; font-size: 13px;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  flex-shrink: 0;
}
.ag-author-name { font-size: 14px; font-weight: 700; }
.ag-author-role { font-size: 12px; color: var(--muted); }
@media (max-width: 960px) { .ag-tests { grid-template-columns: 1fr; } }

/* ---------- Pricing ---------- */
.ag-pricing { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; align-items: stretch; padding-top: 12px; }
.ag-plan {
  background: #fff; border: 1px solid var(--line); border-radius: 20px;
  padding: 32px 28px; display: flex; flex-direction: column;
  position: relative; transition: transform .25s, box-shadow .25s;
}
.ag-plan:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
.ag-plan.featured {
  border-color: var(--brand);
  box-shadow: 0 24px 60px -25px rgba(22,101,52,.4);
  background: linear-gradient(180deg, #ffffff 0%, #f8fdf9 100%);
}
.ag-plan-badge {
  position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
  background: var(--brand); color: #fff;
  font-size: 10px; font-weight: 700; letter-spacing: .12em;
  padding: 5px 12px; border-radius: 999px;
  box-shadow: 0 8px 20px -8px rgba(22,101,52,.7);
  white-space: nowrap;
}
.ag-plan-name { font-size: 16px; font-weight: 700; color: var(--ink-soft); }
.ag-plan-price { display: flex; align-items: baseline; gap: 6px; margin: 12px 0 6px; flex-wrap: wrap; }
.ag-plan-value { font-size: 40px; font-weight: 800; letter-spacing: -.04em; color: var(--ink); }
.ag-plan-period { font-size: 14px; color: var(--muted); }
.ag-plan-desc { font-size: 13px; color: var(--muted); margin-bottom: 24px; }
.ag-plan-feats { list-style: none; padding: 0; margin: 0 0 26px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
.ag-plan-feat { font-size: 14px; color: var(--ink-soft); display: flex; align-items: center; gap: 10px; }
.ag-check {
  width: 18px; height: 18px; border-radius: 50%;
  display: inline-grid; place-items: center;
  background: #dcfce7; color: var(--brand);
  font-size: 10px; font-weight: 800; flex-shrink: 0;
}
.ag-plan-cta {
  display: block; text-align: center;
  padding: 12px 20px; border-radius: 12px;
  font-size: 14px; font-weight: 600;
  border: 1.5px solid var(--brand); color: var(--brand);
  transition: background .2s, color .2s, transform .15s;
}
.ag-plan-cta:hover { background: var(--brand); color: #fff; transform: translateY(-1px); }
.ag-plan.featured .ag-plan-cta { background: var(--brand); color: #fff; }
.ag-plan.featured .ag-plan-cta:hover { background: var(--brand-3); border-color: var(--brand-3); }
@media (max-width: 960px) {
  .ag-pricing { grid-template-columns: 1fr; max-width: 460px; margin: 0 auto; gap: 32px; }
}

/* ---------- FAQ ---------- */
.ag-faq { max-width: 760px; margin: 0 auto; }
.ag-faq-item { border-bottom: 1px solid var(--line); }
.ag-faq-btn {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  gap: 16px; padding: 20px 4px;
  background: transparent; border: 0; cursor: pointer;
  text-align: left; color: var(--ink);
}
.ag-faq-q { font-size: 16px; font-weight: 600; }
.ag-faq-ic {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  display: grid; place-items: center;
  background: var(--bg-soft); color: var(--brand);
  font-size: 16px; font-weight: 600; line-height: 1;
  transition: transform .25s ease, background .2s;
}
.ag-faq-item.open .ag-faq-ic { transform: rotate(45deg); background: #dcfce7; }
.ag-faq-a {
  font-size: 14px; color: var(--ink-soft); line-height: 1.75;
  padding: 0 4px 22px; animation: agFade .3s ease;
}
@keyframes agFade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

/* ---------- CTA Final ----------
   Especificidade .ag .ag-final-* para vencer .ag h2 / .ag p
*/
.ag-final {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, var(--brand-3) 0%, var(--brand) 100%);
  color: #fff; padding: 96px 24px; text-align: center;
}
.ag-final::before {
  content: ""; position: absolute; inset: 0;
  background: radial-gradient(700px 300px at 50% 0%, rgba(255,255,255,.12), transparent 60%);
  pointer-events: none;
}
.ag-final-inner { max-width: 720px; margin: 0 auto; position: relative; }
.ag .ag-final-title {
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 800; letter-spacing: -.03em; line-height: 1.1;
  margin: 0 0 16px;
  color: #ffffff;
}
.ag .ag-final-sub {
  font-size: 17px; line-height: 1.65;
  color: #ecfdf3;
  margin: 0 0 34px;
}
.ag .ag-final-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 16px 32px; border-radius: 12px;
  background: #ffffff; color: var(--brand);
  font-size: 16px; font-weight: 700;
  box-shadow: 0 20px 40px -18px rgba(0,0,0,.5);
  transition: transform .15s ease, box-shadow .2s ease;
}
.ag .ag-final-btn:hover { transform: translateY(-2px); box-shadow: 0 24px 44px -18px rgba(0,0,0,.6); }
.ag .ag-final-note {
  font-size: 13px;
  color: #d1fae5;
  margin: 16px 0 0;
}

/* ---------- Footer ---------- */
.ag-footer { background: #0a1710; color: #d7e3da; padding: 64px 24px 28px; }
.ag-footer-inner {
  max-width: 1200px; margin: 0 auto;
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px;
  padding-bottom: 44px;
}
.ag-footer-col { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.ag-footer-title {
  font-size: 12px; font-weight: 700; color: #ffffff;
  text-transform: uppercase; letter-spacing: .14em; margin-bottom: 6px;
}
.ag-footer-desc { font-size: 13px; line-height: 1.7; color: #c2d0c6; margin-top: 8px; max-width: 320px; }
.ag-footer-link {
  font-size: 13px; color: #d7e3da;
  background: transparent; border: 0; padding: 0; text-align: left;
  cursor: pointer; font-family: inherit;
  transition: color .2s;
  width: fit-content;
}
.ag-footer-link:hover { color: #ffffff; text-decoration: underline; }
.ag-footer-bottom {
  max-width: 1200px; margin: 0 auto;
  padding-top: 24px; border-top: 1px solid rgba(255,255,255,.12);
  display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  font-size: 12px; color: #b9c9bd;
}
.ag-logo.on-dark { color: #ffffff; }
.ag-logo.on-dark .ag-logo-mark { background: rgba(34,197,94,.15); box-shadow: inset 0 0 0 1px rgba(34,197,94,.3); }

@media (max-width: 860px) {
  .ag-footer-inner { grid-template-columns: 1fr 1fr; gap: 32px; }
  .ag-footer-col:first-child { grid-column: 1 / -1; }
}
@media (max-width: 520px) {
  .ag-footer-inner { grid-template-columns: 1fr; gap: 28px; }
}
`;

/* ============================================================
   Componente
   ============================================================ */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Trava o scroll do body enquanto o menu mobile estiver aberto
  useEffect(() => {
    if (!menuAberto) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [menuAberto]);

  // Reveal-on-scroll robusto
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.ag [data-reveal]'));
    const reveal = (el: Element) => el.classList.add('is-visible');

    els.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) reveal(el);
    });

    if (typeof IntersectionObserver === 'undefined') {
      els.forEach(reveal);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -8% 0px' }
    );

    els.forEach((el) => {
      if (!el.classList.contains('is-visible')) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // Fecha o menu ANTES de rolar — libera o overflow do body primeiro
  const scrollPara = (id: string) => {
    setMenuAberto(false);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="ag" data-scrolled={scrolled ? 'true' : 'false'}>
        {/* Skip link — primeiro elemento focável */}
        <a href="#ag-main" className="ag-skip">Ir para o conteúdo principal</a>

        {/* ===================== NAVBAR ===================== */}
        <header className={`ag-nav${scrolled ? ' is-scrolled' : ''}`} role="banner">
          <div className="ag-nav-inner">
            <Link to="/" className="ag-logo" onClick={() => setMenuAberto(false)} aria-label="AgroGestor — início">
              <span className="ag-logo-mark" aria-hidden="true">🐄</span>
              <span>AgroGestor</span>
            </Link>

            <nav className="ag-nav-links" aria-label="Principal">
              <button type="button" className="ag-nav-link" onClick={() => scrollPara('features')}>Recursos</button>
              <button type="button" className="ag-nav-link" onClick={() => scrollPara('como-funciona')}>Como funciona</button>
              <button type="button" className="ag-nav-link" onClick={() => scrollPara('precos')}>Preços</button>
              <button type="button" className="ag-nav-link" onClick={() => scrollPara('faq')}>FAQ</button>
            </nav>

            <div className="ag-nav-actions">
              <Link to="/login" className="ag-btn-ghost">Entrar</Link>
              <Link to="/signup" className="ag-btn-primary">Criar conta</Link>
            </div>

            <button
              type="button"
              className="ag-burger"
              onClick={() => setMenuAberto((v) => !v)}
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuAberto}
              aria-controls="ag-menu-mobile"
            >
              <span aria-hidden="true">{menuAberto ? '✕' : '☰'}</span>
            </button>
          </div>

          {menuAberto && (
            <div className="ag-drawer" id="ag-menu-mobile">
              <button type="button" className="ag-drawer-link" onClick={() => scrollPara('features')}>Recursos</button>
              <button type="button" className="ag-drawer-link" onClick={() => scrollPara('como-funciona')}>Como funciona</button>
              <button type="button" className="ag-drawer-link" onClick={() => scrollPara('precos')}>Preços</button>
              <button type="button" className="ag-drawer-link" onClick={() => scrollPara('faq')}>FAQ</button>
              <div className="ag-drawer-actions">
                <Link to="/login" className="ag-btn-ghost" onClick={() => setMenuAberto(false)}>Entrar</Link>
                <Link to="/signup" className="ag-btn-primary" onClick={() => setMenuAberto(false)}>Criar conta</Link>
              </div>
            </div>
          )}
        </header>

        <main id="ag-main">
          {/* ===================== HERO ===================== */}
          <section className="ag-hero">
            <div className="ag-hero-inner">
              <div className="ag-hero-text" data-reveal>
                <span className="ag-badge">
                  <span className="ag-badge-dot" aria-hidden="true" />
                  Novo — versão 2.0 disponível
                </span>

                <h1 className="ag-hero-title">
                  Gestão do seu rebanho,
                  <br />
                  <em>simples como deve ser.</em>
                </h1>

                <p className="ag-hero-sub">
                  Controle produção, categorias e relatórios do seu rebanho em uma
                  plataforma moderna. Sem planilhas, sem complicação — feito para o
                  produtor rural.
                </p>

                <div className="ag-hero-actions">
                  <Link to="/signup" className="ag-cta ag-cta-primary">
                    Começar grátis <span aria-hidden="true">→</span>
                  </Link>
                  <button type="button" className="ag-cta ag-cta-ghost" onClick={() => scrollPara('como-funciona')}>
                    <span aria-hidden="true">▶</span> Ver como funciona
                  </button>
                </div>

                <div className="ag-trust">
                  <span className="ag-trust-item">Sem cartão de crédito</span>
                  <span className="ag-trust-item">Configuração em 1 minuto</span>
                  <span className="ag-trust-item">Dados na nuvem</span>
                </div>
              </div>

              <div className="ag-hero-visual" data-reveal aria-hidden="true">
                <div className="ag-blob" style={{ width: 260, height: 260, top: -60, right: -60, background: '#4ade80' }} />
                <div className="ag-blob" style={{ width: 220, height: 220, bottom: -50, left: -50, background: '#166534' }} />

                <div className="ag-mock">
                  <div className="ag-mock-head">
                    <span className="ag-dot" style={{ background: '#ff5f56' }} />
                    <span className="ag-dot" style={{ background: '#ffbd2e' }} />
                    <span className="ag-dot" style={{ background: '#27c93f' }} />
                    <span className="ag-mock-url">agrogestor.app/dashboard</span>
                  </div>

                  <div className="ag-mock-body">
                    <div className="ag-mock-stats">
                      <MiniStat icon="🐮" label="Animais" value="128" />
                      <MiniStat icon="🥛" label="Produção" value="2.4k L" />
                      <MiniStat icon="📊" label="Média" value="18.7 L" />
                    </div>

                    {[
                      { nome: 'Mimosa', valor: 24, pct: 100 },
                      { nome: 'Estrela', valor: 20, pct: 83 },
                      { nome: 'Lua', valor: 16, pct: 66 },
                      { nome: 'Princesa', valor: 12, pct: 50 },
                    ].map((a, i) => (
                      <div key={a.nome} className="ag-mock-row">
                        <span className="ag-mock-row-label">{a.nome}</span>
                        <div className="ag-mock-bar">
                          <div
                            className="ag-mock-bar-fill"
                            style={{ width: `${a.pct}%`, animationDelay: `${i * 0.1 + 0.3}s` }}
                          />
                        </div>
                        <span className="ag-mock-row-value">{a.valor} L</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===================== STATS ===================== */}
          <section className="ag-stats" aria-label="Números da plataforma">
            <div className="ag-stats-inner">
              <StatItem numero="12k+" label="Animais gerenciados" />
              <StatItem numero="850+" label="Produtores ativos" />
              <StatItem numero="3.2M" label="Litros registrados" />
              <StatItem numero="99.9%" label="Uptime garantido" />
            </div>
          </section>

          {/* ===================== FEATURES ===================== */}
          <section id="features" className="ag-section" aria-labelledby="features-title">
            <div className="ag-container">
              <header className="ag-section-head" data-reveal>
                <span className="ag-eyebrow">Recursos</span>
                <h2 id="features-title" className="ag-title">Tudo que você precisa, em um só lugar</h2>
                <p className="ag-subtitle">
                  Ferramentas pensadas para simplificar a rotina do produtor e
                  aumentar a produtividade do rebanho.
                </p>
              </header>

              <div className="ag-features">
                {[
                  { icon: '🐄', titulo: 'Cadastro inteligente', desc: 'Registre animais com brinco, nome, categoria e produção em segundos.' },
                  { icon: '📊', titulo: 'Dashboards em tempo real', desc: 'Visualize KPIs, médias e rankings de produção instantaneamente.' },
                  { icon: '🔍', titulo: 'Busca avançada', desc: 'Encontre qualquer animal por nome, brinco ou categoria com um clique.' },
                  { icon: '📈', titulo: 'Relatórios completos', desc: 'Gere relatórios detalhados e exporte em JSON para backup.' },
                  { icon: '🌙', titulo: 'Tema claro e escuro', desc: 'Trabalhe confortavelmente de dia ou de madrugada, você escolhe.' },
                  { icon: '⚡', titulo: 'Atalhos de teclado', desc: 'Command palette (Ctrl+K) para navegar e executar ações em milissegundos.' },
                ].map((f, i) => (
                  <div key={f.titulo} className="ag-card" data-reveal style={{ transitionDelay: `${i * 40}ms` }}>
                    <div className="ag-feature-icon" aria-hidden="true">{f.icon}</div>
                    <h3 className="ag-feature-title">{f.titulo}</h3>
                    <p className="ag-feature-desc">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===================== COMO FUNCIONA ===================== */}
          <section id="como-funciona" className="ag-section soft" aria-labelledby="como-title">
            <div className="ag-container">
              <header className="ag-section-head" data-reveal>
                <span className="ag-eyebrow">Como funciona</span>
                <h2 id="como-title" className="ag-title">Comece em 3 passos simples</h2>
                <p className="ag-subtitle">Do cadastro ao primeiro relatório em menos de 5 minutos.</p>
              </header>

              <div className="ag-steps">
                {[
                  { num: '01', icon: '📝', titulo: 'Crie sua conta', desc: 'Cadastro gratuito, sem cartão de crédito. Confirme o e-mail e pronto.' },
                  { num: '02', icon: '🐮', titulo: 'Cadastre seus animais', desc: 'Adicione brinco, nome, categoria e produção diária de cada animal.' },
                  { num: '03', icon: '📈', titulo: 'Acompanhe os resultados', desc: 'Veja dashboards, gráficos e relatórios atualizados em tempo real.' },
                ].map((p, i) => (
                  <div key={p.num} className="ag-step" data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
                    <div className="ag-step-num" aria-hidden="true">{p.num}</div>
                    <div className="ag-step-icon" aria-hidden="true">{p.icon}</div>
                    <h3 className="ag-step-title">{p.titulo}</h3>
                    <p className="ag-step-desc">{p.desc}</p>
                    {i < 2 && <div className="ag-step-arrow" aria-hidden="true">→</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===================== DEPOIMENTOS ===================== */}
          <section className="ag-section" aria-labelledby="depoimentos-title">
            <div className="ag-container">
              <header className="ag-section-head" data-reveal>
                <span className="ag-eyebrow">Depoimentos</span>
                <h2 id="depoimentos-title" className="ag-title">Quem usa, recomenda</h2>
                <p className="ag-subtitle">
                  Produtores de todo o Brasil já transformaram sua gestão com o AgroGestor.
                </p>
              </header>

              <div className="ag-tests">
                {[
                  { nome: 'João Pereira', cargo: 'Fazenda Santa Rita · MG', texto: 'Reduzi o tempo gasto com anotações em 80%. Agora tudo está no celular.', iniciais: 'JP' },
                  { nome: 'Maria Oliveira', cargo: 'Sítio Boa Vista · PR', texto: 'A busca é fantástica. Acho qualquer vaca pelo brinco em segundos.', iniciais: 'MO' },
                  { nome: 'Carlos Souza', cargo: 'Fazenda Lagoa Azul · GO', texto: 'Os relatórios me ajudaram a aumentar a produção em 15% em 6 meses.', iniciais: 'CS' },
                ].map((t, i) => (
                  <figure key={t.nome} className="ag-test" data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
                    <div className="ag-stars" aria-label="Avaliação: 5 de 5 estrelas">
                      <span aria-hidden="true">★★★★★</span>
                    </div>
                    <blockquote className="ag-test-text" style={{ margin: 0 }}>
                      “{t.texto}”
                    </blockquote>
                    <figcaption className="ag-test-author">
                      <div className="ag-avatar" aria-hidden="true">{t.iniciais}</div>
                      <div>
                        <div className="ag-author-name">{t.nome}</div>
                        <div className="ag-author-role">{t.cargo}</div>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>

          {/* ===================== PREÇOS ===================== */}
          <section id="precos" className="ag-section soft" aria-labelledby="precos-title">
            <div className="ag-container">
              <header className="ag-section-head" data-reveal>
                <span className="ag-eyebrow">Preços</span>
                <h2 id="precos-title" className="ag-title">Planos para todos os tamanhos</h2>
                <p className="ag-subtitle">
                  Comece grátis e evolua conforme seu rebanho cresce. Sem surpresas.
                </p>
              </header>

              <div className="ag-pricing">
                {[
                  {
                    nome: 'Grátis', preco: 'R$ 0', periodo: '/ sempre',
                    desc: 'Ideal para pequenos produtores',
                    features: ['Até 30 animais', 'Dashboard básico', 'Relatórios essenciais', 'Suporte por e-mail'],
                    cta: 'Começar grátis', destaque: false,
                  },
                  {
                    nome: 'Pro', preco: 'R$ 29', periodo: '/ mês',
                    desc: 'Para quem quer produtividade máxima',
                    features: ['Animais ilimitados', 'Gráficos avançados', 'Backup automático', 'Tema escuro', 'Suporte prioritário'],
                    cta: 'Assinar Pro', destaque: true,
                  },
                  {
                    nome: 'Empresa', preco: 'R$ 99', periodo: '/ mês',
                    desc: 'Multi-fazendas e equipes',
                    features: ['Tudo do Pro', 'Multi-usuários', 'API de integração', 'Relatórios personalizados', 'Gerente de conta'],
                    cta: 'Falar com vendas', destaque: false,
                  },
                ].map((p, i) => (
                  <div
                    key={p.nome}
                    className={`ag-plan${p.destaque ? ' featured' : ''}`}
                    data-reveal
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    {p.destaque && <span className="ag-plan-badge">MAIS POPULAR</span>}
                    <h3 className="ag-plan-name">{p.nome}</h3>
                    <div className="ag-plan-price">
                      <span className="ag-plan-value">{p.preco}</span>
                      <span className="ag-plan-period">{p.periodo}</span>
                    </div>
                    <p className="ag-plan-desc">{p.desc}</p>
                    <ul className="ag-plan-feats">
                      {p.features.map((f) => (
                        <li key={f} className="ag-plan-feat">
                          <span className="ag-check" aria-hidden="true">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <Link to="/signup" className="ag-plan-cta">{p.cta}</Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===================== FAQ ===================== */}
          <section id="faq" className="ag-section" aria-labelledby="faq-title">
            <div className="ag-container">
              <header className="ag-section-head" data-reveal>
                <span className="ag-eyebrow">Perguntas frequentes</span>
                <h2 id="faq-title" className="ag-title">Dúvidas? A gente responde</h2>
              </header>

              <div className="ag-faq" data-reveal>
                {[
                  { q: 'Preciso instalar algo?', a: 'Não! O AgroGestor é 100% web. Basta acessar pelo navegador do computador, tablet ou celular.' },
                  { q: 'Meus dados ficam seguros?', a: 'Sim. Todos os dados são salvos automaticamente e você pode exportar um backup em JSON quando quiser.' },
                  { q: 'Posso usar de graça para sempre?', a: 'Sim! O plano Grátis permite até 30 animais sem custo e sem prazo de expiração.' },
                  { q: 'Funciona offline?', a: 'A plataforma precisa de internet para sincronizar. Mas os dados ficam em cache local para consulta rápida.' },
                  { q: 'Como cancelo minha assinatura?', a: 'A qualquer momento, direto no painel, sem burocracia e sem multa. Você continua com o plano Grátis.' },
                ].map((item, i) => (
                  <FaqItem key={i} pergunta={item.q} resposta={item.a} />
                ))}
              </div>
            </div>
          </section>

          {/* ===================== CTA FINAL ===================== */}
          <section className="ag-final" aria-labelledby="cta-final-title">
            <div className="ag-final-inner" data-reveal>
              <h2 id="cta-final-title" className="ag-final-title">Pronto para transformar sua gestão?</h2>
              <p className="ag-final-sub">
                Junte-se a centenas de produtores que já modernizaram sua fazenda.
                Comece grátis hoje.
              </p>
              <Link to="/signup" className="ag-final-btn">
                Criar conta gratuita <span aria-hidden="true">→</span>
              </Link>
              <p className="ag-final-note">Sem cartão de crédito · Cancele quando quiser</p>
            </div>
          </section>
        </main>

        {/* ===================== FOOTER ===================== */}
        <footer className="ag-footer" role="contentinfo">
          <div className="ag-footer-inner">
            <div className="ag-footer-col">
              <div className="ag-logo on-dark">
                <span className="ag-logo-mark" aria-hidden="true">🐄</span>
                <span>AgroGestor</span>
              </div>
              <p className="ag-footer-desc">
                Gestão inteligente do rebanho para o produtor rural moderno.
              </p>
            </div>

            <nav className="ag-footer-col" aria-label="Produto">
              <h4 className="ag-footer-title">Produto</h4>
              <button type="button" className="ag-footer-link" onClick={() => scrollPara('features')}>Recursos</button>
              <button type="button" className="ag-footer-link" onClick={() => scrollPara('precos')}>Preços</button>
              <button type="button" className="ag-footer-link" onClick={() => scrollPara('faq')}>FAQ</button>
            </nav>

            <nav className="ag-footer-col" aria-label="Conta">
              <h4 className="ag-footer-title">Conta</h4>
              <Link to="/login" className="ag-footer-link">Entrar</Link>
              <Link to="/signup" className="ag-footer-link">Criar conta</Link>
            </nav>

            <div className="ag-footer-col">
              <h4 className="ag-footer-title">Contato</h4>
              <a href="mailto:contato@agrogestor.app" className="ag-footer-link">contato@agrogestor.app</a>
              <a href="tel:+5511999990000" className="ag-footer-link">+55 (11) 99999-0000</a>
            </div>
          </div>

          <div className="ag-footer-bottom">
            <span>© {new Date().getFullYear()} AgroGestor. Todos os direitos reservados.</span>
            <span>Feito com <span aria-hidden="true">💚</span><span className="sr-only">amor</span> no Brasil</span>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ============================================================
   Subcomponentes
   ============================================================ */
function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="ag-mini">
      <div className="ag-mini-icon" aria-hidden="true">{icon}</div>
      <div className="ag-mini-label">{label}</div>
      <div className="ag-mini-value">{value}</div>
    </div>
  );
}

function StatItem({ numero, label }: { numero: string; label: string }) {
  return (
    <div>
      <div className="ag-stat-num">{numero}</div>
      <div className="ag-stat-label">{label}</div>
    </div>
  );
}

function FaqItem({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberto, setAberto] = useState(false);
  const id = `faq-${pergunta.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={`ag-faq-item${aberto ? ' open' : ''}`}>
      <h3 style={{ margin: 0 }}>
        <button
          type="button"
          className="ag-faq-btn"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-controls={id}
        >
          <span className="ag-faq-q">{pergunta}</span>
          <span className="ag-faq-ic" aria-hidden="true">+</span>
        </button>
      </h3>
      {aberto && <p className="ag-faq-a" id={id}>{resposta}</p>}
    </div>
  );
}