import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useDeferredValue,
  useRef,
} from 'react';
import LogoutButton from '../components/LogoutButton';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';

const STORAGE_KEY = 'ctoperacional:tarefas';
const THEME_KEY = 'ctoperacional:tema';

type Aba = 'quadro' | 'lista' | 'relatorios' | 'config';
type Tema = 'claro' | 'escuro';
type Prioridade = 'baixa' | 'media' | 'alta';
type StatusColuna = 'a_fazer' | 'em_progresso' | 'revisao' | 'concluido';

type Tarefa = {
  id: string;
  titulo: string;
  descricao?: string;
  prioridade: Prioridade;
  status: StatusColuna;
  criadoEm: string;
};

type Toast = { id: string; texto: string; tipo: 'sucesso' | 'erro' | 'info' };
type ErroApi = { response?: { data?: { mensagem?: string } } };

const COLUNAS: { id: StatusColuna; titulo: string; icon: string }[] = [
  { id: 'a_fazer', titulo: 'A fazer', icon: '📋' },
  { id: 'em_progresso', titulo: 'Em progresso', icon: '⚡' },
  { id: 'revisao', titulo: 'Revisão', icon: '🔍' },
  { id: 'concluido', titulo: 'Concluído', icon: '✅' },
];

const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

const normalizar = (txt: string) =>
  txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const formatarData = () =>
  new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

const iniciais = (nome?: string) => {
  if (!nome) return '?';
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
};

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function useTarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Tarefa[];
    } catch {
      /* ignore */
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas));
  }, [tarefas]);

  const salvar = useCallback((tarefa: Tarefa) => {
    setTarefas((prev) => {
      const idx = prev.findIndex((t) => t.id === tarefa.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = tarefa;
        return next;
      }
      return [...prev, tarefa];
    });
  }, []);

  const excluir = useCallback((id: string) => {
    setTarefas((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mover = useCallback((id: string, novoStatus: StatusColuna) => {
    setTarefas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: novoStatus } : t))
    );
  }, []);

  const importar = useCallback((novas: Tarefa[]) => {
    setTarefas((prev) => [...prev, ...novas]);
  }, []);

  const zerar = useCallback(() => {
    setTarefas([]);
  }, []);

  return { tarefas, salvar, excluir, mover, importar, zerar };
}

function useTema() {
  const [tema, setTema] = useState<Tema>(() => {
    const salvo = localStorage.getItem(THEME_KEY) as Tema | null;
    if (salvo) return salvo;
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'escuro';
    return 'claro';
  });
  useEffect(() => localStorage.setItem(THEME_KEY, tema), [tema]);
  const alternar = useCallback(
    () => setTema((t) => (t === 'claro' ? 'escuro' : 'claro')),
    []
  );
  return { tema, alternar };
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((texto: string, tipo: Toast['tipo'] = 'info') => {
    const id = uid();
    setToasts((t) => [...t, { id, texto, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);
  const remover = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);
  return { toasts, push, remover };
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

const STYLES = `
.dash {
  --bg: #f8fafc;
  --surface: #ffffff;
  --surface-2: #f1f5f9;
  --surface-3: #e2e8f0;
  --sidebar: #ffffff;
  --ink: #0f172a;
  --ink-soft: #334155;
  --muted: #64748b;
  --border: #e2e8f0;
  --border-strong: #cbd5e1;
  --brand: #2563eb;          /* Blue 600 */
  --brand-2: #3b82f6;        /* Blue 500 (focus ring) */
  --brand-3: #1d4ed8;        /* Blue 700 (hover) */
  --brand-soft: #eff6ff;     /* Blue 50 */
  --brand-ink: #ffffff;
  --danger: #dc2626;
  --danger-soft: #fef2f2;
  --danger-line: #fca5a5;
  --warn: #d97706;
  --info: #2563eb;
  --ok: #059669;
  --ok-soft: #ecfdf5;
  --shadow-sm: 0 1px 2px rgba(15,23,42,.04);
  --shadow-md: 0 6px 20px -10px rgba(15,23,42,.18);
  --shadow-lg: 0 24px 60px -20px rgba(15,23,42,.32);
  --scroll-shadow: rgba(15,23,42,.18);
  --radius: 14px;
  --radius-sm: 10px;

  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 260px 1fr;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.dash[data-theme="escuro"] {
  --bg: #0b0f1a;
  --surface: #111827;
  --surface-2: #1e293b;
  --surface-3: #334155;
  --sidebar: #0f172a;
  --ink: #f1f5f9;
  --ink-soft: #cbd5e1;
  --muted: #94a3b8;
  --border: #334155;
  --border-strong: #475569;
  --brand: #60a5fa;          /* Blue 400 */
  --brand-2: #93c5fd;        /* Blue 300 (focus ring) */
  --brand-3: #93c5fd;        /* Blue 300 (texto ativo) */
  --brand-soft: #1e3a5f;     /* Soft dark blue */
  --brand-ink: #0f172a;
  --danger: #f87171;
  --danger-soft: #450a0a;
  --danger-line: #7f1d1d;
  --warn: #fbbf24;
  --info: #60a5fa;
  --ok: #34d399;
  --ok-soft: #064e3b;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.4);
  --shadow-md: 0 6px 20px -10px rgba(0,0,0,.55);
  --shadow-lg: 0 24px 60px -20px rgba(0,0,0,.7);
  --scroll-shadow: rgba(0,0,0,.6);
}

.dash *, .dash *::before, .dash *::after { box-sizing: border-box; }
.dash h1, .dash h2, .dash h3 { margin: 0; letter-spacing: -.02em; }
.dash p { margin: 0; }
.dash button, .dash input, .dash select, .dash textarea { font-family: inherit; color: inherit; }
.dash a { color: inherit; text-decoration: none; }

.dash :focus-visible {
  outline: 3px solid var(--brand-2);
  outline-offset: 2px;
  border-radius: 8px;
}
.dash[data-theme="escuro"] :focus-visible { outline-color: var(--brand); }

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

.dash-sidebar {
  display: flex; flex-direction: column; gap: 6px;
  padding: 20px 14px; background: var(--sidebar);
  border-right: 1px solid var(--border);
  position: sticky; top: 0; height: 100vh; height: 100dvh; overflow-y: auto;
}
.dash-brand {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 8px 16px; border-bottom: 1px solid var(--border); margin-bottom: 12px;
}
.dash-brand-mark {
  width: 38px; height: 38px; border-radius: 11px;
  display: grid; place-items: center; font-size: 20px;
  background: var(--brand-soft); border: 1px solid var(--border); flex-shrink: 0;
}
.dash-brand-text { display: flex; flex-direction: column; }
.dash-brand-name { font-weight: 700; font-size: 15px; color: var(--ink); }
.dash-brand-sub { font-size: 11.5px; color: var(--muted); }

.dash-nav-label {
  font-size: 10.5px; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; color: var(--muted); padding: 8px 10px 6px;
}
.dash-nav { display: flex; flex-direction: column; gap: 2px; }
.dash-nav-btn {
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 10px 12px; border: none; border-radius: var(--radius-sm);
  background: transparent; color: var(--ink-soft); cursor: pointer;
  font-size: 13.5px; font-weight: 500; text-align: left;
  transition: background .15s, color .15s;
}
.dash-nav-btn:hover { background: var(--brand-soft); color: var(--ink); }
.dash-nav-btn.is-active {
  background: var(--brand-soft); color: var(--brand); font-weight: 700;
}
.dash[data-theme="escuro"] .dash-nav-btn.is-active { color: var(--brand-3); }
.dash-nav-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
.dash-nav-badge {
  margin-left: auto; font-size: 11px; font-weight: 700;
  background: var(--brand); color: var(--brand-ink);
  padding: 2px 8px; border-radius: 999px; font-variant-numeric: tabular-nums;
}
.dash-sidebar-footer {
  margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 4px;
}

.dash-main { display: flex; flex-direction: column; min-width: 0; }
.dash-topbar {
  position: sticky; top: 0; z-index: 30;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 14px 28px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--border); min-height: 64px;
}
.dash-topbar-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.dash-burger {
  display: none; width: 40px; height: 40px;
  align-items: center; justify-content: center;
  background: transparent; border: 1px solid var(--border);
  border-radius: var(--radius-sm); cursor: pointer; font-size: 18px; color: var(--ink);
}
.dash-title {
  font-size: 18px; font-weight: 800; letter-spacing: -.02em; line-height: 1.2; color: var(--ink);
}
.dash-subtitle {
  font-size: 12.5px; color: var(--muted); margin-top: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dash-topbar-right { display: flex; align-items: center; gap: 8px; }
.dash-search-trigger {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: var(--surface-2);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  cursor: pointer; font-size: 13px; color: var(--muted);
  transition: border-color .15s, background .15s, color .15s; min-width: 200px;
}
.dash-search-trigger:hover { border-color: var(--border-strong); color: var(--ink); }
.dash-search-trigger kbd {
  margin-left: auto; font-family: inherit; font-size: 10.5px; font-weight: 700;
  padding: 2px 6px; border-radius: 5px; background: var(--surface);
  border: 1px solid var(--border); color: var(--ink-soft);
}
.dash-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; background: transparent;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  cursor: pointer; font-size: 15px; color: var(--ink);
  transition: background .15s, border-color .15s, color .15s;
}
.dash-icon-btn:hover {
  background: var(--brand-soft); border-color: var(--brand); color: var(--brand);
}
.dash[data-theme="escuro"] .dash-icon-btn:hover { color: var(--brand-3); }

.dash-user { position: relative; }
.dash-user-btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 4px 12px 4px 4px; background: transparent;
  border: 1px solid var(--border); border-radius: 999px; cursor: pointer;
  transition: border-color .15s, background .15s; color: var(--ink);
}
.dash-user-btn:hover { border-color: var(--border-strong); background: var(--surface-2); }
.dash-user-name {
  font-size: 13px; font-weight: 600; max-width: 140px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink);
}
.dash-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: grid; place-items: center; color: var(--brand-ink);
  font-weight: 700; font-size: 12px; background: var(--brand); flex-shrink: 0;
}

.dash-menu {
  position: absolute; top: calc(100% + 8px); right: 0; min-width: 260px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); box-shadow: var(--shadow-lg); padding: 8px; z-index: 50;
  animation: dashPop .16s cubic-bezier(.2,.7,.2,1);
}
@keyframes dashPop {
  from { opacity: 0; transform: translateY(-4px) scale(.98); }
  to { opacity: 1; transform: none; }
}
.dash-menu-header {
  padding: 10px 12px 12px; border-bottom: 1px solid var(--border); margin-bottom: 6px;
}
.dash-menu-name { font-size: 13.5px; font-weight: 700; color: var(--ink); }
.dash-menu-email { font-size: 12px; color: var(--muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; }
.dash-menu-item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 9px 12px; border: none; background: transparent; border-radius: 8px;
  cursor: pointer; font-size: 13px; text-align: left; color: var(--ink); transition: background .12s;
}
.dash-menu-item:hover { background: var(--brand-soft); }

.dash-content {
  padding: 24px 28px 80px; display: flex; flex-direction: column; gap: 20px;
  max-width: 1600px; width: 100%; margin: 0 auto;
}

.dash-kpis {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;
}
.dash-kpi {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 18px; transition: transform .18s, box-shadow .18s, border-color .18s;
}
.dash-kpi:hover {
  transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--border-strong);
}
.dash-kpi-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.dash-kpi-icon {
  width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center;
  font-size: 17px; background: var(--brand-soft); color: var(--brand); border: 1px solid var(--border);
}
.dash[data-theme="escuro"] .dash-kpi-icon { color: var(--brand-3); }
.dash-kpi-label {
  font-size: 11.5px; color: var(--muted); text-transform: uppercase;
  letter-spacing: .08em; font-weight: 700; margin-top: 14px;
}
.dash-kpi-value {
  font-size: 22px; font-weight: 800; letter-spacing: -.03em; margin-top: 4px;
  font-variant-numeric: tabular-nums; color: var(--ink);
}

.dash-panel {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px 22px;
}
.dash-panel-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
}
.dash-panel-title { font-size: 14.5px; font-weight: 700; letter-spacing: -.01em; color: var(--ink); }
.dash-panel-meta { font-size: 12.5px; color: var(--muted); font-weight: 500; }
.dash-panel-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.kanban-board {
  display: grid; grid-template-columns: repeat(4, minmax(240px, 1fr));
  gap: 16px; align-items: start; overflow-x: auto; padding-bottom: 8px;
}
.kanban-col {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--radius); min-height: 320px; display: flex; flex-direction: column;
}
.kanban-col-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; padding: 14px 14px 10px; border-bottom: 1px solid var(--border);
}
.kanban-col-title {
  font-size: 13px; font-weight: 700; color: var(--ink);
  display: flex; align-items: center; gap: 8px;
}
.kanban-col-count {
  font-size: 11px; font-weight: 700; background: var(--brand-soft);
  color: var(--brand); padding: 2px 8px; border-radius: 999px;
}
.dash[data-theme="escuro"] .kanban-col-count { color: var(--brand-3); }
.kanban-col-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
.kanban-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  padding: 12px 14px; cursor: grab;
  transition: box-shadow .15s, border-color .15s, transform .12s;
}
.kanban-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); }
.kanban-card:active { cursor: grabbing; }
.kanban-card-title {
  font-size: 13.5px; font-weight: 600; color: var(--ink); margin-bottom: 6px; line-height: 1.35;
}
.kanban-card-desc {
  font-size: 12px; color: var(--muted); margin-bottom: 10px; line-height: 1.45;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.kanban-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.kanban-prio {
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  text-transform: uppercase; letter-spacing: .04em;
}
.kanban-prio.alta { background: var(--danger-soft); color: var(--danger); }
.kanban-prio.media { background: #fef3c7; color: #92400e; }
.kanban-prio.baixa { background: var(--brand-soft); color: var(--brand); }
.dash[data-theme="escuro"] .kanban-prio.media { background: #3a2c0f; color: #fbbf24; }
.dash[data-theme="escuro"] .kanban-prio.baixa { color: var(--brand-3); }
.kanban-card-actions { display: flex; gap: 4px; }
.kanban-empty {
  text-align: center; padding: 24px 12px; color: var(--muted);
  font-size: 12.5px; border: 1.5px dashed var(--border); border-radius: 10px;
}

.task-form { display: flex; flex-direction: column; gap: 12px; }
.task-form .dash-input, .task-form .dash-select, .task-form textarea.dash-input { width: 100%; }
.task-form textarea.dash-input { min-height: 80px; resize: vertical; }
.task-form-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }

.dash-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.dash-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px; background: var(--brand-soft); border: 1px solid var(--border);
  border-radius: 999px; font-size: 12.5px; font-weight: 600; color: var(--brand);
}
.dash[data-theme="escuro"] .dash-chip { color: var(--brand-3); }
.dash-chip-count {
  background: var(--brand); color: var(--brand-ink);
  padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 700;
}

.dash-filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.dash-input {
  flex: 1 1 260px; min-width: 0; padding: 10px 14px;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius-sm); font-size: 14px; color: var(--ink);
  transition: border-color .15s, box-shadow .15s;
}
.dash-input::placeholder { color: var(--muted); opacity: 1; }
.dash-input:hover { border-color: var(--border-strong); }
.dash-input:focus {
  outline: none; border-color: var(--brand);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-2) 25%, transparent);
}
.dash-select {
  flex: 0 0 auto; min-width: 160px; padding: 10px 14px;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius-sm); font-size: 14px; color: var(--ink); cursor: pointer;
}
.dash-select:focus {
  outline: none; border-color: var(--brand);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-2) 25%, transparent);
}

.dash-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 16px; border-radius: var(--radius-sm); font-size: 13.5px; font-weight: 600;
  cursor: pointer; transition: transform .12s, background .15s, border-color .15s, box-shadow .15s, color .15s;
  border: 1.5px solid transparent; font-family: inherit; white-space: nowrap;
}
.dash-btn-primary {
  background: var(--brand); color: var(--brand-ink);
  box-shadow: 0 6px 16px -8px rgba(37,99,235,.5);
}
.dash-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px); background: var(--brand-3); color: var(--brand-ink);
}
.dash[data-theme="escuro"] .dash-btn-primary:hover:not(:disabled) {
  background: #93c5fd; color: #0f172a;
}
.dash-btn-ghost {
  background: var(--surface); border-color: var(--border); color: var(--ink);
}
.dash-btn-ghost:hover:not(:disabled) {
  background: var(--brand-soft); border-color: var(--brand); color: var(--brand);
}
.dash[data-theme="escuro"] .dash-btn-ghost:hover:not(:disabled) { color: var(--brand-3); }
.dash-btn-danger { background: var(--danger); color: #fff; }
.dash[data-theme="escuro"] .dash-btn-danger { color: #2a1315; font-weight: 700; }
.dash-btn-danger:hover:not(:disabled) { filter: brightness(1.15); }
.dash-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }

.dash-row-actions { display: inline-flex; gap: 6px; justify-content: flex-end; }
.dash-row-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--surface); color: var(--ink-soft); cursor: pointer; font-size: 14px;
  transition: background .12s, color .12s, border-color .12s, transform .1s;
}
.dash-row-btn:hover {
  background: var(--brand-soft); border-color: var(--brand); color: var(--brand);
}
.dash[data-theme="escuro"] .dash-row-btn:hover { color: var(--brand-3); }
.dash-row-btn.is-danger:hover {
  background: var(--danger-soft); border-color: var(--danger); color: var(--danger);
}
.dash-row-btn:active { transform: scale(.94); }
.dash-row-btn svg { width: 15px; height: 15px; pointer-events: none; }

.dash-table-hint {
  display: none; align-items: center; gap: 6px;
  font-size: 12px; color: var(--muted); margin-bottom: 8px; font-weight: 500;
}
.dash-table-wrap {
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  overflow: hidden; background: var(--surface);
}
.dash-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.dash-table thead th {
  text-align: left; padding: 12px 16px; font-size: 11.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em; color: var(--muted);
  background: var(--surface-2); border-bottom: 1px solid var(--border); white-space: nowrap;
}
.dash-table tbody td {
  padding: 14px 16px; border-bottom: 1px solid var(--border); color: var(--ink); vertical-align: middle;
}
.dash-table tbody tr:last-child td { border-bottom: none; }
.dash-table tbody tr:hover td { background: var(--surface-2); }
.dash-table .actions-cell { width: 96px; text-align: right; white-space: nowrap; }
.dash-table .actions-col { width: 96px; }

.dash-cat-badge {
  display: inline-flex; align-items: center; padding: 4px 10px;
  background: var(--brand-soft); border: 1px solid var(--border);
  border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--brand); white-space: nowrap;
}
.dash[data-theme="escuro"] .dash-cat-badge { color: var(--brand-3); }

.dash-empty {
  text-align: center; padding: 56px 24px;
  border: 1.5px dashed var(--border-strong); border-radius: var(--radius); background: var(--surface-2);
}
.dash-empty-icon { font-size: 42px; line-height: 1; margin-bottom: 14px; display: block; }
.dash-empty-title { font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 6px; }
.dash-empty-desc {
  font-size: 13.5px; color: var(--muted); max-width: 420px; margin: 0 auto 20px; line-height: 1.6;
}

.dash-config-row {
  display: flex; justify-content: space-between; align-items: center;
  gap: 16px; padding: 18px 0; border-bottom: 1px solid var(--border); flex-wrap: wrap;
}
.dash-config-row:last-child { border-bottom: none; }
.dash-config-label { font-weight: 600; font-size: 14px; color: var(--ink); }
.dash-config-desc { font-size: 12.5px; color: var(--muted); margin-top: 2px; }

.dash-danger-zone {
  border: 1px solid var(--danger-line); background: var(--danger-soft);
  border-radius: var(--radius); padding: 20px 22px;
}
.dash-danger-title {
  display: flex; align-items: center; gap: 8px; color: var(--danger);
  font-size: 14px; font-weight: 800; letter-spacing: -.01em; margin-bottom: 6px;
}
.dash-danger-desc { font-size: 12.5px; color: var(--ink-soft); margin-bottom: 16px; line-height: 1.55; }
.dash-danger-row {
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  padding-top: 14px; border-top: 1px solid color-mix(in srgb, var(--danger) 25%, transparent); flex-wrap: wrap;
}

.dash-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,.55);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000;
  animation: dashFade .18s ease;
}
@keyframes dashFade { from { opacity: 0; } to { opacity: 1; } }

.dash-modal {
  width: 100%; max-width: 480px; background: var(--surface);
  border: 1px solid var(--border); border-radius: 18px; padding: 28px;
  box-shadow: var(--shadow-lg); animation: dashRise .22s cubic-bezier(.2,.7,.2,1);
  max-height: calc(100vh - 40px); overflow-y: auto;
}
@keyframes dashRise {
  from { opacity: 0; transform: translateY(12px) scale(.98); }
  to { opacity: 1; transform: none; }
}
.dash-modal-icon {
  width: 60px; height: 60px; border-radius: 50%; display: grid; place-items: center;
  font-size: 28px; margin: 0 auto 16px; background: var(--danger-soft); border: 1px solid var(--danger-line);
}
.dash-modal-title {
  font-size: 20px; font-weight: 800; text-align: center; letter-spacing: -.025em;
  margin-bottom: 8px; color: var(--danger);
}
.dash-modal-desc {
  font-size: 13.5px; color: var(--ink-soft); text-align: center; line-height: 1.65; margin-bottom: 22px;
}
.dash-modal-label { font-size: 13px; font-weight: 600; margin-bottom: 8px; display: block; color: var(--ink); }
.dash-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; flex-wrap: wrap; }
.dash-error-inline {
  font-size: 12.5px; color: var(--danger); font-weight: 600; margin-top: 8px;
  display: flex; align-items: center; gap: 6px;
}

.dash-palette {
  width: 100%; max-width: 560px; margin: 0 auto; background: var(--surface);
  border: 1px solid var(--border); border-radius: 16px; box-shadow: var(--shadow-lg);
  overflow: hidden; animation: dashRise .22s cubic-bezier(.2,.7,.2,1);
}
.dash-palette-input {
  width: 100%; padding: 18px 20px; border: none; border-bottom: 1px solid var(--border);
  font-size: 15px; background: transparent; color: var(--ink); outline: none;
}
.dash-palette-input::placeholder { color: var(--muted); opacity: 1; }
.dash-palette-list { max-height: 360px; overflow-y: auto; padding: 6px; }
.dash-palette-group {
  font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
  color: var(--muted); padding: 10px 12px 6px;
}
.dash-palette-item {
  display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 12px;
  background: transparent; border: none; border-radius: 10px; cursor: pointer;
  text-align: left; color: var(--ink); font-size: 13.5px; transition: background .12s;
}
.dash-palette-item.is-selected, .dash-palette-item:hover {
  background: var(--brand-soft); color: var(--brand);
}
.dash[data-theme="escuro"] .dash-palette-item.is-selected,
.dash[data-theme="escuro"] .dash-palette-item:hover { color: var(--brand-3); }
.dash-palette-item-icon {
  width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center;
  background: var(--surface-2); font-size: 15px; flex-shrink: 0;
}
.dash-palette-item-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.dash-palette-item-title { font-weight: 600; }
.dash-palette-item-sub {
  font-size: 12px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.dash-palette-empty { padding: 28px 20px; text-align: center; color: var(--muted); font-size: 13.5px; }

.dash-toasts {
  position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column;
  gap: 10px; z-index: 2000; max-width: calc(100vw - 40px); pointer-events: none;
}
.dash-toast {
  pointer-events: auto; display: flex; align-items: center; gap: 12px;
  min-width: 260px; max-width: 400px; padding: 12px 14px; border-radius: 12px;
  background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-lg);
  animation: dashSlideIn .24s cubic-bezier(.2,.7,.2,1);
}
@keyframes dashSlideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: none; }
}
.dash-toast-icon {
  width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
  font-size: 13px; font-weight: 800; flex-shrink: 0;
}
.dash-toast--sucesso .dash-toast-icon { background: var(--ok-soft); color: var(--ok); }
.dash-toast--erro .dash-toast-icon { background: var(--danger-soft); color: var(--danger); }
.dash-toast--info .dash-toast-icon { background: var(--brand-soft); color: var(--brand); }
.dash[data-theme="escuro"] .dash-toast--info .dash-toast-icon { color: var(--brand-3); }
.dash-toast-text { flex: 1; font-size: 13.5px; color: var(--ink); line-height: 1.45; }
.dash-toast-close {
  background: transparent; border: none; cursor: pointer; color: var(--muted);
  font-size: 16px; padding: 4px; border-radius: 6px; transition: background .12s, color .12s;
}
.dash-toast-close:hover { background: var(--surface-2); color: var(--ink); }

.dash-mobile-backdrop {
  position: fixed; inset: 0; background: rgba(15,23,42,.55);
  backdrop-filter: blur(2px); z-index: 40; animation: dashFade .18s ease;
}
.dash-mobile-drawer {
  position: fixed; top: 0; left: 0; bottom: 0; width: min(300px, 85vw);
  background: var(--sidebar); border-right: 1px solid var(--border);
  padding: 20px 14px; display: flex; flex-direction: column; z-index: 41; overflow-y: auto;
  animation: dashSlideRight .22s cubic-bezier(.2,.7,.2,1);
}
@keyframes dashSlideRight {
  from { transform: translateX(-100%); }
  to { transform: none; }
}

@media (max-width: 1100px) {
  .kanban-board { grid-template-columns: repeat(2, minmax(240px, 1fr)); }
}
@media (max-width: 1024px) {
  .dash { grid-template-columns: 1fr; }
  .dash-sidebar { display: none; }
  .dash-burger { display: inline-flex; }
  .dash-content { padding: 20px 20px 80px; }
  .dash-topbar { padding: 12px 20px; }
  .dash-search-trigger { min-width: 0; padding: 0; width: 40px; height: 40px; justify-content: center; }
  .dash-search-trigger span:not(.dash-search-ico), .dash-search-trigger kbd { display: none; }
}
@media (max-width: 720px) {
  .dash-content { padding: 16px 16px 80px; gap: 16px; }
  .dash-topbar { padding: 10px 14px; min-height: 60px; }
  .dash-title { font-size: 16px; }
  .dash-subtitle { font-size: 12px; }
  .dash-user-name { display: none; }
  .dash-user-btn { padding: 3px; }
  .dash-user-btn .chevron { display: none; }
  .dash-panel { padding: 16px; }
  .dash-kpi-value { font-size: 20px; }
  .kanban-board { grid-template-columns: 1fr; }
  .dash-modal { padding: 22px 18px; border-radius: 14px; }
  .dash-modal-actions > * { flex: 1 1 100%; }
  .dash-toasts { left: 16px; right: 16px; bottom: 16px; }
  .dash-toast { min-width: 0; max-width: none; }
  .dash-table-hint { display: flex; }
  .dash-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .dash-table { min-width: 560px; font-size: 13px; }
}
@media (max-width: 480px) {
  .dash-kpis { grid-template-columns: 1fr 1fr; gap: 10px; }
  .dash-kpi { padding: 14px; }
  .dash-kpi-icon { width: 32px; height: 32px; font-size: 15px; }
  .dash-kpi-value { font-size: 18px; }
  .dash-kpi-label { font-size: 10.5px; }
}
@media (prefers-reduced-motion: reduce) {
  .dash-modal, .dash-palette, .dash-toast, .dash-menu,
  .dash-mobile-drawer, .dash-overlay, .dash-mobile-backdrop { animation: none !important; }
  .dash * { scroll-behavior: auto !important; }
}
`;

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

export default function Dashboard() {
  const { tarefas, salvar, excluir, mover, importar, zerar } = useTarefas();
  const { tema, alternar } = useTema();
  const { toasts, push, remover } = useToasts();
  const { usuario } = useAuth();

  const [aba, setAba] = useState<Aba>('quadro');
  const [tarefaEditando, setTarefaEditando] = useState<Tarefa | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'Todos' | StatusColuna>('Todos');
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<'Todas' | Prioridade>('Todas');
  const [paletaAberta, setPaletaAberta] = useState(false);
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [drawerMobileAberto, setDrawerMobileAberto] = useState(false);
  const [paletaSelecionada, setPaletaSelecionada] = useState(0);

  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('media');
  const [statusForm, setStatusForm] = useState<StatusColuna>('a_fazer');

  const [buscaPaleta, setBuscaPaleta] = useState('');
  const buscaDeferred = useDeferredValue(busca);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const paletaRef = useRef<HTMLDivElement>(null);

  useBodyLock(paletaAberta || drawerMobileAberto || modalExcluirAberto);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletaAberta((v) => !v);
        setBuscaPaleta('');
        setPaletaSelecionada(0);
      }
      if (e.key === 'Escape') {
        if (paletaAberta) setPaletaAberta(false);
        else if (modalExcluirAberto && !excluindo) setModalExcluirAberto(false);
        else if (drawerMobileAberto) setDrawerMobileAberto(false);
        else setMenuUsuarioAberto(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletaAberta, modalExcluirAberto, drawerMobileAberto, excluindo]);

  useEffect(() => {
    if (!menuUsuarioAberto) return;
    const fechar = () => setMenuUsuarioAberto(false);
    window.addEventListener('click', fechar);
    return () => window.removeEventListener('click', fechar);
  }, [menuUsuarioAberto]);

  const abrirFormNova = () => {
    setTarefaEditando(null);
    setTitulo('');
    setDescricao('');
    setPrioridade('media');
    setStatusForm('a_fazer');
    setFormAberto(true);
  };

  const abrirFormEditar = (t: Tarefa) => {
    setTarefaEditando(t);
    setTitulo(t.titulo);
    setDescricao(t.descricao ?? '');
    setPrioridade(t.prioridade);
    setStatusForm(t.status);
    setFormAberto(true);
    setAba('lista');
  };

  const handleSalvar = () => {
    if (!titulo.trim()) {
      push('Informe o título da tarefa', 'erro');
      return;
    }
    const tarefa: Tarefa = {
      id: tarefaEditando?.id ?? uid(),
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      prioridade,
      status: statusForm,
      criadoEm: tarefaEditando?.criadoEm ?? new Date().toISOString(),
    };
    salvar(tarefa);
    setFormAberto(false);
    setTarefaEditando(null);
    push(tarefaEditando ? 'Tarefa atualizada' : 'Tarefa criada', 'sucesso');
  };

  const handleExcluir = (t: Tarefa) => {
    if (!confirm(`Excluir a tarefa "${t.titulo}"?`)) return;
    excluir(t.id);
    if (tarefaEditando?.id === t.id) {
      setTarefaEditando(null);
      setFormAberto(false);
    }
    push(`"${t.titulo}" excluída`, 'info');
  };

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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result));
          if (!Array.isArray(data)) {
            push('Arquivo inválido', 'erro');
            return;
          }
          importar(data as Tarefa[]);
          push(`${data.length} tarefas importadas`, 'sucesso');
        } catch {
          push('Erro ao importar arquivo', 'erro');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importar, push]
  );

  const zerarTarefas = () => {
    if (!confirm('Apagar TODAS as tarefas? Esta ação não pode ser desfeita.')) return;
    zerar();
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
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = '/';
    } catch (err: unknown) {
      const apiErr = err as ErroApi;
      setErroExcluir(
        apiErr?.response?.data?.mensagem ||
          'Não foi possível excluir a conta. Verifique sua senha.'
      );
      setExcluindo(false);
    }
  };

  const tarefasFiltradas = useMemo(() => {
    const termo = normalizar(buscaDeferred.trim());
    return tarefas.filter((t) => {
      if (statusFiltro !== 'Todos' && t.status !== statusFiltro) return false;
      if (prioridadeFiltro !== 'Todas' && t.prioridade !== prioridadeFiltro) return false;
      if (!termo) return true;
      return (
        normalizar(t.titulo).includes(termo) ||
        normalizar(t.descricao ?? '').includes(termo)
      );
    });
  }, [tarefas, buscaDeferred, statusFiltro, prioridadeFiltro]);

  const stats = useMemo(() => {
    const total = tarefas.length;
    const aFazer = tarefas.filter((t) => t.status === 'a_fazer').length;
    const emProgresso = tarefas.filter((t) => t.status === 'em_progresso').length;
    const revisao = tarefas.filter((t) => t.status === 'revisao').length;
    const concluido = tarefas.filter((t) => t.status === 'concluido').length;
    const alta = tarefas.filter((t) => t.prioridade === 'alta').length;
    return { total, aFazer, emProgresso, revisao, concluido, alta };
  }, [tarefas]);

  const tarefasPorColuna = useMemo(() => {
    const map: Record<StatusColuna, Tarefa[]> = {
      a_fazer: [],
      em_progresso: [],
      revisao: [],
      concluido: [],
    };
    for (const t of tarefas) map[t.status].push(t);
    return map;
  }, [tarefas]);

  const paletaItens = useMemo(() => {
    const q = normalizar(buscaPaleta.trim());
    const comandos = [
      { id: 'go-quadro', icon: '🗂️', titulo: 'Ir para Quadro', sub: 'Kanban', run: () => setAba('quadro') },
      { id: 'go-lista', icon: '📋', titulo: 'Ir para Lista', sub: 'Todas as tarefas', run: () => setAba('lista') },
      { id: 'go-relatorios', icon: '📈', titulo: 'Ir para Relatórios', sub: 'Métricas', run: () => setAba('relatorios') },
      { id: 'go-config', icon: '⚙️', titulo: 'Ir para Configurações', sub: 'Preferências', run: () => setAba('config') },
      { id: 'nova', icon: '➕', titulo: 'Nova tarefa', sub: 'Criar card', run: () => { setAba('lista'); abrirFormNova(); } },
      { id: 'export', icon: '⬇️', titulo: 'Exportar backup', sub: 'Baixar JSON', run: exportarJSON },
      { id: 'theme', icon: tema === 'claro' ? '🌙' : '☀️', titulo: 'Alternar tema', sub: tema === 'claro' ? 'Ativar escuro' : 'Ativar claro', run: alternar },
    ];
    const listaComandos = comandos.filter(
      (c) => !q || normalizar(c.titulo).includes(q) || normalizar(c.sub).includes(q)
    );
    const listaTarefas = q
      ? tarefas
          .filter((t) => normalizar(t.titulo).includes(q))
          .slice(0, 8)
          .map((t) => ({
            id: `tarefa-${t.id}`,
            icon: '📌',
            titulo: t.titulo,
            sub: `${COLUNAS.find((c) => c.id === t.status)?.titulo} · ${PRIORIDADE_LABEL[t.prioridade]}`,
            run: () => { setAba('lista'); setBusca(t.titulo); },
          }))
      : [];
    return { comandos: listaComandos, tarefas: listaTarefas, todos: [...listaComandos, ...listaTarefas] };
  }, [buscaPaleta, tarefas, tema, alternar, exportarJSON]);

  const onPaletaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = paletaItens.todos.length;
    if (total === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setPaletaSelecionada((i) => (i + 1) % total); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setPaletaSelecionada((i) => (i - 1 + total) % total); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      paletaItens.todos[paletaSelecionada]?.run();
      setPaletaAberta(false);
    }
  };

  const navegarPara = (id: Aba) => { setAba(id); setDrawerMobileAberto(false); };
  const limparFiltros = () => { setBusca(''); setStatusFiltro('Todos'); setPrioridadeFiltro('Todas'); };
  const filtrosAtivos = busca !== '' || statusFiltro !== 'Todos' || prioridadeFiltro !== 'Todas';

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDrop = (e: React.DragEvent, status: StatusColuna) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) { mover(id, status); push('Tarefa movida', 'sucesso'); }
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  return (
    <>
      <style>{STYLES}</style>
      <div className="dash" data-theme={tema}>
        <aside className="dash-sidebar" aria-label="Navegação principal">
          <div className="dash-brand">
            <span className="dash-brand-mark" aria-hidden="true">📋</span>
            <div className="dash-brand-text">
              <span className="dash-brand-name">CtOperacional</span>
              <span className="dash-brand-sub">Controle Operacional</span>
            </div>
          </div>
          <span className="dash-nav-label">Navegação</span>
          <nav className="dash-nav">
            {([
              ['quadro', '🗂️', 'Quadro', null],
              ['lista', '📋', 'Lista', tarefas.length || null],
              ['relatorios', '📈', 'Relatórios', null],
              ['config', '⚙️', 'Configurações', null],
            ] as const).map(([id, icon, label, badge]) => (
              <button key={id} type="button"
                className={`dash-nav-btn${aba === id ? ' is-active' : ''}`}
                onClick={() => setAba(id)}
                aria-current={aba === id ? 'page' : undefined}
              >
                <span className="dash-nav-icon" aria-hidden="true">{icon}</span>
                <span>{label}</span>
                {badge ? <span className="dash-nav-badge">{badge}</span> : null}
              </button>
            ))}
          </nav>
          <div className="dash-sidebar-footer">
            <button type="button" className="dash-nav-btn"
              onClick={() => { setPaletaAberta(true); setBuscaPaleta(''); setPaletaSelecionada(0); }}>
              <span className="dash-nav-icon" aria-hidden="true">🔍</span>
              <span>Buscar…</span>
              <kbd style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-soft)' }}>Ctrl K</kbd>
            </button>
            <button type="button" className="dash-nav-btn" onClick={alternar}>
              <span className="dash-nav-icon" aria-hidden="true">{tema === 'claro' ? '🌙' : '☀️'}</span>
              <span>{tema === 'claro' ? 'Modo escuro' : 'Modo claro'}</span>
            </button>
          </div>
        </aside>

        <main className="dash-main">
          <header className="dash-topbar">
            <div className="dash-topbar-left">
              <button type="button" className="dash-burger" onClick={() => setDrawerMobileAberto(true)}
                aria-label="Abrir menu" aria-expanded={drawerMobileAberto}>
                <span aria-hidden="true">☰</span>
              </button>
              <div style={{ minWidth: 0 }}>
                <h1 className="dash-title">
                  {aba === 'quadro' && 'Quadro Kanban'}
                  {aba === 'lista' && 'Lista de tarefas'}
                  {aba === 'relatorios' && 'Relatórios'}
                  {aba === 'config' && 'Configurações'}
                </h1>
                <p className="dash-subtitle">
                  {formatarData()} · {tarefas.length} {tarefas.length === 1 ? 'tarefa' : 'tarefas'}
                </p>
              </div>
            </div>
            <div className="dash-topbar-right">
              <button type="button" className="dash-search-trigger"
                onClick={() => { setPaletaAberta(true); setBuscaPaleta(''); setPaletaSelecionada(0); }}
                aria-label="Abrir busca">
                <span className="dash-search-ico" aria-hidden="true">🔍</span>
                <span>Buscar…</span>
                <kbd>Ctrl K</kbd>
              </button>
              <button type="button" className="dash-icon-btn" onClick={alternar}
                aria-label={tema === 'claro' ? 'Modo escuro' : 'Modo claro'}>
                <span aria-hidden="true">{tema === 'claro' ? '🌙' : '☀️'}</span>
              </button>
              <div className="dash-user" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="dash-user-btn"
                  onClick={() => setMenuUsuarioAberto((v) => !v)}
                  aria-haspopup="menu" aria-expanded={menuUsuarioAberto}>
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
                    <button type="button" role="menuitem" className="dash-menu-item"
                      onClick={() => { setMenuUsuarioAberto(false); setAba('config'); }}>
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

          <div className="dash-content">
            {aba === 'quadro' && (
              <>
                <section className="dash-kpis" aria-label="Indicadores">
                  <KpiCard icon="📋" label="Total" value={stats.total} />
                  <KpiCard icon="⚡" label="Em progresso" value={stats.emProgresso} />
                  <KpiCard icon="✅" label="Concluídas" value={stats.concluido} />
                  <KpiCard icon="🔥" label="Prioridade alta" value={stats.alta} />
                </section>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="dash-btn dash-btn-primary" onClick={abrirFormNova}>➕ Nova tarefa</button>
                </div>
                <div className="kanban-board" role="region" aria-label="Quadro Kanban">
                  {COLUNAS.map((col) => (
                    <div key={col.id} className="kanban-col" onDragOver={onDragOver} onDrop={(e) => onDrop(e, col.id)}>
                      <div className="kanban-col-head">
                        <span className="kanban-col-title">
                          <span aria-hidden="true">{col.icon}</span>{col.titulo}
                        </span>
                        <span className="kanban-col-count">{tarefasPorColuna[col.id].length}</span>
                      </div>
                      <div className="kanban-col-body">
                        {tarefasPorColuna[col.id].length === 0 ? (
                          <div className="kanban-empty">Nenhuma tarefa</div>
                        ) : (
                          tarefasPorColuna[col.id].map((t) => (
                            <div key={t.id} className="kanban-card" draggable onDragStart={(e) => onDragStart(e, t.id)}>
                              <div className="kanban-card-title">{t.titulo}</div>
                              {t.descricao && <div className="kanban-card-desc">{t.descricao}</div>}
                              <div className="kanban-card-footer">
                                <span className={`kanban-prio ${t.prioridade}`}>{PRIORIDADE_LABEL[t.prioridade]}</span>
                                <div className="kanban-card-actions">
                                  <button type="button" className="dash-row-btn" onClick={() => abrirFormEditar(t)} aria-label={`Editar ${t.titulo}`} title="Editar"><IconEdit /></button>
                                  <button type="button" className="dash-row-btn is-danger" onClick={() => handleExcluir(t)} aria-label={`Excluir ${t.titulo}`} title="Excluir"><IconTrash /></button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {aba === 'lista' && (
              <>
                <section className="dash-kpis" aria-label="Resumo">
                  <KpiCard icon="📋" label="Total" value={stats.total} />
                  <KpiCard icon="📌" label="A fazer" value={stats.aFazer} />
                  <KpiCard icon="⚡" label="Em progresso" value={stats.emProgresso} />
                  <KpiCard icon="✅" label="Concluídas" value={stats.concluido} />
                </section>

                {formAberto && (
                  <section className="dash-panel">
                    <div className="dash-panel-head">
                      <h2 className="dash-panel-title">{tarefaEditando ? 'Editar tarefa' : 'Nova tarefa'}</h2>
                    </div>
                    <div className="task-form">
                      <input className="dash-input" placeholder="Título da tarefa *" value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus />
                      <textarea className="dash-input" placeholder="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <select className="dash-select" value={prioridade} onChange={(e) => setPrioridade(e.target.value as Prioridade)}>
                          <option value="baixa">Prioridade: Baixa</option>
                          <option value="media">Prioridade: Média</option>
                          <option value="alta">Prioridade: Alta</option>
                        </select>
                        <select className="dash-select" value={statusForm} onChange={(e) => setStatusForm(e.target.value as StatusColuna)}>
                          {COLUNAS.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                        </select>
                      </div>
                      <div className="task-form-actions">
                        <button type="button" className="dash-btn dash-btn-ghost" onClick={() => { setFormAberto(false); setTarefaEditando(null); }}>Cancelar</button>
                        <button type="button" className="dash-btn dash-btn-primary" onClick={handleSalvar}>{tarefaEditando ? 'Salvar' : 'Criar tarefa'}</button>
                      </div>
                    </div>
                  </section>
                )}

                <section className="dash-panel">
                  <div className="dash-panel-head">
                    <h2 className="dash-panel-title">Todas as tarefas</h2>
                    <div className="dash-panel-actions">
                      {!formAberto && (
                        <button type="button" className="dash-btn dash-btn-primary" onClick={abrirFormNova}>➕ Nova tarefa</button>
                      )}
                    </div>
                  </div>
                  <div className="dash-filters" style={{ marginBottom: 16 }}>
                    <input type="search" className="dash-input" placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
                    <select className="dash-select" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value as typeof statusFiltro)}>
                      <option value="Todos">Todos os status</option>
                      {COLUNAS.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                    </select>
                    <select className="dash-select" value={prioridadeFiltro} onChange={(e) => setPrioridadeFiltro(e.target.value as typeof prioridadeFiltro)}>
                      <option value="Todas">Todas prioridades</option>
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                    {filtrosAtivos && (
                      <button type="button" className="dash-btn dash-btn-ghost" onClick={limparFiltros}>Limpar filtros</button>
                    )}
                  </div>
                  {tarefasFiltradas.length === 0 ? (
                    <div className="dash-empty">
                      <span className="dash-empty-icon" aria-hidden="true">{tarefas.length === 0 ? '📋' : '🔎'}</span>
                      <h3 className="dash-empty-title">{tarefas.length === 0 ? 'Nenhuma tarefa ainda' : 'Nenhum resultado'}</h3>
                      <p className="dash-empty-desc">
                        {tarefas.length === 0 ? 'Crie sua primeira tarefa para organizar a operação.' : 'Nenhuma tarefa corresponde aos filtros.'}
                      </p>
                      {tarefas.length === 0 && (
                        <button type="button" className="dash-btn dash-btn-primary" onClick={abrirFormNova}>➕ Criar primeira tarefa</button>
                      )}
                    </div>
                  ) : (
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>Título</th>
                            <th>Status</th>
                            <th>Prioridade</th>
                            <th className="actions-col"><span className="sr-only">Ações</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {tarefasFiltradas.map((t) => (
                            <tr key={t.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{t.titulo}</div>
                                {t.descricao && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{t.descricao.slice(0, 80)}{t.descricao.length > 80 ? '…' : ''}</div>}
                              </td>
                              <td><span className="dash-cat-badge">{COLUNAS.find((c) => c.id === t.status)?.titulo}</span></td>
                              <td><span className={`kanban-prio ${t.prioridade}`}>{PRIORIDADE_LABEL[t.prioridade]}</span></td>
                              <td className="actions-cell">
                                <div className="dash-row-actions">
                                  <button type="button" className="dash-row-btn" onClick={() => abrirFormEditar(t)} aria-label={`Editar ${t.titulo}`}><IconEdit /></button>
                                  <button type="button" className="dash-row-btn is-danger" onClick={() => handleExcluir(t)} aria-label={`Excluir ${t.titulo}`}><IconTrash /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}

            {aba === 'relatorios' && (
              <>
                <section className="dash-kpis">
                  <KpiCard icon="📋" label="Total" value={stats.total} />
                  <KpiCard icon="📌" label="A fazer" value={stats.aFazer} />
                  <KpiCard icon="⚡" label="Em progresso" value={stats.emProgresso} />
                  <KpiCard icon="🔍" label="Revisão" value={stats.revisao} />
                  <KpiCard icon="✅" label="Concluídas" value={stats.concluido} />
                  <KpiCard icon="🔥" label="Prioridade alta" value={stats.alta} />
                </section>
                <section className="dash-panel">
                  <div className="dash-panel-head"><h2 className="dash-panel-title">Distribuição por coluna</h2></div>
                  <div className="dash-chips">
                    {COLUNAS.map((c) => (
                      <span key={c.id} className="dash-chip">
                        {c.icon} {c.titulo}
                        <span className="dash-chip-count">{tarefasPorColuna[c.id].length}</span>
                      </span>
                    ))}
                    {stats.total === 0 && <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>Nenhuma tarefa.</span>}
                  </div>
                </section>
              </>
            )}

            {aba === 'config' && (
              <>
                <section className="dash-panel">
                  <div className="dash-panel-head"><h2 className="dash-panel-title">Preferências</h2></div>
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
                      <div className="dash-config-desc">Exportar / importar JSON</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="dash-btn dash-btn-ghost" onClick={exportarJSON}>⬇️ Exportar</button>
                      <button type="button" className="dash-btn dash-btn-ghost" onClick={() => fileInputRef.current?.click()}>⬆️ Importar</button>
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
                      <div className="dash-config-desc">Remove todas as tarefas</div>
                    </div>
                    <button type="button" className="dash-btn dash-btn-danger" onClick={zerarTarefas}>Zerar tarefas</button>
                  </div>
                </section>
                <section className="dash-danger-zone">
                  <h2 className="dash-danger-title"><span aria-hidden="true">⚠️</span> Zona de Perigo</h2>
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
          </div>
        </main>

        {drawerMobileAberto && (
          <>
            <div className="dash-mobile-backdrop" onClick={() => setDrawerMobileAberto(false)} aria-hidden="true" />
            <aside className="dash-mobile-drawer" role="dialog" aria-modal="true" aria-label="Navegação">
              <div className="dash-brand">
                <span className="dash-brand-mark" aria-hidden="true">📋</span>
                <div className="dash-brand-text">
                  <span className="dash-brand-name">CtOperacional</span>
                  <span className="dash-brand-sub">Controle Operacional</span>
                </div>
              </div>
              <span className="dash-nav-label">Navegação</span>
              <nav className="dash-nav">
                {([
                  ['quadro', '🗂️', 'Quadro', null],
                  ['lista', '📋', 'Lista', tarefas.length || null],
                  ['relatorios', '📈', 'Relatórios', null],
                  ['config', '⚙️', 'Configurações', null],
                ] as const).map(([id, icon, label, badge]) => (
                  <button key={id} type="button" className={`dash-nav-btn${aba === id ? ' is-active' : ''}`} onClick={() => navegarPara(id)}>
                    <span className="dash-nav-icon" aria-hidden="true">{icon}</span>
                    <span>{label}</span>
                    {badge ? <span className="dash-nav-badge">{badge}</span> : null}
                  </button>
                ))}
              </nav>
              <div className="dash-sidebar-footer">
                <button type="button" className="dash-nav-btn" onClick={() => { setDrawerMobileAberto(false); alternar(); }}>
                  <span className="dash-nav-icon" aria-hidden="true">{tema === 'claro' ? '🌙' : '☀️'}</span>
                  <span>{tema === 'claro' ? 'Modo escuro' : 'Modo claro'}</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {modalExcluirAberto && (
          <div className="dash-overlay" onClick={() => !excluindo && setModalExcluirAberto(false)} role="presentation">
            <div ref={modalRef} role="dialog" aria-modal="true" className="dash-modal" onClick={(e) => e.stopPropagation()}>
              <div className="dash-modal-icon" aria-hidden="true">⚠️</div>
              <h2 className="dash-modal-title">Excluir conta permanentemente?</h2>
              <p className="dash-modal-desc">Esta ação é <strong>irreversível</strong>. Digite sua senha para confirmar.</p>
              <label htmlFor="senha-excluir" className="dash-modal-label">Senha atual</label>
              <input id="senha-excluir" type="password" className="dash-input" placeholder="Digite sua senha"
                value={senhaExcluir} onChange={(e) => setSenhaExcluir(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !excluindo) handleExcluirConta(); }}
                autoFocus disabled={excluindo} autoComplete="current-password" />
              {erroExcluir && <p className="dash-error-inline" role="alert"><span aria-hidden="true">●</span> {erroExcluir}</p>}
              <div className="dash-modal-actions">
                <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setModalExcluirAberto(false)} disabled={excluindo}>Cancelar</button>
                <button type="button" className="dash-btn dash-btn-danger" onClick={handleExcluirConta} disabled={excluindo || !senhaExcluir.trim()}>
                  {excluindo ? 'Excluindo…' : 'Sim, excluir conta'}
                </button>
              </div>
            </div>
          </div>
        )}

        {paletaAberta && (
          <div className="dash-overlay" onClick={() => setPaletaAberta(false)} role="presentation" style={{ alignItems: 'flex-start', paddingTop: '12vh' }}>
            <div ref={paletaRef} role="dialog" aria-modal="true" aria-label="Paleta de comandos" className="dash-palette" onClick={(e) => e.stopPropagation()}>
              <input autoFocus type="text" className="dash-palette-input" placeholder="Buscar comandos ou tarefas…"
                value={buscaPaleta} onChange={(e) => { setBuscaPaleta(e.target.value); setPaletaSelecionada(0); }}
                onKeyDown={onPaletaKeyDown} />
              <div className="dash-palette-list" role="listbox">
                {paletaItens.todos.length === 0 && <div className="dash-palette-empty">Nada encontrado.</div>}
                {paletaItens.comandos.length > 0 && (
                  <>
                    <div className="dash-palette-group">Ações</div>
                    {paletaItens.comandos.map((item, i) => (
                      <button key={item.id} type="button" role="option" aria-selected={i === paletaSelecionada}
                        className={`dash-palette-item${i === paletaSelecionada ? ' is-selected' : ''}`}
                        onMouseEnter={() => setPaletaSelecionada(i)}
                        onClick={() => { item.run(); setPaletaAberta(false); }}>
                        <span className="dash-palette-item-icon" aria-hidden="true">{item.icon}</span>
                        <span className="dash-palette-item-text">
                          <span className="dash-palette-item-title">{item.titulo}</span>
                          <span className="dash-palette-item-sub">{item.sub}</span>
                        </span>
                      </button>
                    ))}
                  </>
                )}
                {paletaItens.tarefas.length > 0 && (
                  <>
                    <div className="dash-palette-group">Tarefas</div>
                    {paletaItens.tarefas.map((item, i) => {
                      const idx = paletaItens.comandos.length + i;
                      return (
                        <button key={item.id} type="button" role="option" aria-selected={idx === paletaSelecionada}
                          className={`dash-palette-item${idx === paletaSelecionada ? ' is-selected' : ''}`}
                          onMouseEnter={() => setPaletaSelecionada(idx)}
                          onClick={() => { item.run(); setPaletaAberta(false); }}>
                          <span className="dash-palette-item-icon" aria-hidden="true">{item.icon}</span>
                          <span className="dash-palette-item-text">
                            <span className="dash-palette-item-title">{item.titulo}</span>
                            <span className="dash-palette-item-sub">{item.sub}</span>
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="dash-toasts" role="region" aria-label="Notificações" aria-live="polite">
          {toasts.map((tst) => (
            <div key={tst.id} className={`dash-toast dash-toast--${tst.tipo}`}>
              <span className="dash-toast-icon" aria-hidden="true">
                {tst.tipo === 'sucesso' ? '✓' : tst.tipo === 'erro' ? '!' : 'i'}
              </span>
              <span className="dash-toast-text">{tst.texto}</span>
              <button type="button" className="dash-toast-close" onClick={() => remover(tst.id)} aria-label="Fechar">
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          ))}
        </div>

        <input ref={fileInputRef} type="file" accept="application/json" onChange={importarJSON} style={{ display: 'none' }} />
      </div>
    </>
  );
}

function KpiCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="dash-kpi">
      <div className="dash-kpi-head">
        <span className="dash-kpi-icon" aria-hidden="true">{icon}</span>
      </div>
      <div className="dash-kpi-label">{label}</div>
      <div className="dash-kpi-value" title={String(value)}>{value}</div>
    </div>
  );
}