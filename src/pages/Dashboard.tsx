import {
  memo,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useDeferredValue,
  useRef,
  useId,
} from 'react';
import type {
  ChangeEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  RefObject,
} from 'react';
import LogoutButton from '../components/LogoutButton';
import { useAuth } from '../contexts/AuthContext';
import { ToastProvider, useToast } from '../contexts/ToastContext';
import { TarefasProvider, useTarefas, limparCacheTarefas } from '../contexts/TarefasContext';
import { authService } from '../services/auth.service';
import { mensagemDeErro } from '../services/http';
import { pomodoroApi } from '../services/pomodoro.service';
import { sanitizarTarefa } from '../mappers/tarefa.mapper';
import { Pomodoro, PomodoroMini, usePomodoro, POMODORO_STORAGE_KEY } from '../components/Pomodoro';
import {
  COLUNAS,
  LIMITES,
  PRIORIDADES,
  PRIORIDADE_LABEL,
  STATUS_IDS,
  TITULO_COLUNA,
} from '../types/domain';
import type { Prioridade, StatusColuna, Tarefa } from '../types/domain';

/** Payload de criar/editar — id e criadoEm são do servidor. */
type TarefaInput = Omit<Tarefa, 'id' | 'criadoEm'>;

const THEME_KEY = 'ctoperacional:tema';

type Aba = 'quadro' | 'lista' | 'relatorios' | 'config';
type Tema = 'claro' | 'escuro';
type Ordem = 'criacao' | 'recentes' | 'prazo' | 'prioridade';

const ABAS: { id: Aba; icon: string; label: string; titulo: string }[] = [
  { id: 'quadro', icon: '🗂️', label: 'Quadro', titulo: 'Quadro Kanban' },
  { id: 'lista', icon: '📋', label: 'Lista', titulo: 'Lista de tarefas' },
  { id: 'relatorios', icon: '📈', label: 'Relatórios', titulo: 'Relatórios' },
  { id: 'config', icon: '⚙️', label: 'Configurações', titulo: 'Configurações' },
];

const ORDENS: { id: Ordem; label: string }[] = [
  { id: 'criacao', label: 'Ordem de criação' },
  { id: 'recentes', label: 'Mais recentes' },
  { id: 'prazo', label: 'Prazo mais próximo' },
  { id: 'prioridade', label: 'Maior prioridade' },
];

const PESO_PRIO: Record<Prioridade, number> = { alta: 0, media: 1, baixa: 2 };

/* ------------------------------ utilitários ------------------------------ */

const normalizar = (txt: string) =>
  txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const formatarData = () =>
  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const diasAte = (iso: string, hoje: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const [hy, hm, hd] = hoje.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(hy, hm - 1, hd)) / 86_400_000);
};

const rotuloPrazo = (iso: string, hoje: string) => {
  const dias = diasAte(iso, hoje);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  if (dias === -1) return 'Ontem';
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

const iniciais = (nome?: string) => {
  if (!nome) return '?';
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
};

const cortar = (txt: string, max = 40) => (txt.length > max ? `${txt.slice(0, max - 1)}…` : txt);

const comparador = (ordem: Ordem) => (a: Tarefa, b: Tarefa) => {
  switch (ordem) {
    case 'recentes':
      return b.criadoEm.localeCompare(a.criadoEm);
    case 'prazo':
      if (!a.prazo && !b.prazo) return 0;
      if (!a.prazo) return 1;
      if (!b.prazo) return -1;
      return a.prazo.localeCompare(b.prazo);
    case 'prioridade':
      return PESO_PRIO[a.prioridade] - PESO_PRIO[b.prioridade];
    default:
      return a.criadoEm.localeCompare(b.criadoEm);
  }
};

/* --------------------------------- hooks --------------------------------- */

function useTema() {
  const [tema, setTema] = useState<Tema>(() => {
    try {
      const salvo = localStorage.getItem(THEME_KEY);
      if (salvo === 'claro' || salvo === 'escuro') return salvo;
    } catch {
      /* ignore */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  });
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, tema);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute('data-theme', tema === 'escuro' ? 'dark' : 'light');
  }, [tema]);
  const alternar = useCallback(() => setTema((t) => (t === 'claro' ? 'escuro' : 'claro')), []);
  return { tema, alternar };
}

function useBodyLock(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [ativo]);
}

const FOCAVEIS =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function useFocusTrap(ref: RefObject<HTMLElement | null>, ativo: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!ativo || !el) return;
    const anterior = document.activeElement as HTMLElement | null;
    if (!el.contains(document.activeElement)) {
      (el.querySelector<HTMLElement>(FOCAVEIS) ?? el).focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const itens = Array.from(el.querySelectorAll<HTMLElement>(FOCAVEIS));
      if (itens.length === 0) {
        e.preventDefault();
        return;
      }
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('keydown', onKey);
      anterior?.focus?.();
    };
  }, [ref, ativo]);
}

/* -------------------------------- estilos -------------------------------- */

const STYLES = `
.dash {
  --bg: #f6f8fb;
  --surface: #ffffff;
  --surface-2: #f1f5f9;
  --surface-3: #e2e8f0;
  --sidebar: #ffffff;
  --ink: #0f172a;
  --ink-soft: #334155;
  --muted: #5b6b82;
  --border: #e2e8f0;
  --border-strong: #cbd5e1;
  --brand: #2563eb;
  --brand-2: #3b82f6;
  --brand-3: #1d4ed8;
  --brand-soft: #eff6ff;
  --brand-ink: #ffffff;
  --danger: #dc2626;
  --danger-soft: #fef2f2;
  --danger-line: #fca5a5;
  --warn: #b45309;
  --warn-soft: #fef3c7;
  --ok: #059669;
  --ok-soft: #ecfdf5;
  --shadow-sm: 0 1px 2px rgba(15,23,42,.05);
  --shadow-md: 0 8px 24px -12px rgba(15,23,42,.22);
  --shadow-lg: 0 24px 60px -20px rgba(15,23,42,.35);
  --radius: 14px;
  --radius-sm: 10px;
  color-scheme: light;

  min-height: 100vh; min-height: 100dvh;
  display: grid; grid-template-columns: 248px minmax(0, 1fr);
  background: var(--bg); color: var(--ink);
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5; -webkit-font-smoothing: antialiased;
}
.dash[data-theme="escuro"] {
  --bg: #0b0f1a; --surface: #111827; --surface-2: #1a2336; --surface-3: #334155;
  --sidebar: #0e1424; --ink: #f1f5f9; --ink-soft: #cbd5e1; --muted: #9fb0c6;
  --border: #263247; --border-strong: #475569;
  --brand: #60a5fa; --brand-2: #93c5fd; --brand-3: #93c5fd; --brand-soft: #172a47; --brand-ink: #0b1220;
  --danger: #f87171; --danger-soft: #3a1214; --danger-line: #7f1d1d;
  --warn: #fbbf24; --warn-soft: #3a2c0f; --ok: #34d399; --ok-soft: #063b2e;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.4); --shadow-md: 0 8px 24px -12px rgba(0,0,0,.6); --shadow-lg: 0 24px 60px -20px rgba(0,0,0,.75);
  color-scheme: dark;
}
.dash *, .dash *::before, .dash *::after { box-sizing: border-box; }
.dash h1, .dash h2, .dash h3 { margin: 0; letter-spacing: -.02em; }
.dash p { margin: 0; }
.dash button, .dash input, .dash select, .dash textarea { font-family: inherit; color: inherit; }
.dash :focus-visible { outline: 3px solid var(--brand-2); outline-offset: 2px; border-radius: 8px; }

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
.skip-link {
  position: fixed; top: 8px; left: 8px; z-index: 3000; padding: 10px 16px; border-radius: 10px;
  background: var(--brand); color: var(--brand-ink); font-weight: 700; font-size: 14px;
  transform: translateY(-200%); text-decoration: none;
}
.skip-link:focus { transform: none; }
kbd.dash-kbd {
  font-family: inherit; font-size: 10.5px; font-weight: 700; padding: 2px 6px; border-radius: 5px;
  background: var(--surface); border: 1px solid var(--border); color: var(--ink-soft);
}

/* sidebar */
.dash-sidebar {
  display: flex; flex-direction: column; gap: 6px; padding: 18px 12px; background: var(--sidebar);
  border-right: 1px solid var(--border); position: sticky; top: 0; height: 100vh; height: 100dvh; overflow-y: auto;
}
.dash-brand { display: flex; align-items: center; gap: 10px; padding: 4px 8px 16px; margin-bottom: 8px; }
.dash-brand-mark {
  width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; font-size: 19px;
  background: var(--brand-soft); border: 1px solid var(--border); flex-shrink: 0;
}
.dash-brand-text { display: flex; flex-direction: column; line-height: 1.25; }
.dash-brand-name { font-weight: 800; font-size: 15px; }
.dash-brand-sub { font-size: 11.5px; color: var(--muted); }
.dash-nav { display: flex; flex-direction: column; gap: 2px; }
.dash-nav-btn {
  display: flex; align-items: center; gap: 12px; width: 100%; min-height: 42px; padding: 9px 12px;
  border: none; border-radius: var(--radius-sm); background: transparent; color: var(--ink-soft);
  cursor: pointer; font-size: 14px; font-weight: 500; text-align: left; transition: background .15s, color .15s;
}
.dash-nav-btn:hover { background: var(--surface-2); color: var(--ink); }
.dash-nav-btn.is-active { background: var(--brand-soft); color: var(--brand); font-weight: 700; }
.dash[data-theme="escuro"] .dash-nav-btn.is-active { color: var(--brand-3); }
.dash-nav-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
.dash-nav-badge {
  margin-left: auto; font-size: 11px; font-weight: 700; background: var(--surface-3); color: var(--ink);
  padding: 1px 8px; border-radius: 999px; font-variant-numeric: tabular-nums;
}
.dash-sidebar-footer { margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 2px; }

/* topbar */
.dash-main { display: flex; flex-direction: column; min-width: 0; }
.dash-topbar {
  position: sticky; top: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 28px; min-height: 64px;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: saturate(180%) blur(14px); -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--border);
}
.dash-topbar-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.dash-burger {
  display: none; width: 42px; height: 42px; align-items: center; justify-content: center; background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; font-size: 18px;
}
.dash-title { font-size: 18px; font-weight: 800; line-height: 1.2; }
.dash-subtitle { font-size: 12.5px; color: var(--muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dash-topbar-right { display: flex; align-items: center; gap: 8px; }
.dash-search-trigger {
  display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 8px 12px; min-width: 190px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm);
  cursor: pointer; font-size: 13px; color: var(--muted); transition: border-color .15s, color .15s;
}
.dash-search-trigger:hover { border-color: var(--border-strong); color: var(--ink); }
.dash-search-trigger kbd { margin-left: auto; }
.dash-icon-btn {
  display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm);
  cursor: pointer; font-size: 15px; transition: border-color .15s, color .15s;
}
.dash-icon-btn:hover { border-color: var(--brand); color: var(--brand); }
.dash-user { position: relative; }
.dash-user-btn {
  display: inline-flex; align-items: center; gap: 10px; padding: 4px 12px 4px 4px; background: var(--surface);
  border: 1px solid var(--border); border-radius: 999px; cursor: pointer; transition: border-color .15s;
}
.dash-user-btn:hover { border-color: var(--border-strong); }
.dash-user-name { font-size: 13px; font-weight: 600; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dash-avatar {
  width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center;
  color: var(--brand-ink); font-weight: 700; font-size: 12px; background: var(--brand); flex-shrink: 0;
}
.dash-menu {
  position: absolute; top: calc(100% + 8px); right: 0; min-width: 260px; background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-lg); padding: 8px; z-index: 50;
  animation: dashPop .14s ease-out;
}
@keyframes dashPop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
.dash-menu-header { padding: 10px 12px 12px; border-bottom: 1px solid var(--border); margin-bottom: 6px; }
.dash-menu-name { font-size: 13.5px; font-weight: 700; }
.dash-menu-email { font-size: 12px; color: var(--muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; }
.dash-menu-item {
  display: flex; align-items: center; gap: 10px; width: 100%; min-height: 40px; padding: 9px 12px; border: none;
  background: transparent; border-radius: 8px; cursor: pointer; font-size: 13px; text-align: left;
}
.dash-menu-item:hover { background: var(--surface-2); }

/* conteúdo */
.dash-content { padding: 22px 28px 80px; display: flex; flex-direction: column; gap: 20px; max-width: 1680px; width: 100%; margin: 0 auto; outline: none; }

.dash-banner {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 10px 14px; border-radius: var(--radius-sm);
  background: var(--warn-soft); color: var(--warn); border: 1px solid color-mix(in srgb, var(--warn) 35%, transparent);
  font-size: 13px; font-weight: 600;
}
.dash-banner .dash-btn { min-height: 34px; padding: 4px 12px; margin-left: auto; }

.dash-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }
.dash-kpi { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
.dash-kpi-icon {
  width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center; font-size: 18px;
  background: var(--brand-soft); flex-shrink: 0;
}
.dash-kpi.is-danger .dash-kpi-icon { background: var(--danger-soft); }
.dash-kpi-label { font-size: 12.5px; color: var(--muted); font-weight: 600; }
.dash-kpi-value { font-size: 22px; font-weight: 800; letter-spacing: -.03em; font-variant-numeric: tabular-nums; line-height: 1.2; }
.dash-kpi-hint { font-size: 12px; font-weight: 600; color: var(--muted); margin-left: 6px; letter-spacing: 0; }
.dash-kpi.is-danger .dash-kpi-value { color: var(--danger); }

.dash-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px 22px; }
.dash-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.dash-panel-title { font-size: 14.5px; font-weight: 700; }
.dash-panel-meta { font-size: 12.5px; color: var(--muted); }

/* filtros */
.dash-toolbar { display: flex; flex-direction: column; gap: 10px; }
.dash-filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.dash-filters-spacer { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }
.dash-input, .dash-select {
  min-height: 42px; padding: 9px 14px; background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius-sm); font-size: 14px; transition: border-color .15s, box-shadow .15s;
}
.dash-input { flex: 1 1 220px; min-width: 0; }
.dash-select { flex: 0 0 auto; min-width: 150px; cursor: pointer; }
.dash-input::placeholder { color: var(--muted); opacity: 1; }
.dash-input:hover, .dash-select:hover { border-color: var(--border-strong); }
.dash-input:focus, .dash-select:focus {
  outline: none; border-color: var(--brand); box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-2) 25%, transparent);
}
textarea.dash-input { min-height: 84px; resize: vertical; line-height: 1.55; }

.dash-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; padding: 9px 16px;
  border-radius: var(--radius-sm); font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
  border: 1.5px solid transparent; transition: background .15s, border-color .15s, color .15s, filter .15s;
}
.dash-btn-primary { background: var(--brand); color: var(--brand-ink); }
.dash-btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.dash-btn-ghost { background: var(--surface); border-color: var(--border); }
.dash-btn-ghost:hover:not(:disabled) { border-color: var(--brand); color: var(--brand); }
.dash-btn-ghost.is-on { border-color: var(--brand); color: var(--brand); background: var(--brand-soft); }
.dash-btn-danger { background: var(--danger); color: #fff; }
.dash[data-theme="escuro"] .dash-btn-danger { color: #2a1315; font-weight: 700; }
.dash-btn-danger:hover:not(:disabled) { filter: brightness(1.12); }
.dash-btn-danger-ghost { background: transparent; border-color: var(--danger-line); color: var(--danger); }
.dash-btn-danger-ghost:hover:not(:disabled) { background: var(--danger-soft); }
.dash-btn:disabled { opacity: .55; cursor: not-allowed; }

/* área de trabalho */
.work-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; align-items: start; }
.work-side { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; align-items: start; scroll-margin-top: 80px; }
@media (min-width: 1500px) {
  .work-grid { grid-template-columns: minmax(0, 1fr) 330px; }
  .work-side { grid-template-columns: 1fr; position: sticky; top: 80px; }
}
.work-grid.sem-lateral { grid-template-columns: minmax(0, 1fr); }

/* kanban */
.kanban-board {
  display: grid; grid-template-columns: repeat(4, minmax(260px, 1fr)); gap: 14px; align-items: start;
  overflow-x: auto; padding-bottom: 10px; scroll-snap-type: x proximity;
}
.kanban-col {
  background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius); min-height: 320px;
  display: flex; flex-direction: column; transition: border-color .15s, background .15s; scroll-snap-align: start;
}
.kanban-col.is-over { border-color: var(--brand); background: var(--brand-soft); }
.kanban-col-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 14px 14px 10px; }
.kanban-col-title { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
.kanban-col-count { font-size: 11.5px; font-weight: 700; background: var(--surface); border: 1px solid var(--border); padding: 1px 8px; border-radius: 999px; font-variant-numeric: tabular-nums; }
.kanban-col-body { padding: 2px 10px 12px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
.kanban-col-body.is-clicavel { cursor: copy; }

.kanban-card {
  position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 14px 12px;
  cursor: grab; box-shadow: var(--shadow-sm); transition: border-color .15s, box-shadow .15s, opacity .15s;
  display: flex; flex-direction: column; gap: 8px;
}
.kanban-card::before { content: ''; position: absolute; left: 0; top: 14px; bottom: 14px; width: 3px; border-radius: 0 3px 3px 0; background: var(--border-strong); }
.kanban-card.prio-alta::before { background: var(--danger); }
.kanban-card.prio-media::before { background: #d97706; }
.kanban-card.prio-baixa::before { background: var(--brand-2); }
.kanban-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); }
.kanban-card.is-focus { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-2) 22%, transparent); }
.kanban-card.is-dragging { opacity: .45; }
.kanban-card.is-done .kanban-card-title { color: var(--muted); text-decoration: line-through; text-decoration-color: var(--border-strong); }
.kanban-card:active { cursor: grabbing; }
.kanban-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.kanban-card-title { font-size: 14.5px; font-weight: 650; line-height: 1.4; overflow-wrap: anywhere; }
.kanban-card-desc {
  font-size: 13px; color: var(--muted); line-height: 1.55; white-space: pre-line; overflow-wrap: anywhere;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.kanban-prio, .tag { font-size: 11.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
.kanban-prio.alta { background: var(--danger-soft); color: var(--danger); }
.kanban-prio.media { background: var(--warn-soft); color: var(--warn); }
.kanban-prio.baixa { background: var(--brand-soft); color: var(--brand); }
.dash[data-theme="escuro"] .kanban-prio.baixa { color: var(--brand-3); }
.tag { background: var(--surface-2); color: var(--ink-soft); font-weight: 600; }
.tag.is-late { background: var(--danger-soft); color: var(--danger); font-weight: 700; }
.kanban-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 2px; }
.kanban-card-actions { display: flex; gap: 4px; opacity: 0; transition: opacity .15s; }
.kanban-card:hover .kanban-card-actions, .kanban-card:focus-within .kanban-card-actions { opacity: 1; }
@media (hover: none) { .kanban-card-actions { opacity: 1; } }
.kanban-empty { text-align: center; padding: 22px 12px; color: var(--muted); font-size: 12.5px; border: 1.5px dashed var(--border-strong); border-radius: 10px; }

.dash-row-btn {
  display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--border); background: var(--surface); color: var(--ink-soft); cursor: pointer; font-size: 15px; line-height: 1;
  transition: background .12s, color .12s, border-color .12s;
}
.dash-row-btn:hover:not(:disabled) { border-color: var(--brand); color: var(--brand); background: var(--brand-soft); }
.dash-row-btn:disabled { opacity: .35; cursor: not-allowed; }
.dash-row-btn.is-danger:hover { background: var(--danger-soft); border-color: var(--danger); color: var(--danger); }
.dash-row-btn svg { width: 15px; height: 15px; pointer-events: none; }
.dash-row-actions { display: inline-flex; gap: 6px; justify-content: flex-end; }

/* criação inline */
.kanban-add {
  display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 42px; padding: 8px 10px;
  border: 1.5px dashed var(--border-strong); border-radius: 10px; background: transparent; color: var(--muted);
  font-size: 13px; font-weight: 600; cursor: pointer; transition: border-color .15s, color .15s, background .15s;
}
.kanban-add:hover { border-color: var(--brand); color: var(--brand); background: var(--surface); }
.composer { background: var(--surface); border: 1.5px solid var(--brand); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 10px; box-shadow: var(--shadow-md); }
.composer .dash-input { width: 100%; flex: none; min-height: 42px; }
.composer textarea.dash-input { min-height: 96px; font-size: 13.5px; }
.composer-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.composer-row .dash-select, .composer-row .dash-input { min-height: 38px; min-width: 0; flex: 1 1 110px; padding: 4px 8px; font-size: 13px; }
.composer-actions { display: flex; gap: 8px; justify-content: flex-end; align-items: center; flex-wrap: wrap; }
.composer-actions .dash-btn { min-height: 38px; padding: 6px 12px; }
.composer-hint { font-size: 11.5px; color: var(--muted); margin-right: auto; }
.composer-toggle { align-self: flex-start; background: transparent; border: none; color: var(--brand); font-size: 12.5px; font-weight: 700; cursor: pointer; padding: 2px 4px; border-radius: 6px; }
.composer-toggle:hover { background: var(--brand-soft); }
.list-composer { max-width: 640px; margin-bottom: 16px; }

.ptask-row { display: inline-flex; align-items: center; gap: 4px; }
.ptask-step {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface);
  color: var(--ink-soft); font-size: 16px; font-weight: 700; line-height: 1; cursor: pointer;
}
.ptask-step:hover:not(:disabled) { border-color: var(--brand); color: var(--brand); background: var(--brand-soft); }
.ptask-step:disabled { opacity: .4; cursor: not-allowed; }
.ptask-count { min-width: 52px; text-align: center; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ptask-chip {
  display: inline-flex; align-items: center; gap: 6px; min-height: 30px; padding: 3px 11px; border-radius: 999px;
  border: 1.5px solid var(--border); background: var(--surface-2); color: var(--ink); font-size: 12.5px; font-weight: 700;
  cursor: pointer; font-variant-numeric: tabular-nums; white-space: nowrap; transition: border-color .15s, background .15s, color .15s;
}
.ptask-chip:hover:not(:disabled) { border-color: var(--brand); background: var(--brand-soft); color: var(--brand); }
.ptask-chip.is-active { border-color: var(--brand); background: var(--brand-soft); color: var(--brand); }
.ptask-chip.is-done { border-color: var(--ok); background: var(--ok-soft); color: var(--ok); }
.ptask-chip:disabled { opacity: .55; cursor: not-allowed; }

/* fila de foco */
.focus-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.focus-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface-2); }
.focus-item-text { flex: 1; min-width: 0; }
.focus-item-title { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.focus-item-sub { font-size: 11.5px; color: var(--muted); }

/* tabela */
.dash-table-wrap { border: 1px solid var(--border); border-radius: var(--radius-sm); overflow-x: auto; background: var(--surface); }
.dash-table { width: 100%; border-collapse: collapse; font-size: 13.5px; min-width: 980px; }
.dash-table thead th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 700; color: var(--muted); background: var(--surface-2); border-bottom: 1px solid var(--border); white-space: nowrap; }
.dash-table tbody td { padding: 14px 16px; border-bottom: 1px solid var(--border); vertical-align: top; }
.dash-table tbody tr:last-child td { border-bottom: none; }
.dash-table tbody tr:hover td { background: var(--surface-2); }
.dash-table .col-titulo { width: 26%; min-width: 220px; }
.dash-table .col-desc { width: 34%; min-width: 280px; }
.dash-table .actions-cell { width: 96px; text-align: right; white-space: nowrap; }
.dash-table .dash-select { min-height: 34px; padding: 4px 8px; font-size: 12.5px; min-width: 0; }
.cell-titulo {
  display: block; width: 100%; padding: 0; margin: 0; background: transparent; border: none; text-align: left; cursor: pointer;
  font-size: 14px; font-weight: 650; line-height: 1.4; overflow-wrap: anywhere; color: var(--ink);
}
.cell-titulo:hover { color: var(--brand); }
.cell-desc {
  color: var(--muted); font-size: 13px; line-height: 1.55; white-space: pre-line; overflow-wrap: anywhere;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}

.dash-empty { text-align: center; padding: 48px 24px; border: 1.5px dashed var(--border-strong); border-radius: var(--radius); background: var(--surface-2); }
.dash-empty-icon { font-size: 40px; line-height: 1; margin-bottom: 12px; display: block; }
.dash-empty-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
.dash-empty-desc { font-size: 13.5px; color: var(--muted); max-width: 420px; margin: 0 auto 18px; }

/* relatórios */
.bar-row { display: grid; grid-template-columns: 130px minmax(0,1fr) 40px; gap: 12px; align-items: center; padding: 6px 0; font-size: 13.5px; }
.bar-track { height: 10px; background: var(--surface-2); border-radius: 999px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--brand); border-radius: 999px; transition: width .3s; }
.bar-fill.alta { background: var(--danger); } .bar-fill.media { background: #d97706; } .bar-fill.ok { background: var(--ok); }
.bar-num { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.report-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }

/* configurações */
.dash-config-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.dash-config-row:last-child { border-bottom: none; }
.dash-config-label { font-weight: 600; font-size: 14px; }
.dash-config-desc { font-size: 12.5px; color: var(--muted); margin-top: 2px; }
.dash-danger-zone { border: 1px solid var(--danger-line); background: var(--danger-soft); border-radius: var(--radius); padding: 18px 20px; }
.dash-danger-title { display: flex; align-items: center; gap: 8px; color: var(--danger); font-size: 14px; font-weight: 800; margin-bottom: 4px; }
.dash-danger-desc { font-size: 12.5px; color: var(--ink-soft); margin-bottom: 14px; }
.dash-danger-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding-top: 14px; border-top: 1px solid color-mix(in srgb, var(--danger) 25%, transparent); flex-wrap: wrap; }

/* modais */
.dash-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,.55); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000; animation: dashFade .15s ease;
}
.dash-overlay.is-top { align-items: flex-start; padding-top: 12vh; }
@keyframes dashFade { from { opacity: 0; } to { opacity: 1; } }
.dash-modal {
  width: 100%; max-width: 500px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 26px;
  box-shadow: var(--shadow-lg); max-height: calc(100dvh - 40px); overflow-y: auto; animation: dashRise .18s ease-out; outline: none;
}
.dash-modal.is-wide { max-width: 780px; padding: 28px 30px; }
@keyframes dashRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.dash-modal-title { font-size: 19px; font-weight: 800; margin-bottom: 18px; }
.dash-modal-title.is-danger { color: var(--danger); text-align: center; }
.dash-modal-desc { font-size: 13.5px; color: var(--ink-soft); text-align: center; margin-bottom: 20px; }
.dash-modal-label, .form-label { font-size: 13px; font-weight: 600; display: block; }
.dash-modal-label { margin-bottom: 6px; }
.dash-modal-icon { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; font-size: 26px; margin: 0 auto 14px; background: var(--danger-soft); border: 1px solid var(--danger-line); }
.dash-modal-actions { display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 22px; flex-wrap: wrap; }
.dash-modal-actions .spacer { margin-right: auto; }
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.field-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.field-count { font-size: 11.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
.field-count.is-near { color: var(--warn); font-weight: 700; }
.dash-input-lg { font-size: 16px; font-weight: 600; min-height: 48px; width: 100%; }
.dash-textarea-lg { width: 100%; min-height: 220px; font-size: 14.5px; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; }
.form-grid .field { margin-bottom: 0; }
.form-grid .dash-input, .form-grid .dash-select { width: 100%; }
.form-meta { margin-top: 14px; font-size: 12px; color: var(--muted); }
.dash-error-inline { font-size: 12.5px; color: var(--danger); font-weight: 600; margin-top: 8px; }

.dash-palette { width: 100%; max-width: 560px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; box-shadow: var(--shadow-lg); overflow: hidden; outline: none; }
.dash-palette-input { width: 100%; padding: 18px 20px; border: none; border-bottom: 1px solid var(--border); font-size: 15px; background: transparent; outline: none; }
.dash-palette-list { max-height: 360px; overflow-y: auto; padding: 6px; }
.dash-palette-group { font-size: 11.5px; font-weight: 700; color: var(--muted); padding: 10px 12px 6px; }
.dash-palette-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; background: transparent; border: none; border-radius: 10px; cursor: pointer; text-align: left; font-size: 13.5px; }
.dash-palette-item.is-selected { background: var(--brand-soft); color: var(--brand); }
.dash[data-theme="escuro"] .dash-palette-item.is-selected { color: var(--brand-3); }
.dash-palette-item-icon { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; background: var(--surface-2); font-size: 15px; flex-shrink: 0; }
.dash-palette-item-text { display: flex; flex-direction: column; min-width: 0; }
.dash-palette-item-title { font-weight: 600; }
.dash-palette-item-sub { font-size: 12px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dash-palette-empty { padding: 28px 20px; text-align: center; color: var(--muted); font-size: 13.5px; }

/* toasts */
.dash-toasts { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 10px; z-index: 2000; max-width: calc(100vw - 32px); pointer-events: none; }
.dash-toast { pointer-events: auto; display: flex; align-items: center; gap: 12px; min-width: 260px; max-width: 420px; padding: 12px 14px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-lg); animation: dashSlideIn .2s ease-out; }
@keyframes dashSlideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }
.dash-toast-icon { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
.dash-toast--sucesso .dash-toast-icon { background: var(--ok-soft); color: var(--ok); }
.dash-toast--erro .dash-toast-icon { background: var(--danger-soft); color: var(--danger); }
.dash-toast--info .dash-toast-icon { background: var(--brand-soft); color: var(--brand); }
.dash-toast-text { flex: 1; font-size: 13.5px; line-height: 1.4; }
.dash-toast-action { background: transparent; border: none; color: var(--brand); font-weight: 700; font-size: 13px; cursor: pointer; padding: 6px 8px; border-radius: 6px; }
.dash-toast-action:hover { background: var(--brand-soft); }
.dash-toast-close { background: transparent; border: none; cursor: pointer; color: var(--muted); font-size: 15px; width: 30px; height: 30px; border-radius: 6px; }
.dash-toast-close:hover { background: var(--surface-2); color: var(--ink); }

.dash-mobile-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.55); z-index: 40; animation: dashFade .15s ease; }
.dash-mobile-drawer { position: fixed; top: 0; left: 0; bottom: 0; width: min(300px, 85vw); background: var(--sidebar); border-right: 1px solid var(--border); padding: 18px 12px; display: flex; flex-direction: column; z-index: 41; overflow-y: auto; animation: dashSlideRight .2s ease-out; }
@keyframes dashSlideRight { from { transform: translateX(-100%); } to { transform: none; } }

@media (max-width: 1100px) { .kanban-board { grid-template-columns: repeat(2, minmax(250px, 1fr)); } }
@media (max-width: 1024px) {
  .dash { grid-template-columns: minmax(0, 1fr); }
  .dash-sidebar { display: none; }
  .dash-burger { display: inline-flex; }
  .dash-content { padding: 18px 18px 80px; }
  .dash-topbar { padding: 10px 18px; }
  .dash-search-trigger { min-width: 0; width: 42px; padding: 0; justify-content: center; }
  .dash-search-trigger span:not(.dash-search-ico), .dash-search-trigger kbd { display: none; }
}
@media (max-width: 720px) {
  .dash-content { padding: 14px 14px 80px; gap: 14px; }
  .dash-topbar { padding: 8px 12px; }
  .dash-title { font-size: 16px; }
  .dash-user-name, .dash-user-btn .chevron { display: none; }
  .dash-user-btn { padding: 3px; }
  .dash-panel { padding: 14px; }
  .kanban-board { grid-template-columns: 1fr; }
  .dash-modal, .dash-modal.is-wide { padding: 20px 16px; border-radius: 14px; }
  .dash-modal-actions > * { flex: 1 1 100%; }
  .dash-toasts { left: 12px; right: 12px; bottom: 12px; }
  .dash-toast { min-width: 0; max-width: none; }
  .bar-row { grid-template-columns: 100px minmax(0,1fr) 32px; gap: 8px; }
  .dash-select { flex: 1 1 140px; }
  .dash-filters-spacer { margin-left: 0; width: 100%; }
  .dash-filters-spacer > * { flex: 1 1 auto; }
}
@media (max-width: 480px) { .dash-kpis { grid-template-columns: 1fr 1fr; gap: 8px; } .dash-kpi { padding: 10px 12px; gap: 8px; } .dash-kpi-icon { width: 34px; height: 34px; font-size: 15px; } .dash-kpi-value { font-size: 18px; } }
@media (prefers-reduced-motion: reduce) {
  .dash *, .dash *::before, .dash *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
`;

/* -------------------------------- ícones --------------------------------- */

const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

/* ----------------------------- subcomponentes ----------------------------- */

function Modal({
  rotulo,
  onFechar,
  children,
  className = 'dash-modal',
  topo = false,
  bloquear = false,
}: {
  rotulo: string;
  onFechar: () => void;
  children: ReactNode;
  className?: string;
  topo?: boolean;
  bloquear?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);
  useBodyLock(true);
  return (
    <div
      className={`dash-overlay${topo ? ' is-top' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !bloquear) onFechar();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !bloquear) {
          e.stopPropagation();
          onFechar();
        }
      }}
    >
      <div ref={ref} role="dialog" aria-modal="true" aria-label={rotulo} tabIndex={-1} className={className}>
        {children}
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  perigo,
}: {
  icon: string;
  label: string;
  value: string | number;
  hint?: string;
  perigo?: boolean;
}) {
  return (
    <div className={`dash-kpi${perigo ? ' is-danger' : ''}`}>
      <span className="dash-kpi-icon" aria-hidden="true">{icon}</span>
      <div>
        <div className="dash-kpi-label">{label}</div>
        <div className="dash-kpi-value">
          {value}
          {hint && <span className="dash-kpi-hint">{hint}</span>}
        </div>
      </div>
    </div>
  );
}

function Contador({ atual, max }: { atual: number; max: number }) {
  return (
    <span className={`field-count${atual > max * 0.9 ? ' is-near' : ''}`} aria-hidden="true">
      {atual}/{max}
    </span>
  );
}

type NovaInline = {
  titulo: string;
  descricao: string;
  pomodoros: number;
  prioridade: Prioridade;
  status: StatusColuna;
  prazo: string;
};

function NovaTarefaInline({
  statusInicial,
  escolherStatus = false,
  onAdicionar,
  onCancelar,
}: {
  statusInicial: StatusColuna;
  escolherStatus?: boolean;
  onAdicionar: (dados: NovaInline) => void;
  onCancelar: () => void;
}) {
  const id = useId();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [comDescricao, setComDescricao] = useState(false);
  const [pomos, setPomos] = useState(1);
  const [prio, setPrio] = useState<Prioridade>('media');
  const [status, setStatus] = useState<StatusColuna>(statusInicial);
  const [prazo, setPrazo] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const enviar = (e?: FormEvent) => {
    e?.preventDefault();
    const texto = titulo.trim();
    if (!texto) {
      inputRef.current?.focus();
      return;
    }
    onAdicionar({ titulo: texto, descricao: descricao.trim(), pomodoros: pomos, prioridade: prio, status, prazo });
    setTitulo('');
    setDescricao('');
    setPrazo('');
    inputRef.current?.focus(); // continua aberto para adicionar várias em sequência
  };

  return (
    <form
      className="composer"
      onSubmit={enviar}
      aria-label="Nova tarefa"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onCancelar();
        }
      }}
    >
      <label className="sr-only" htmlFor={`${id}-t`}>Título da nova tarefa</label>
      <input
        id={`${id}-t`}
        ref={inputRef}
        className="dash-input"
        placeholder="Título da tarefa"
        value={titulo}
        maxLength={LIMITES.titulo}
        onChange={(e) => setTitulo(e.target.value)}
        autoFocus
      />
      {comDescricao ? (
        <>
          <label className="sr-only" htmlFor={`${id}-d`}>Descrição</label>
          <textarea
            id={`${id}-d`}
            className="dash-input"
            placeholder="Descrição, detalhes, links, passos…"
            value={descricao}
            maxLength={LIMITES.descricao}
            onChange={(e) => setDescricao(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                enviar();
              }
            }}
          />
        </>
      ) : (
        <button type="button" className="composer-toggle" onClick={() => setComDescricao(true)}>
          + Adicionar descrição
        </button>
      )}
      <div className="composer-row">
        <div className="ptask-row" role="group" aria-label="Pomodoros planejados">
          <button type="button" className="ptask-step" onClick={() => setPomos((p) => Math.max(0, p - 1))} disabled={pomos <= 0} aria-label="Diminuir pomodoros planejados">−</button>
          <span className="ptask-count" aria-live="polite"><span aria-hidden="true">🍅</span> {pomos}<span className="sr-only"> pomodoros planejados</span></span>
          <button type="button" className="ptask-step" onClick={() => setPomos((p) => Math.min(LIMITES.pomodorosPlanejados, p + 1))} aria-label="Aumentar pomodoros planejados">+</button>
        </div>
        <label className="sr-only" htmlFor={`${id}-p`}>Prioridade</label>
        <select id={`${id}-p`} className="dash-select" value={prio} onChange={(e) => setPrio(e.target.value as Prioridade)}>
          {PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDADE_LABEL[p]}</option>)}
        </select>
        <label className="sr-only" htmlFor={`${id}-z`}>Prazo</label>
        <input id={`${id}-z`} type="date" className="dash-input" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        {escolherStatus && (
          <>
            <label className="sr-only" htmlFor={`${id}-s`}>Status</label>
            <select id={`${id}-s`} className="dash-select" value={status} onChange={(e) => setStatus(e.target.value as StatusColuna)}>
              {COLUNAS.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
            </select>
          </>
        )}
      </div>
      <div className="composer-actions">
        <span className="composer-hint">Enter adiciona · Esc fecha</span>
        <button type="button" className="dash-btn dash-btn-ghost" onClick={onCancelar}>Fechar</button>
        <button type="submit" className="dash-btn dash-btn-primary">Adicionar</button>
      </div>
    </form>
  );
}

/** Chip compacto: o clique inicia o Pomodoro da tarefa. O planejado se edita no editor da tarefa. */
function ChipPomodoro({
  t,
  emFoco = false,
  onFocar,
}: {
  t: Tarefa;
  emFoco?: boolean;
  onFocar: (t: Tarefa) => void;
}) {
  const feitos = t.pomodoros ?? 0;
  const plan = t.pomodorosPlanejados ?? 0;
  const completo = plan > 0 && feitos >= plan;
  const concluida = t.status === 'concluido';
  const texto = plan > 0 ? `${feitos}/${plan}` : feitos > 0 ? `${feitos}` : 'Focar';
  return (
    <button
      type="button"
      className={`ptask-chip${completo ? ' is-done' : ''}${emFoco ? ' is-active' : ''}`}
      onClick={() => onFocar(t)}
      disabled={concluida}
      aria-label={`Iniciar pomodoro em ${t.titulo}. ${feitos} concluídos${plan > 0 ? ` de ${plan} planejados` : ''}`}
      title={concluida ? 'Tarefa concluída' : 'Clique para iniciar um Pomodoro'}
    >
      <span aria-hidden="true">{emFoco ? '⏱️' : '▶'}</span>
      <span aria-hidden="true">🍅</span> {texto}
    </button>
  );
}

type CartaoProps = {
  t: Tarefa;
  hoje: string;
  emFoco: boolean;
  arrastando: boolean;
  onEditar: (t: Tarefa) => void;
  onExcluir: (t: Tarefa) => void;
  onMover: (id: string, s: StatusColuna) => void;
  onFocar: (t: Tarefa) => void;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragEnd: () => void;
};

const CartaoTarefa = memo(function CartaoTarefa({
  t,
  hoje,
  emFoco,
  arrastando,
  onEditar,
  onExcluir,
  onMover,
  onFocar,
  onDragStart,
  onDragEnd,
}: CartaoProps) {
  const atrasada = !!t.prazo && diasAte(t.prazo, hoje) < 0 && t.status !== 'concluido';
  const idx = STATUS_IDS.indexOf(t.status);
  const anterior = STATUS_IDS[idx - 1];
  const proxima = STATUS_IDS[idx + 1];
  return (
    <article
      className={`kanban-card prio-${t.prioridade}${emFoco ? ' is-focus' : ''}${arrastando ? ' is-dragging' : ''}${t.status === 'concluido' ? ' is-done' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, t.id)}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button,select,a,input')) return;
        onEditar(t);
      }}
    >
      <div className="kanban-meta">
        <span className={`kanban-prio ${t.prioridade}`}>{PRIORIDADE_LABEL[t.prioridade]}</span>
        {t.prazo && (
          <span className={`tag${atrasada ? ' is-late' : ''}`}>
            <span aria-hidden="true">📅</span> {atrasada ? 'Atrasada · ' : ''}
            {rotuloPrazo(t.prazo, hoje)}
          </span>
        )}
      </div>
      <h3 className="kanban-card-title">{t.titulo}</h3>
      {t.descricao && <p className="kanban-card-desc">{t.descricao}</p>}
      <div className="kanban-card-footer">
        <ChipPomodoro t={t} emFoco={emFoco} onFocar={onFocar} />
        <div className="kanban-card-actions">
          <button type="button" className="dash-row-btn" disabled={!anterior} onClick={() => anterior && onMover(t.id, anterior)} aria-label={anterior ? `Mover "${t.titulo}" para ${TITULO_COLUNA[anterior]}` : 'Já está na primeira coluna'} title={anterior ? `Mover para ${TITULO_COLUNA[anterior]}` : undefined}>‹</button>
          <button type="button" className="dash-row-btn" disabled={!proxima} onClick={() => proxima && onMover(t.id, proxima)} aria-label={proxima ? `Mover "${t.titulo}" para ${TITULO_COLUNA[proxima]}` : 'Já está na última coluna'} title={proxima ? `Mover para ${TITULO_COLUNA[proxima]}` : undefined}>›</button>
          <button type="button" className="dash-row-btn" onClick={() => onEditar(t)} aria-label={`Editar ${t.titulo}`} title="Editar"><IconEdit /></button>
          <button type="button" className="dash-row-btn is-danger" onClick={() => onExcluir(t)} aria-label={`Excluir ${t.titulo}`} title="Excluir"><IconTrash /></button>
        </div>
      </div>
    </article>
  );
});

/* -------------------------------- Dashboard -------------------------------- */

type FormTarefa = {
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  status: StatusColuna;
  prazo: string;
  pomos: number;
};

const FORM_VAZIO: FormTarefa = { titulo: '', descricao: '', prioridade: 'media', status: 'a_fazer', prazo: '', pomos: 1 };

function DashboardConteudo() {
  const { tarefas, estado, sincronizando, recarregar, salvar, excluir, restaurar, mover, registrarPomodoro, importar, zerar } = useTarefas();
  const { tema, alternar } = useTema();
  const { toasts, push, remover } = useToast();
  const { usuario } = useAuth();

  const [aba, setAba] = useState<Aba>('quadro');
  const [tarefaFocoId, setTarefaFocoId] = useState<string | null>(null);
  const [painelFoco, setPainelFoco] = useState(true);
  const painelRef = useRef<HTMLElement>(null);

  // o callback sempre enxerga a tarefa em foco atual
  const pomodoro = usePomodoro({
    onEvento: (evento) => {
      const alvo = tarefaFocoId ? tarefas.find((t) => t.id === tarefaFocoId) : undefined;

      // Envia TODO evento para a API, enriquecido com dados da tarefa
      pomodoroApi.registrarEvento({
        ...evento,
        tarefaId: alvo?.id ?? null,
        tarefaTitulo: alvo?.titulo ?? null,
        statusTarefa: alvo?.status ?? null,
      });

      // Comportamento específico quando o FOCO termina (só nesse caso)
      if (evento.tipo === 'foco_completado') {
        if (alvo) void registrarPomodoro(alvo.id);
        push(`🍅 Foco de ${evento.minutosPlanejados} min concluído`, 'sucesso');
      }
    },
  });

  // editor de tarefa (modal)
  const [formAberto, setFormAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState<Tarefa | null>(null);
  const [form, setForm] = useState<FormTarefa>(FORM_VAZIO);
  const [salvandoForm, setSalvandoForm] = useState(false);
  const tituloRef = useRef<HTMLInputElement>(null);
  const setCampo = <K extends keyof FormTarefa>(k: K, v: FormTarefa[K]) => setForm((f) => ({ ...f, [k]: v }));

  // criação inline (no quadro e na lista)
  const [colunaCriando, setColunaCriando] = useState<StatusColuna | null>(null);
  const [criandoNaLista, setCriandoNaLista] = useState(false);

  // filtros
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'Todos' | StatusColuna>('Todos');
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<'Todas' | Prioridade>('Todas');
  const [ordem, setOrdem] = useState<Ordem>('criacao');
  const buscaDeferred = useDeferredValue(busca);
  const buscaRef = useRef<HTMLInputElement>(null);

  // overlays
  const [paletaAberta, setPaletaAberta] = useState(false);
  const [buscaPaleta, setBuscaPaleta] = useState('');
  const [paletaSelecionada, setPaletaSelecionada] = useState(0);
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [drawerMobileAberto, setDrawerMobileAberto] = useState(false);
  const [confirmarZerar, setConfirmarZerar] = useState(false);
  const [zerando, setZerando] = useState(false);
  const [colunaAlvo, setColunaAlvo] = useState<StatusColuna | null>(null);
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);

  // exclusão de conta
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const hoje = hojeISO();

  useBodyLock(drawerMobileAberto);
  useFocusTrap(drawerRef, drawerMobileAberto);

  /* ---------------------------- ações de tarefa ---------------------------- */

  const abrirFormNova = useCallback(() => {
    setTarefaEditando(null);
    setForm(FORM_VAZIO);
    setFormAberto(true);
  }, []);

  const abrirFormEditar = useCallback((t: Tarefa) => {
    setTarefaEditando(t);
    setForm({
      titulo: t.titulo,
      descricao: t.descricao ?? '',
      prioridade: t.prioridade,
      status: t.status,
      prazo: t.prazo ?? '',
      pomos: t.pomodorosPlanejados ?? 0,
    });
    setFormAberto(true);
  }, []);

  const fecharForm = useCallback(() => {
    setFormAberto(false);
    setTarefaEditando(null);
  }, []);

  const handleSalvar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (salvandoForm) return;
    const titulo = form.titulo.trim();
    if (!titulo) {
      push('Informe o título da tarefa', 'erro');
      tituloRef.current?.focus();
      return;
    }
    setSalvandoForm(true);
    const dados: TarefaInput = {
      titulo,
      descricao: form.descricao.trim() || undefined,
      prioridade: form.prioridade,
      status: form.status,
      prazo: form.prazo || undefined,
      pomodoros: tarefaEditando?.pomodoros,
      pomodorosPlanejados: form.pomos || undefined,
    };
    const ok = await salvar(dados, tarefaEditando?.id);
    setSalvandoForm(false);
    if (ok) {
      push(tarefaEditando ? 'Tarefa atualizada' : 'Tarefa criada', 'sucesso');
      fecharForm();
    }
  };

  const criarInline = useCallback(
    async (d: NovaInline) => {
      const ok = await salvar({
        titulo: d.titulo.slice(0, LIMITES.titulo),
        descricao: d.descricao || undefined,
        prioridade: d.prioridade,
        status: d.status,
        prazo: d.prazo || undefined,
        pomodorosPlanejados: d.pomodoros || undefined,
      });
      if (ok) push('Tarefa criada', 'sucesso');
    },
    [salvar, push]
  );

  const handleExcluir = useCallback(
    async (t: Tarefa) => {
      const removida = await excluir(t.id);
      if (!removida) return;
      setTarefaFocoId((atual) => (atual === t.id ? null : atual));
      push(`"${cortar(t.titulo)}" excluída`, 'info', {
        rotulo: 'Desfazer',
        fn: () => {
          void restaurar(removida);
        },
      });
    },
    [excluir, restaurar, push]
  );

  const handleMover = useCallback(
    async (id: string, status: StatusColuna) => {
      const ok = await mover(id, status);
      if (ok) push(`Movida para ${TITULO_COLUNA[status]}`, 'sucesso');
    },
    [mover, push]
  );

  const { focarAgora } = pomodoro;
  const iniciarFoco = useCallback(
    (t: Tarefa) => {
      setTarefaFocoId(t.id);
      if (t.status === 'a_fazer') void mover(t.id, 'em_progresso');
      focarAgora();
      push(`Foco iniciado: ${cortar(t.titulo)}`, 'info');
    },
    [mover, focarAgora, push]
  );

  const abrirPainelFoco = useCallback(() => {
    setAba('quadro');
    setPainelFoco(true);
    window.setTimeout(() => painelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  }, []);

  /* ------------------------------ backup / conta ------------------------------ */

  const exportarJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(tarefas, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ctoperacional-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    push('Backup exportado', 'sucesso');
  }, [tarefas, push]);

  const importarJSON = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = JSON.parse(String(reader.result));
          if (!Array.isArray(data)) {
            push('Arquivo inválido', 'erro');
            return;
          }
          const validas = data
            .map(sanitizarTarefa)
            .filter((t): t is Tarefa => t !== null);
          const payload: TarefaInput[] = validas.map((t) => ({
            titulo: t.titulo,
            descricao: t.descricao,
            prioridade: t.prioridade,
            status: t.status,
            prazo: t.prazo,
            pomodoros: t.pomodoros,
            pomodorosPlanejados: t.pomodorosPlanejados,
          }));
          const n = await importar(payload);
          if (n !== null) push(`${n} tarefas importadas`, 'sucesso');
        } catch {
          push('Erro ao importar arquivo', 'erro');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importar, push]
  );

  const confirmarZerarTarefas = async () => {
    setZerando(true);
    const ok = await zerar();
    setZerando(false);
    if (!ok) return;
    setTarefaFocoId(null);
    setConfirmarZerar(false);
    push('Todas as tarefas foram removidas', 'info');
  };

  const abrirModalExcluir = () => {
    setSenhaExcluir('');
    setErroExcluir(null);
    setModalExcluirAberto(true);
  };

  const handleExcluirConta = async () => {
    if (!senhaExcluir.trim()) {
      setErroExcluir('Digite sua senha para continuar.');
      return;
    }
    setExcluindo(true);
    setErroExcluir(null);
    try {
      await authService.excluirConta({ senha: senhaExcluir });
      limparCacheTarefas(usuario?.email ?? 'anon');
      localStorage.removeItem(POMODORO_STORAGE_KEY);
      window.location.href = '/';
    } catch (err: unknown) {
      setErroExcluir(mensagemDeErro(err, 'Não foi possível excluir a conta. Verifique sua senha.'));
      setExcluindo(false);
    }
  };

  /* ------------------------------ dados derivados ------------------------------ */

  const tarefasFiltradas = useMemo(() => {
    const termo = normalizar(buscaDeferred.trim());
    return tarefas
      .filter((t) => {
        if (statusFiltro !== 'Todos' && t.status !== statusFiltro) return false;
        if (prioridadeFiltro !== 'Todas' && t.prioridade !== prioridadeFiltro) return false;
        if (!termo) return true;
        return normalizar(t.titulo).includes(termo) || normalizar(t.descricao ?? '').includes(termo);
      })
      .sort(comparador(ordem));
  }, [tarefas, buscaDeferred, statusFiltro, prioridadeFiltro, ordem]);

  const stats = useMemo(() => {
    const s = {
      total: tarefas.length,
      a_fazer: 0,
      em_progresso: 0,
      revisao: 0,
      concluido: 0,
      alta: 0,
      media: 0,
      baixa: 0,
      atrasadas: 0,
      pomodoros: 0,
    };
    for (const t of tarefas) {
      s[t.status]++;
      s[t.prioridade]++;
      s.pomodoros += t.pomodoros ?? 0;
      if (t.prazo && t.prazo < hoje && t.status !== 'concluido') s.atrasadas++;
    }
    return { ...s, pct: s.total ? Math.round((s.concluido / s.total) * 100) : 0 };
  }, [tarefas, hoje]);

  const tarefasPorColuna = useMemo(() => {
    const map: Record<StatusColuna, Tarefa[]> = { a_fazer: [], em_progresso: [], revisao: [], concluido: [] };
    for (const t of tarefasFiltradas) map[t.status].push(t);
    return map;
  }, [tarefasFiltradas]);

  const filaFoco = useMemo(() => {
    const peso = (t: Tarefa) =>
      (t.prazo && t.prazo < hoje ? -100 : 0) +
      (t.prioridade === 'alta' ? 0 : t.prioridade === 'media' ? 10 : 20) +
      (t.status === 'em_progresso' ? -5 : 0);
    return tarefas
      .filter((t) => t.status !== 'concluido')
      .sort((a, b) => peso(a) - peso(b))
      .slice(0, 5);
  }, [tarefas, hoje]);

  const tarefasPomodoro = useMemo(
    () => tarefas.map((t) => ({ id: t.id, titulo: t.titulo, status: t.status })),
    [tarefas]
  );

  const filtrosAtivos = busca !== '' || statusFiltro !== 'Todos' || prioridadeFiltro !== 'Todas';
  const limparFiltros = () => {
    setBusca('');
    setStatusFiltro('Todos');
    setPrioridadeFiltro('Todas');
  };

  /* ------------------------------ paleta de comandos ------------------------------ */

  const abrirPaleta = useCallback(() => {
    setPaletaAberta(true);
    setBuscaPaleta('');
    setPaletaSelecionada(0);
  }, []);

  const { alternar: alternarPomodoro } = pomodoro;
  const paletaItens = useMemo(() => {
    const q = normalizar(buscaPaleta.trim());
    const comandos = [
      { id: 'nova', icon: '➕', titulo: 'Nova tarefa', sub: 'Atalho N', run: abrirFormNova },
      { id: 'pomo', icon: '🍅', titulo: 'Iniciar / pausar Pomodoro', sub: 'Atalho P', run: alternarPomodoro },
      { id: 'go-quadro', icon: '🗂️', titulo: 'Ir para Quadro', sub: 'Kanban', run: () => setAba('quadro') },
      { id: 'go-lista', icon: '📋', titulo: 'Ir para Lista', sub: 'Todas as tarefas', run: () => setAba('lista') },
      { id: 'go-relatorios', icon: '📈', titulo: 'Ir para Relatórios', sub: 'Métricas', run: () => setAba('relatorios') },
      { id: 'go-config', icon: '⚙️', titulo: 'Ir para Configurações', sub: 'Preferências', run: () => setAba('config') },
      { id: 'export', icon: '⬇️', titulo: 'Exportar backup', sub: 'Baixar JSON', run: exportarJSON },
      { id: 'theme', icon: tema === 'claro' ? '🌙' : '☀️', titulo: 'Alternar tema', sub: tema === 'claro' ? 'Ativar escuro' : 'Ativar claro', run: alternar },
    ];
    const listaComandos = comandos.filter(
      (c) => !q || normalizar(c.titulo).includes(q) || normalizar(c.sub).includes(q)
    );
    const listaTarefas = q
      ? tarefas
          .filter((t) => normalizar(t.titulo).includes(q) || normalizar(t.descricao ?? '').includes(q))
          .slice(0, 8)
          .map((t) => ({
            id: `tarefa-${t.id}`,
            icon: '📌',
            titulo: t.titulo,
            sub: `${TITULO_COLUNA[t.status]} · ${PRIORIDADE_LABEL[t.prioridade]}`,
            run: () => abrirFormEditar(t),
          }))
      : [];
    return { comandos: listaComandos, tarefas: listaTarefas, todos: [...listaComandos, ...listaTarefas] };
  }, [buscaPaleta, tarefas, tema, alternar, exportarJSON, abrirFormNova, abrirFormEditar, alternarPomodoro]);

  const onPaletaKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    const total = paletaItens.todos.length;
    if (total === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPaletaSelecionada((i) => (i + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPaletaSelecionada((i) => (i - 1 + total) % total);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = paletaItens.todos[paletaSelecionada];
      setPaletaAberta(false);
      item?.run();
    }
  };

  const executarItem = (run: () => void) => {
    setPaletaAberta(false);
    run();
  };

  /* ---------------------------------- atalhos ---------------------------------- */

  const algumOverlay = formAberto || paletaAberta || modalExcluirAberto || confirmarZerar || drawerMobileAberto;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const digitando =
        !!alvo && (['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName) || alvo.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (paletaAberta) setPaletaAberta(false);
        else abrirPaleta();
        return;
      }
      if (e.key === 'Escape') {
        setMenuUsuarioAberto(false);
        setDrawerMobileAberto(false);
        return;
      }
      if (digitando || algumOverlay || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'n') {
        e.preventDefault();
        abrirFormNova();
      } else if (k === 'p') {
        e.preventDefault();
        alternarPomodoro();
      } else if (e.key === '/') {
        e.preventDefault();
        if (aba !== 'quadro' && aba !== 'lista') setAba('quadro');
        setTimeout(() => buscaRef.current?.focus(), 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletaAberta, algumOverlay, aba, abrirPaleta, abrirFormNova, alternarPomodoro]);

  useEffect(() => {
    if (!menuUsuarioAberto) return;
    const fechar = () => setMenuUsuarioAberto(false);
    window.addEventListener('click', fechar);
    return () => window.removeEventListener('click', fechar);
  }, [menuUsuarioAberto]);

  /* ------------------------------ arrastar e soltar ------------------------------ */

  const onDragStart = useCallback((e: DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setArrastandoId(id);
  }, []);
  const onDragEnd = useCallback(() => {
    setArrastandoId(null);
    setColunaAlvo(null);
  }, []);
  const onDrop = (e: DragEvent, status: StatusColuna) => {
    e.preventDefault();
    setColunaAlvo(null);
    setArrastandoId(null);
    const id = e.dataTransfer.getData('text/plain');
    if (id) void handleMover(id, status);
  };
  const onDragOver = (e: DragEvent, status: StatusColuna) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (colunaAlvo !== status) setColunaAlvo(status);
  };
  const onDragLeave = (e: DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setColunaAlvo(null);
  };

  const navegarPara = (id: Aba) => {
    setAba(id);
    setDrawerMobileAberto(false);
  };

  const tituloAba = ABAS.find((a) => a.id === aba)?.titulo;

  /* ------------------------------- blocos de UI ------------------------------- */

  const barraFerramentas = (
    <div className="dash-toolbar">
      <div className="dash-filters" role="search" aria-label="Filtrar tarefas">
        <label className="sr-only" htmlFor="filtro-busca">Buscar tarefas</label>
        <input
          id="filtro-busca"
          ref={buscaRef}
          type="search"
          className="dash-input"
          placeholder="Buscar no título e na descrição…  ( / )"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <label className="sr-only" htmlFor="filtro-status">Filtrar por status</label>
        <select id="filtro-status" className="dash-select" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value as typeof statusFiltro)}>
          <option value="Todos">Todos os status</option>
          {COLUNAS.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
        </select>
        <label className="sr-only" htmlFor="filtro-prio">Filtrar por prioridade</label>
        <select id="filtro-prio" className="dash-select" value={prioridadeFiltro} onChange={(e) => setPrioridadeFiltro(e.target.value as typeof prioridadeFiltro)}>
          <option value="Todas">Todas as prioridades</option>
          {PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDADE_LABEL[p]}</option>)}
        </select>
        <label className="sr-only" htmlFor="filtro-ordem">Ordenar por</label>
        <select id="filtro-ordem" className="dash-select" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)}>
          {ORDENS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        {filtrosAtivos && (
          <button type="button" className="dash-btn dash-btn-ghost" onClick={limparFiltros}>Limpar filtros</button>
        )}
        <div className="dash-filters-spacer">
          {aba === 'quadro' && (
            <button
              type="button"
              className={`dash-btn dash-btn-ghost${painelFoco ? ' is-on' : ''}`}
              onClick={() => setPainelFoco((v) => !v)}
              aria-pressed={painelFoco}
              title="Mostrar ou esconder o painel de foco (Pomodoro e fila)"
            >
              <span aria-hidden="true">🍅</span> Foco
            </button>
          )}
          <button type="button" className="dash-btn dash-btn-primary" onClick={abrirFormNova} title="Nova tarefa com todos os campos (N)">
            <span aria-hidden="true">➕</span> Nova tarefa
          </button>
        </div>
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {filtrosAtivos ? `${tarefasFiltradas.length} tarefas encontradas` : ''}
      </div>
    </div>
  );

  const navItens = (aoClicar: (id: Aba) => void) => (
    <nav className="dash-nav" aria-label="Seções">
      {ABAS.map((a) => (
        <button
          key={a.id}
          type="button"
          className={`dash-nav-btn${aba === a.id ? ' is-active' : ''}`}
          onClick={() => aoClicar(a.id)}
          aria-current={aba === a.id ? 'page' : undefined}
        >
          <span className="dash-nav-icon" aria-hidden="true">{a.icon}</span>
          <span>{a.label}</span>
          {a.id === 'lista' && tarefas.length > 0 && <span className="dash-nav-badge">{tarefas.length}</span>}
        </button>
      ))}
    </nav>
  );

  const marca = (
    <div className="dash-brand">
      <span className="dash-brand-mark" aria-hidden="true">📋</span>
      <div className="dash-brand-text">
        <span className="dash-brand-name">CtOperacional</span>
        <span className="dash-brand-sub">Controle Operacional</span>
      </div>
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="dash" data-theme={tema}>
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>

        <aside className="dash-sidebar" aria-label="Navegação principal">
          {marca}
          {navItens(setAba)}
          <div className="dash-sidebar-footer">
            <button type="button" className="dash-nav-btn" onClick={abrirPaleta}>
              <span className="dash-nav-icon" aria-hidden="true">🔍</span>
              <span>Buscar…</span>
              <kbd className="dash-kbd" style={{ marginLeft: 'auto' }}>Ctrl K</kbd>
            </button>
            <button type="button" className="dash-nav-btn" onClick={alternar}>
              <span className="dash-nav-icon" aria-hidden="true">{tema === 'claro' ? '🌙' : '☀️'}</span>
              <span>{tema === 'claro' ? 'Modo escuro' : 'Modo claro'}</span>
            </button>
          </div>
        </aside>

        <div className="dash-main">
          <header className="dash-topbar">
            <div className="dash-topbar-left">
              <button type="button" className="dash-burger" onClick={() => setDrawerMobileAberto(true)} aria-label="Abrir menu" aria-expanded={drawerMobileAberto}>
                <span aria-hidden="true">☰</span>
              </button>
              <div style={{ minWidth: 0 }}>
                <h1 className="dash-title">{tituloAba}</h1>
                <p className="dash-subtitle">
                  {formatarData()} · {tarefas.length} {tarefas.length === 1 ? 'tarefa' : 'tarefas'}
                  {sincronizando ? ' · sincronizando…' : ''}
                </p>
              </div>
            </div>
            <div className="dash-topbar-right">
              <PomodoroMini pomodoro={pomodoro} onAbrir={abrirPainelFoco} />
              <button type="button" className="dash-search-trigger" onClick={abrirPaleta} aria-label="Abrir busca e comandos">
                <span className="dash-search-ico" aria-hidden="true">🔍</span>
                <span>Buscar…</span>
                <kbd className="dash-kbd">Ctrl K</kbd>
              </button>
              <button type="button" className="dash-icon-btn" onClick={alternar} aria-label={tema === 'claro' ? 'Ativar modo escuro' : 'Ativar modo claro'}>
                <span aria-hidden="true">{tema === 'claro' ? '🌙' : '☀️'}</span>
              </button>
              <div className="dash-user" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="dash-user-btn" onClick={() => setMenuUsuarioAberto((v) => !v)} aria-haspopup="menu" aria-expanded={menuUsuarioAberto} aria-label="Menu do usuário">
                  <span className="dash-avatar" aria-hidden="true">{iniciais(usuario?.nome)}</span>
                  <span className="dash-user-name">{usuario?.nome ?? 'Usuário'}</span>
                  <span className="chevron" aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted)' }}>▾</span>
                </button>
                {menuUsuarioAberto && (
                  <div role="menu" className="dash-menu">
                    <div className="dash-menu-header">
                      <div className="dash-menu-name">{usuario?.nome ?? 'Usuário'}</div>
                      <div className="dash-menu-email">{usuario?.email ?? ''}</div>
                    </div>
                    <button type="button" role="menuitem" className="dash-menu-item" onClick={() => { setMenuUsuarioAberto(false); setAba('config'); }}>
                      <span aria-hidden="true">⚙️</span> Configurações
                    </button>
                    <div style={{ padding: 4 }}>
                      <LogoutButton estilo={{ width: '100%', padding: '9px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, borderRadius: 8 }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main id="conteudo" className="dash-content" tabIndex={-1} aria-busy={estado === 'carregando'}>
            {estado === 'offline' && (
              <div className="dash-banner" role="alert">
                <span aria-hidden="true">⚠️</span>
                Sem conexão com o servidor — mostrando os dados salvos neste dispositivo. Alterações não serão salvas.
                <button type="button" className="dash-btn dash-btn-ghost" onClick={recarregar}>Tentar novamente</button>
              </div>
            )}

            {/* ------------------------------ QUADRO ------------------------------ */}
            {aba === 'quadro' && (
              <>
                <section className="dash-kpis" aria-label="Indicadores">
                  <KpiCard icon="📋" label="Total" value={stats.total} />
                  <KpiCard icon="⚡" label="Em progresso" value={stats.em_progresso} />
                  <KpiCard icon="✅" label="Concluídas" value={stats.concluido} hint={stats.total ? `${stats.pct}%` : undefined} />
                  <KpiCard icon="⏰" label="Atrasadas" value={stats.atrasadas} perigo={stats.atrasadas > 0} />
                </section>

                {barraFerramentas}

                <div className={`work-grid${painelFoco ? '' : ' sem-lateral'}`}>
                  <section aria-label="Quadro Kanban" style={{ minWidth: 0 }}>
                    <div className="kanban-board">
                      {COLUNAS.map((col) => (
                        <div
                          key={col.id}
                          className={`kanban-col${colunaAlvo === col.id ? ' is-over' : ''}`}
                          onDragOver={(e) => onDragOver(e, col.id)}
                          onDragLeave={onDragLeave}
                          onDrop={(e) => onDrop(e, col.id)}
                          role="group"
                          aria-label={`${col.titulo}, ${tarefasPorColuna[col.id].length} tarefas`}
                        >
                          <div className="kanban-col-head">
                            <h2 className="kanban-col-title"><span aria-hidden="true">{col.icon}</span>{col.titulo}</h2>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="kanban-col-count">{tarefasPorColuna[col.id].length}</span>
                              <button type="button" className="dash-row-btn" style={{ width: 30, height: 30 }} onClick={() => setColunaCriando(col.id)} aria-label={`Adicionar tarefa em ${col.titulo}`} title="Adicionar tarefa">+</button>
                            </span>
                          </div>
                          <div
                            className={`kanban-col-body${colunaCriando === col.id ? '' : ' is-clicavel'}`}
                            onClick={(e) => {
                              if (e.target === e.currentTarget) setColunaCriando(col.id);
                            }}
                          >
                            {tarefasPorColuna[col.id].map((t) => (
                              <CartaoTarefa
                                key={t.id}
                                t={t}
                                hoje={hoje}
                                emFoco={t.id === tarefaFocoId && pomodoro.ativo}
                                arrastando={t.id === arrastandoId}
                                onEditar={abrirFormEditar}
                                onExcluir={handleExcluir}
                                onMover={handleMover}
                                onFocar={iniciarFoco}
                                onDragStart={onDragStart}
                                onDragEnd={onDragEnd}
                              />
                            ))}
                            {tarefasPorColuna[col.id].length === 0 && colunaCriando !== col.id && (
                              <div className="kanban-empty" style={{ pointerEvents: 'none' }}>
                                {filtrosAtivos ? 'Nenhum resultado' : 'Clique aqui ou arraste uma tarefa'}
                              </div>
                            )}
                            {colunaCriando === col.id ? (
                              <NovaTarefaInline
                                statusInicial={col.id}
                                onAdicionar={(d) => void criarInline({ ...d, status: col.id })}
                                onCancelar={() => setColunaCriando(null)}
                              />
                            ) : (
                              <button type="button" className="kanban-add" onClick={() => setColunaCriando(col.id)}>
                                <span aria-hidden="true">+</span> Adicionar tarefa
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {painelFoco && (
                    <aside ref={painelRef} className="work-side" aria-label="Foco e prioridades">
                      <Pomodoro
                        pomodoro={pomodoro}
                        tarefas={tarefasPomodoro}
                        tarefaId={tarefaFocoId}
                        onTarefaChange={setTarefaFocoId}
                      />
                      <section className="dash-panel" aria-labelledby="fila-titulo">
                        <div className="dash-panel-head">
                          <h2 className="dash-panel-title" id="fila-titulo">Próximas para focar</h2>
                        </div>
                        {filaFoco.length === 0 ? (
                          <p className="dash-panel-meta">Nenhuma tarefa pendente.</p>
                        ) : (
                          <ul className="focus-list">
                            {filaFoco.map((t) => (
                              <li key={t.id} className="focus-item">
                                <div className="focus-item-text">
                                  <div className="focus-item-title">{t.titulo}</div>
                                  <div className="focus-item-sub">
                                    {PRIORIDADE_LABEL[t.prioridade]}
                                    {t.prazo ? ` · ${t.prazo < hoje ? 'atrasada ' : ''}${rotuloPrazo(t.prazo, hoje)}` : ''}
                                  </div>
                                </div>
                                <button type="button" className="dash-row-btn" onClick={() => iniciarFoco(t)} aria-label={`Focar em ${t.titulo}`} title="Focar agora">
                                  <span aria-hidden="true">🍅</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    </aside>
                  )}
                </div>
              </>
            )}

            {/* ------------------------------- LISTA ------------------------------ */}
            {aba === 'lista' && (
              <>
                <section className="dash-kpis" aria-label="Resumo">
                  <KpiCard icon="📋" label="Total" value={stats.total} />
                  <KpiCard icon="📌" label="A fazer" value={stats.a_fazer} />
                  <KpiCard icon="⚡" label="Em progresso" value={stats.em_progresso} />
                  <KpiCard icon="✅" label="Concluídas" value={stats.concluido} />
                </section>

                {barraFerramentas}

                <section className="dash-panel" aria-labelledby="lista-titulo">
                  <div className="dash-panel-head">
                    <h2 className="dash-panel-title" id="lista-titulo">Todas as tarefas</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="dash-panel-meta">{tarefasFiltradas.length} de {tarefas.length}</span>
                      {!criandoNaLista && (
                        <button type="button" className="dash-btn dash-btn-primary" onClick={() => setCriandoNaLista(true)}>
                          <span aria-hidden="true">➕</span> Adicionar tarefa
                        </button>
                      )}
                    </div>
                  </div>
                  {criandoNaLista && (
                    <div className="list-composer">
                      <NovaTarefaInline
                        statusInicial="a_fazer"
                        escolherStatus
                        onAdicionar={(d) => void criarInline(d)}
                        onCancelar={() => setCriandoNaLista(false)}
                      />
                    </div>
                  )}
                  {tarefasFiltradas.length === 0 ? (
                    <div className="dash-empty">
                      <span className="dash-empty-icon" aria-hidden="true">{tarefas.length === 0 ? '📋' : '🔎'}</span>
                      <h3 className="dash-empty-title">{tarefas.length === 0 ? 'Nenhuma tarefa ainda' : 'Nenhum resultado'}</h3>
                      <p className="dash-empty-desc">
                        {tarefas.length === 0 ? 'Crie sua primeira tarefa para organizar a operação.' : 'Nenhuma tarefa corresponde aos filtros.'}
                      </p>
                      {tarefas.length === 0 ? (
                        <button type="button" className="dash-btn dash-btn-primary" onClick={() => setCriandoNaLista(true)}>➕ Criar primeira tarefa</button>
                      ) : (
                        <button type="button" className="dash-btn dash-btn-ghost" onClick={limparFiltros}>Limpar filtros</button>
                      )}
                    </div>
                  ) : (
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th scope="col" className="col-titulo">Título</th>
                            <th scope="col" className="col-desc">Descrição</th>
                            <th scope="col">Status</th>
                            <th scope="col">Prioridade</th>
                            <th scope="col">Prazo</th>
                            <th scope="col">Pomodoros</th>
                            <th scope="col"><span className="sr-only">Ações</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {tarefasFiltradas.map((t) => {
                            const atrasada = !!t.prazo && t.prazo < hoje && t.status !== 'concluido';
                            return (
                              <tr key={t.id}>
                                <td>
                                  <button type="button" className="cell-titulo" onClick={() => abrirFormEditar(t)} title="Abrir para editar">{t.titulo}</button>
                                </td>
                                <td>
                                  {t.descricao ? <p className="cell-desc">{t.descricao}</p> : <span style={{ color: 'var(--muted)' }}>—</span>}
                                </td>
                                <td>
                                  <select className="dash-select" value={t.status} aria-label={`Status de ${t.titulo}`} onChange={(e) => void handleMover(t.id, e.target.value as StatusColuna)}>
                                    {COLUNAS.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                                  </select>
                                </td>
                                <td><span className={`kanban-prio ${t.prioridade}`}>{PRIORIDADE_LABEL[t.prioridade]}</span></td>
                                <td>
                                  {t.prazo ? <span className={`tag${atrasada ? ' is-late' : ''}`}>{rotuloPrazo(t.prazo, hoje)}{atrasada ? ' · atrasada' : ''}</span> : <span style={{ color: 'var(--muted)' }}>—</span>}
                                </td>
                                <td><ChipPomodoro t={t} emFoco={t.id === tarefaFocoId && pomodoro.ativo} onFocar={iniciarFoco} /></td>
                                <td className="actions-cell">
                                  <div className="dash-row-actions">
                                    <button type="button" className="dash-row-btn" onClick={() => abrirFormEditar(t)} aria-label={`Editar ${t.titulo}`}><IconEdit /></button>
                                    <button type="button" className="dash-row-btn is-danger" onClick={() => void handleExcluir(t)} aria-label={`Excluir ${t.titulo}`}><IconTrash /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}

            {/* ----------------------------- RELATÓRIOS ---------------------------- */}
            {aba === 'relatorios' && (
              <>
                <section className="dash-kpis" aria-label="Indicadores">
                  <KpiCard icon="📋" label="Total" value={stats.total} />
                  <KpiCard icon="✅" label="Concluídas" value={stats.concluido} hint={stats.total ? `${stats.pct}%` : undefined} />
                  <KpiCard icon="⏰" label="Atrasadas" value={stats.atrasadas} perigo={stats.atrasadas > 0} />
                  <KpiCard icon="🍅" label="Pomodoros (tarefas)" value={stats.pomodoros} />
                  <KpiCard icon="⏱️" label="Foco hoje" value={`${pomodoro.dia.minutos} min`} hint={`${pomodoro.dia.focos}×`} />
                </section>
                <div className="report-grid">
                  <section className="dash-panel" aria-labelledby="rel-status">
                    <div className="dash-panel-head"><h2 className="dash-panel-title" id="rel-status">Distribuição por status</h2></div>
                    {stats.total === 0 ? <p className="dash-panel-meta">Nenhuma tarefa.</p> : COLUNAS.map((c) => (
                      <div key={c.id} className="bar-row">
                        <span>{c.icon} {c.titulo}</span>
                        <div className="bar-track" aria-hidden="true">
                          <div className={`bar-fill${c.id === 'concluido' ? ' ok' : ''}`} style={{ width: `${(stats[c.id] / stats.total) * 100}%` }} />
                        </div>
                        <span className="bar-num">{stats[c.id]}</span>
                      </div>
                    ))}
                  </section>
                  <section className="dash-panel" aria-labelledby="rel-prio">
                    <div className="dash-panel-head"><h2 className="dash-panel-title" id="rel-prio">Distribuição por prioridade</h2></div>
                    {stats.total === 0 ? <p className="dash-panel-meta">Nenhuma tarefa.</p> : [...PRIORIDADES].reverse().map((p) => (
                      <div key={p} className="bar-row">
                        <span>{PRIORIDADE_LABEL[p]}</span>
                        <div className="bar-track" aria-hidden="true">
                          <div className={`bar-fill ${p}`} style={{ width: `${(stats[p] / stats.total) * 100}%` }} />
                        </div>
                        <span className="bar-num">{stats[p]}</span>
                      </div>
                    ))}
                  </section>
                </div>
              </>
            )}

            {/* ---------------------------- CONFIGURAÇÕES ---------------------------- */}
            {aba === 'config' && (
              <>
                <section className="dash-panel" aria-labelledby="cfg-pref">
                  <div className="dash-panel-head"><h2 className="dash-panel-title" id="cfg-pref">Preferências</h2></div>
                  <div className="dash-config-row">
                    <div>
                      <div className="dash-config-label">Tema</div>
                      <div className="dash-config-desc">Claro ou escuro</div>
                    </div>
                    <button type="button" className="dash-btn dash-btn-ghost" onClick={alternar}>
                      {tema === 'claro' ? '🌙 Ativar escuro' : '☀️ Ativar claro'}
                    </button>
                  </div>
                  <div className="dash-config-row">
                    <div>
                      <div className="dash-config-label">Backup</div>
                      <div className="dash-config-desc">Exportar / importar JSON (a importação envia as tarefas para a sua conta)</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="dash-btn dash-btn-ghost" onClick={exportarJSON}>⬇️ Exportar</button>
                      <button type="button" className="dash-btn dash-btn-ghost" onClick={() => fileInputRef.current?.click()}>⬆️ Importar</button>
                    </div>
                  </div>
                  <div className="dash-config-row">
                    <div>
                      <div className="dash-config-label">Atalhos de teclado</div>
                      <div className="dash-config-desc">
                        <kbd className="dash-kbd">N</kbd> nova tarefa · <kbd className="dash-kbd">/</kbd> buscar · <kbd className="dash-kbd">P</kbd> Pomodoro · <kbd className="dash-kbd">Ctrl K</kbd> comandos · <kbd className="dash-kbd">Ctrl Enter</kbd> salvar no editor
                      </div>
                    </div>
                  </div>
                  <div className="dash-config-row">
                    <div>
                      <div className="dash-config-label">Conta</div>
                      <div className="dash-config-desc">{usuario?.email ?? 'Sessão ativa'}</div>
                    </div>
                    <LogoutButton />
                  </div>
                  <div className="dash-config-row">
                    <div>
                      <div className="dash-config-label">Zerar tarefas</div>
                      <div className="dash-config-desc">Remove todas as tarefas da sua conta</div>
                    </div>
                    <button type="button" className="dash-btn dash-btn-danger" onClick={() => setConfirmarZerar(true)}>Zerar tarefas</button>
                  </div>
                </section>
                <section className="dash-danger-zone" aria-labelledby="zona-perigo">
                  <h2 className="dash-danger-title" id="zona-perigo"><span aria-hidden="true">⚠️</span> Zona de Perigo</h2>
                  <p className="dash-danger-desc">Ações irreversíveis.</p>
                  <div className="dash-danger-row">
                    <div>
                      <div className="dash-config-label">Excluir minha conta</div>
                      <div className="dash-config-desc">Apaga permanentemente a conta e os dados.</div>
                    </div>
                    <button type="button" className="dash-btn dash-btn-danger" onClick={abrirModalExcluir}>Excluir conta</button>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>

        {/* drawer mobile */}
        {drawerMobileAberto && (
          <>
            <div className="dash-mobile-backdrop" onClick={() => setDrawerMobileAberto(false)} aria-hidden="true" />
            <aside ref={drawerRef} className="dash-mobile-drawer" role="dialog" aria-modal="true" aria-label="Navegação" tabIndex={-1}>
              {marca}
              {navItens(navegarPara)}
              <div className="dash-sidebar-footer">
                <button type="button" className="dash-nav-btn" onClick={() => { setDrawerMobileAberto(false); alternar(); }}>
                  <span className="dash-nav-icon" aria-hidden="true">{tema === 'claro' ? '🌙' : '☀️'}</span>
                  <span>{tema === 'claro' ? 'Modo escuro' : 'Modo claro'}</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* modal: criar / editar tarefa */}
        {formAberto && (
          <Modal
            rotulo={tarefaEditando ? 'Editar tarefa' : 'Nova tarefa'}
            onFechar={fecharForm}
            className="dash-modal is-wide"
            bloquear={salvandoForm}
          >
            <h2 className="dash-modal-title">{tarefaEditando ? 'Editar tarefa' : 'Nova tarefa'}</h2>
            <form
              onSubmit={handleSalvar}
              noValidate
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void handleSalvar();
                }
              }}
            >
              <div className="field">
                <div className="field-head">
                  <label className="form-label" htmlFor="f-titulo">Título *</label>
                  <Contador atual={form.titulo.length} max={LIMITES.titulo} />
                </div>
                <input
                  id="f-titulo"
                  ref={tituloRef}
                  className="dash-input dash-input-lg"
                  placeholder="O que precisa ser feito?"
                  value={form.titulo}
                  maxLength={LIMITES.titulo}
                  onChange={(e) => setCampo('titulo', e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="field">
                <div className="field-head">
                  <label className="form-label" htmlFor="f-desc">Descrição</label>
                  <Contador atual={form.descricao.length} max={LIMITES.descricao} />
                </div>
                <textarea
                  id="f-desc"
                  className="dash-input dash-textarea-lg"
                  placeholder="Detalhes, contexto, links, passos a seguir…"
                  value={form.descricao}
                  maxLength={LIMITES.descricao}
                  onChange={(e) => setCampo('descricao', e.target.value)}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label className="form-label" htmlFor="f-prio">Prioridade</label>
                  <select id="f-prio" className="dash-select" value={form.prioridade} onChange={(e) => setCampo('prioridade', e.target.value as Prioridade)}>
                    {PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDADE_LABEL[p]}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="form-label" htmlFor="f-status">Status</label>
                  <select id="f-status" className="dash-select" value={form.status} onChange={(e) => setCampo('status', e.target.value as StatusColuna)}>
                    {COLUNAS.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="form-label" htmlFor="f-prazo">Prazo (opcional)</label>
                  <input id="f-prazo" type="date" className="dash-input" value={form.prazo} onChange={(e) => setCampo('prazo', e.target.value)} />
                </div>
                <div className="field">
                  <span className="form-label" id="f-pomos-label">Pomodoros planejados</span>
                  <div className="ptask-row" role="group" aria-labelledby="f-pomos-label">
                    <button type="button" className="ptask-step" onClick={() => setCampo('pomos', Math.max(0, form.pomos - 1))} disabled={form.pomos <= 0} aria-label="Diminuir pomodoros planejados">−</button>
                    <span className="ptask-count" aria-live="polite"><span aria-hidden="true">🍅</span> {form.pomos}</span>
                    <button type="button" className="ptask-step" onClick={() => setCampo('pomos', Math.min(LIMITES.pomodorosPlanejados, form.pomos + 1))} aria-label="Aumentar pomodoros planejados">+</button>
                  </div>
                </div>
              </div>
              {tarefaEditando && (
                <p className="form-meta">
                  Criada em {new Date(tarefaEditando.criadoEm).toLocaleDateString('pt-BR')} · {tarefaEditando.pomodoros ?? 0} pomodoros concluídos
                </p>
              )}
              <div className="dash-modal-actions">
                {tarefaEditando && (
                  <button
                    type="button"
                    className="dash-btn dash-btn-danger-ghost spacer"
                    disabled={salvandoForm}
                    onClick={() => {
                      const alvo = tarefaEditando;
                      fecharForm();
                      void handleExcluir(alvo);
                    }}
                  >
                    Excluir
                  </button>
                )}
                <button type="button" className="dash-btn dash-btn-ghost" onClick={fecharForm} disabled={salvandoForm}>Cancelar</button>
                <button type="submit" className="dash-btn dash-btn-primary" disabled={salvandoForm}>
                  {salvandoForm ? 'Salvando…' : tarefaEditando ? 'Salvar alterações' : 'Criar tarefa'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* modal: zerar tarefas */}
        {confirmarZerar && (
          <Modal rotulo="Apagar todas as tarefas" onFechar={() => setConfirmarZerar(false)} bloquear={zerando}>
            <div className="dash-modal-icon" aria-hidden="true">🗑️</div>
            <h2 className="dash-modal-title is-danger">Apagar todas as tarefas?</h2>
            <p className="dash-modal-desc">Serão removidas {tarefas.length} tarefas da sua conta. Esta ação não pode ser desfeita. Se quiser, exporte um backup antes.</p>
            <div className="dash-modal-actions">
              <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setConfirmarZerar(false)} disabled={zerando}>Cancelar</button>
              <button type="button" className="dash-btn dash-btn-danger" onClick={() => void confirmarZerarTarefas()} disabled={zerando}>
                {zerando ? 'Apagando…' : 'Sim, apagar tudo'}
              </button>
            </div>
          </Modal>
        )}

        {/* modal: excluir conta */}
        {modalExcluirAberto && (
          <Modal rotulo="Excluir conta" onFechar={() => setModalExcluirAberto(false)} bloquear={excluindo}>
            <div className="dash-modal-icon" aria-hidden="true">⚠️</div>
            <h2 className="dash-modal-title is-danger">Excluir conta permanentemente?</h2>
            <p className="dash-modal-desc">Esta ação é <strong>irreversível</strong>. Digite sua senha para confirmar.</p>
            <label htmlFor="senha-excluir" className="dash-modal-label">Senha atual</label>
            <input
              id="senha-excluir"
              type="password"
              className="dash-input"
              style={{ width: '100%' }}
              placeholder="Digite sua senha"
              value={senhaExcluir}
              onChange={(e) => setSenhaExcluir(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !excluindo) void handleExcluirConta(); }}
              autoFocus
              disabled={excluindo}
              autoComplete="current-password"
              aria-invalid={!!erroExcluir}
              aria-describedby={erroExcluir ? 'erro-excluir' : undefined}
            />
            {erroExcluir && <p id="erro-excluir" className="dash-error-inline" role="alert">{erroExcluir}</p>}
            <div className="dash-modal-actions">
              <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setModalExcluirAberto(false)} disabled={excluindo}>Cancelar</button>
              <button type="button" className="dash-btn dash-btn-danger" onClick={() => void handleExcluirConta()} disabled={excluindo || !senhaExcluir.trim()}>
                {excluindo ? 'Excluindo…' : 'Sim, excluir conta'}
              </button>
            </div>
          </Modal>
        )}

        {/* paleta de comandos */}
        {paletaAberta && (
          <Modal rotulo="Paleta de comandos" onFechar={() => setPaletaAberta(false)} className="dash-palette" topo>
            <input
              type="text"
              className="dash-palette-input"
              placeholder="Buscar comandos ou tarefas…"
              aria-label="Buscar comandos ou tarefas"
              value={buscaPaleta}
              onChange={(e) => { setBuscaPaleta(e.target.value); setPaletaSelecionada(0); }}
              onKeyDown={onPaletaKeyDown}
              autoFocus
            />
            <div className="dash-palette-list" role="listbox" aria-label="Resultados">
              {paletaItens.todos.length === 0 && <div className="dash-palette-empty">Nada encontrado.</div>}
              {paletaItens.comandos.length > 0 && <div className="dash-palette-group" aria-hidden="true">Ações</div>}
              {paletaItens.comandos.map((item, i) => (
                <button key={item.id} type="button" role="option" aria-selected={i === paletaSelecionada} tabIndex={-1}
                  className={`dash-palette-item${i === paletaSelecionada ? ' is-selected' : ''}`}
                  onMouseEnter={() => setPaletaSelecionada(i)} onClick={() => executarItem(item.run)}>
                  <span className="dash-palette-item-icon" aria-hidden="true">{item.icon}</span>
                  <span className="dash-palette-item-text">
                    <span className="dash-palette-item-title">{item.titulo}</span>
                    <span className="dash-palette-item-sub">{item.sub}</span>
                  </span>
                </button>
              ))}
              {paletaItens.tarefas.length > 0 && <div className="dash-palette-group" aria-hidden="true">Tarefas</div>}
              {paletaItens.tarefas.map((item, i) => {
                const idx = paletaItens.comandos.length + i;
                return (
                  <button key={item.id} type="button" role="option" aria-selected={idx === paletaSelecionada} tabIndex={-1}
                    className={`dash-palette-item${idx === paletaSelecionada ? ' is-selected' : ''}`}
                    onMouseEnter={() => setPaletaSelecionada(idx)} onClick={() => executarItem(item.run)}>
                    <span className="dash-palette-item-icon" aria-hidden="true">{item.icon}</span>
                    <span className="dash-palette-item-text">
                      <span className="dash-palette-item-title">{item.titulo}</span>
                      <span className="dash-palette-item-sub">{item.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Modal>
        )}

        {/* notificações */}
        <div className="dash-toasts" role="region" aria-label="Notificações" aria-live="polite">
          {toasts.map((tst) => (
            <div key={tst.id} className={`dash-toast dash-toast--${tst.tipo}`}>
              <span className="dash-toast-icon" aria-hidden="true">
                {tst.tipo === 'sucesso' ? '✓' : tst.tipo === 'erro' ? '!' : 'i'}
              </span>
              <span className="dash-toast-text">{tst.texto}</span>
              {tst.acao && (
                <button type="button" className="dash-toast-action" onClick={() => { tst.acao?.fn(); remover(tst.id); }}>
                  {tst.acao.rotulo}
                </button>
              )}
              <button type="button" className="dash-toast-close" onClick={() => remover(tst.id)} aria-label="Fechar notificação">
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          ))}
        </div>

        <input ref={fileInputRef} type="file" accept="application/json" onChange={importarJSON} style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
      </div>
    </>
  );
}

/** Os providers ficam aqui dentro: não precisa mexer em App.tsx / rotas. */
export default function Dashboard() {
  return (
    <ToastProvider>
      <TarefasProvider>
        <DashboardConteudo />
      </TarefasProvider>
    </ToastProvider>
  );
}