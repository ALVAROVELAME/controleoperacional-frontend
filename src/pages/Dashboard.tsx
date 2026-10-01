import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useDeferredValue,
  useRef,
} from 'react';
import AnimalForm from '../components/AnimalForm';
import LogoutButton from '../components/LogoutButton';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { animaisService } from '../services/animais.service';
import type { Animal } from '../types';

const STORAGE_KEY = 'agrogestor:animais';
const THEME_KEY = 'agrogestor:tema';

type Aba = 'visao' | 'rebanho' | 'relatorios' | 'config';
type Tema = 'claro' | 'escuro';
type Toast = { id: string; texto: string; tipo: 'sucesso' | 'erro' | 'info' };

type ErroApi = { response?: { data?: { mensagem?: string } } };

// ============================================================
// Utils
// ============================================================
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
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
};

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

// ============================================================
// Hooks
// ============================================================
function useAnimais() {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Carrega do backend ao montar
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setCarregando(true);
        setErro(null);
        const dados = await animaisService.listar();
        if (ativo) setAnimais(dados);
      } catch (err) {
        if (ativo) {
          const msg =
            (err as ErroApi)?.response?.data?.mensagem ||
            'Não foi possível carregar o rebanho. Verifique sua conexão.';
          setErro(msg);
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Cria ou atualiza via API
  const salvar = useCallback(async (animal: Animal) => {
    if (animal.id) {
      const atualizado = await animaisService.atualizar(animal);
      setAnimais((prev) =>
        prev.map((a) => (a.id === atualizado.id ? atualizado : a))
      );
      return atualizado;
    }
    const criado = await animaisService.criar(animal);
    setAnimais((prev) => [...prev, criado]);
    return criado;
  }, []);

  // Exclui via API
  const excluir = useCallback(
    async (id: string | number | undefined | null) => {
      if (id === undefined || id === null) return;
      await animaisService.excluir(id);
      setAnimais((prev) => prev.filter((a) => a.id !== id));
    },
    []
  );

  // Importação em massa (cria um por um via API)
  const importar = useCallback(async (novos: Animal[]) => {
    const criados: Animal[] = [];
    for (const a of novos) {
      const c = await animaisService.criar({
        brinco: a.brinco,
        nome: a.nome,
        categoria: a.categoria,
        producaoDiaria: a.producaoDiaria,
      });
      criados.push(c);
    }
    setAnimais((prev) => [...prev, ...criados]);
  }, []);

  return { animais, salvar, excluir, importar, carregando, erro };
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

// ============================================================
// CSS
// ============================================================
const STYLES = `
.dash {
  --bg: #f6f8f7;
  --surface: #ffffff;
  --surface-2: #f2f6f4;
  --surface-3: #eaf1ed;
  --sidebar: #ffffff;
  --ink: #0a1810;
  --ink-soft: #2a4033;
  --muted: #3f5a48;
  --border: #d8e2dc;
  --border-strong: #b0c3b8;
  --brand: #14532d;
  --brand-2: #16a34a;
  --brand-3: #052e16;
  --brand-soft: #dcf5e3;
  --brand-ink: #ffffff;
  --danger: #991b1b;
  --danger-soft: #fef2f2;
  --danger-line: #fca5a5;
  --warn: #92400e;
  --info: #1e40af;
  --ok: #166534;
  --ok-soft: #dcfce7;
  --shadow-sm: 0 1px 2px rgba(11,26,18,.04);
  --shadow-md: 0 6px 20px -10px rgba(11,26,18,.18);
  --shadow-lg: 0 24px 60px -20px rgba(11,26,18,.32);
  --scroll-shadow: rgba(11,26,18,.18);
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
  --bg: #08120d;
  --surface: #142119;
  --surface-2: #1a2a21;
  --surface-3: #223428;
  --sidebar: #0d1a13;
  --ink: #f0f5f1;
  --ink-soft: #d4e0d7;
  --muted: #9db3a5;
  --border: #3a5244;
  --border-strong: #567361;
  --brand: #5eeb92;
  --brand-2: #22c55e;
  --brand-3: #a7f3b8;
  --brand-soft: #1f3d2a;
  --brand-ink: #052e16;
  --danger: #fca5a5;
  --danger-soft: #2a1315;
  --danger-line: #7f1d1d;
  --warn: #fbbf24;
  --info: #93c5fd;
  --ok: #6ee7a0;
  --ok-soft: #14301f;
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
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ---------- Sidebar ---------- */
.dash-sidebar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 14px;
  background: var(--sidebar);
  border-right: 1px solid var(--border);
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
}
.dash-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
}
.dash-brand-mark {
  width: 38px; height: 38px; border-radius: 11px;
  display: grid; place-items: center;
  font-size: 20px;
  background: var(--brand-soft);
  border: 1px solid var(--border);
  flex-shrink: 0;
}
.dash-brand-text { display: flex; flex-direction: column; }
.dash-brand-name { font-weight: 700; font-size: 15px; color: var(--ink); }
.dash-brand-sub { font-size: 11.5px; color: var(--muted); }

.dash-nav-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--muted);
  padding: 8px 10px 6px;
}
.dash-nav { display: flex; flex-direction: column; gap: 2px; }
.dash-nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-soft);
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  text-align: left;
  transition: background .15s, color .15s;
}
.dash-nav-btn:hover { background: var(--brand-soft); color: var(--ink); }
.dash-nav-btn.is-active {
  background: var(--brand-soft);
  color: var(--brand);
  font-weight: 700;
}
.dash[data-theme="escuro"] .dash-nav-btn.is-active { color: var(--brand-3); }
.dash-nav-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
.dash-nav-badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  background: var(--brand);
  color: var(--brand-ink);
  padding: 2px 8px;
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
}
.dash-sidebar-footer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ---------- Main ---------- */
.dash-main { display: flex; flex-direction: column; min-width: 0; }
.dash-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 28px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--border);
  min-height: 64px;
}
.dash-topbar-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.dash-burger {
  display: none;
  width: 40px; height: 40px;
  align-items: center; justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 18px;
  color: var(--ink);
}
.dash-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -.02em;
  line-height: 1.2;
  color: var(--ink);
}
.dash-subtitle {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dash-topbar-right { display: flex; align-items: center; gap: 8px; }
.dash-search-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--muted);
  transition: border-color .15s, background .15s, color .15s;
  min-width: 200px;
}
.dash-search-trigger:hover { border-color: var(--border-strong); color: var(--ink); }
.dash-search-trigger kbd {
  margin-left: auto;
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink-soft);
}
.dash-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px; height: 40px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 15px;
  color: var(--ink);
  transition: background .15s, border-color .15s, color .15s;
}
.dash-icon-btn:hover {
  background: var(--brand-soft);
  border-color: var(--brand);
  color: var(--brand);
}
.dash[data-theme="escuro"] .dash-icon-btn:hover { color: var(--brand-3); }

.dash-user { position: relative; }
.dash-user-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 4px 4px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  transition: border-color .15s, background .15s;
  color: var(--ink);
}
.dash-user-btn:hover { border-color: var(--border-strong); background: var(--surface-2); }
.dash-user-name {
  font-size: 13px;
  font-weight: 600;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink);
}
.dash-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: grid; place-items: center;
  color: var(--brand-ink);
  font-weight: 700;
  font-size: 12px;
  background: var(--brand);
  flex-shrink: 0;
}

.dash-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 260px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: 8px;
  z-index: 50;
  animation: dashPop .16s cubic-bezier(.2,.7,.2,1);
}
@keyframes dashPop {
  from { opacity: 0; transform: translateY(-4px) scale(.98); }
  to { opacity: 1; transform: none; }
}
.dash-menu-header {
  padding: 10px 12px 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 6px;
}
.dash-menu-name { font-size: 13.5px; font-weight: 700; color: var(--ink); }
.dash-menu-email { font-size: 12px; color: var(--muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; }
.dash-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  color: var(--ink);
  transition: background .12s;
}
.dash-menu-item:hover { background: var(--brand-soft); }

/* ---------- Content ---------- */
.dash-content {
  padding: 24px 28px 80px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

/* ---------- KPI ---------- */
.dash-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}
.dash-kpi {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
  transition: transform .18s, box-shadow .18s, border-color .18s;
  position: relative;
  overflow: hidden;
}
.dash-kpi:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-strong);
}
.dash-kpi-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.dash-kpi-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: grid; place-items: center;
  font-size: 17px;
  background: var(--brand-soft);
  color: var(--brand);
  border: 1px solid var(--border);
}
.dash[data-theme="escuro"] .dash-kpi-icon { color: var(--brand-3); }
.dash-kpi-label {
  font-size: 11.5px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .08em;
  font-weight: 700;
  margin-top: 14px;
}
.dash-kpi-value {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -.03em;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink);
}

/* ---------- Painel ---------- */
.dash-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 22px;
}
.dash-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.dash-panel-title {
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -.01em;
  color: var(--ink);
}
.dash-panel-meta { font-size: 12.5px; color: var(--muted); font-weight: 500; }
.dash-panel-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* Painel de status (carregando / erro) */
.dash-status-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 32px 22px;
  text-align: center;
}
.dash-status-panel.is-error {
  background: var(--danger-soft);
  border-color: var(--danger-line);
}
.dash-status-panel .dash-spinner {
  width: 28px; height: 28px;
  margin: 0 auto 14px;
  border: 3px solid var(--border);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: dashSpin .8s linear infinite;
}
@keyframes dashSpin { to { transform: rotate(360deg); } }
.dash-status-text {
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.6;
}
.dash-status-panel.is-error .dash-status-text {
  color: var(--danger);
  font-weight: 600;
}

/* ---------- Gráfico ---------- */
.dash-chart-rows { display: flex; flex-direction: column; gap: 12px; }
.dash-chart-row { display: grid; grid-template-columns: 110px 1fr 72px; gap: 12px; align-items: center; }
.dash-chart-label {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink);
}
.dash-chart-track {
  height: 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  overflow: hidden;
}
.dash-chart-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--brand-2), var(--brand));
  animation: dashGrow .8s cubic-bezier(.2,.7,.2,1) both;
}
@keyframes dashGrow { from { transform: scaleX(0); transform-origin: left; } to { transform: scaleX(1); } }
.dash-chart-value {
  font-size: 13px;
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--ink-soft);
}

/* ---------- Chips ---------- */
.dash-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.dash-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--brand-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--brand);
}
.dash[data-theme="escuro"] .dash-chip { color: var(--brand-3); }
.dash-chip-count {
  background: var(--brand);
  color: var(--brand-ink);
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ---------- Filtros ---------- */
.dash-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.dash-input {
  flex: 1 1 260px;
  min-width: 0;
  padding: 10px 14px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--ink);
  transition: border-color .15s, box-shadow .15s;
}
.dash-input::placeholder { color: var(--muted); opacity: 1; }
.dash-input:hover { border-color: var(--border-strong); }
.dash-input:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-2) 25%, transparent);
}
.dash-select {
  flex: 0 0 auto;
  min-width: 180px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--ink);
  cursor: pointer;
}
.dash-select:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-2) 25%, transparent);
}

/* ---------- Botões ---------- */
.dash-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: transform .12s, background .15s, border-color .15s, box-shadow .15s, color .15s;
  border: 1.5px solid transparent;
  font-family: inherit;
  white-space: nowrap;
}
.dash-btn-primary {
  background: var(--brand);
  color: var(--brand-ink);
  box-shadow: 0 6px 16px -8px rgba(22,101,52,.5);
}
.dash-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--brand-3);
  color: var(--brand-ink);
}
.dash[data-theme="escuro"] .dash-btn-primary:hover:not(:disabled) {
  background: #86efac;
  color: #052e16;
}
.dash-btn-ghost {
  background: var(--surface);
  border-color: var(--border);
  color: var(--ink);
}
.dash-btn-ghost:hover:not(:disabled) {
  background: var(--brand-soft);
  border-color: var(--brand);
  color: var(--brand);
}
.dash[data-theme="escuro"] .dash-btn-ghost:hover:not(:disabled) { color: var(--brand-3); }
.dash-btn-danger {
  background: var(--danger);
  color: #fff;
}
.dash[data-theme="escuro"] .dash-btn-danger { color: #2a1315; font-weight: 700; }
.dash-btn-danger:hover:not(:disabled) { filter: brightness(1.15); }
.dash-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }

/* ---------- Botões de ação inline (tabela) ---------- */
.dash-row-actions {
  display: inline-flex;
  gap: 6px;
  justify-content: flex-end;
}
.dash-row-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-soft);
  cursor: pointer;
  font-size: 14px;
  transition: background .12s, color .12s, border-color .12s, transform .1s;
}
.dash-row-btn:hover {
  background: var(--brand-soft);
  border-color: var(--brand);
  color: var(--brand);
}
.dash[data-theme="escuro"] .dash-row-btn:hover { color: var(--brand-3); }
.dash-row-btn.is-danger:hover {
  background: var(--danger-soft);
  border-color: var(--danger);
  color: var(--danger);
}
.dash-row-btn:active { transform: scale(.94); }
.dash-row-btn svg {
  width: 15px; height: 15px;
  pointer-events: none;
}

/* ============================================================
   TABELA (Relatórios + Rebanho)
   ============================================================ */
.dash-table-hint {
  display: none;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
  font-weight: 500;
}
.dash-table-wrap {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface);
}
.dash-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
.dash-table thead th {
  text-align: left;
  padding: 12px 16px;
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--muted);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.dash-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--ink);
  vertical-align: middle;
}
.dash-table tbody tr:last-child td { border-bottom: none; }
.dash-table tbody tr:hover td { background: var(--surface-2); }
.dash-table .num {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.dash-table .brinco-cell {
  font-weight: 700;
  color: var(--brand);
  font-variant-numeric: tabular-nums;
}
.dash[data-theme="escuro"] .dash-table .brinco-cell { color: var(--brand-3); }
.dash-table .actions-cell {
  width: 96px;
  text-align: right;
  white-space: nowrap;
}
.dash-table .actions-col { width: 96px; }

/* Chip de categoria na tabela */
.dash-cat-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: var(--brand-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
  white-space: nowrap;
}
.dash[data-theme="escuro"] .dash-cat-badge { color: var(--brand-3); }

/* ============================================================
   EMPTY STATE
   ============================================================ */
.dash-empty {
  text-align: center;
  padding: 56px 24px;
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius);
  background: var(--surface-2);
}
.dash-empty-icon {
  font-size: 42px;
  line-height: 1;
  margin-bottom: 14px;
  display: block;
}
.dash-empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 6px;
}
.dash-empty-desc {
  font-size: 13.5px;
  color: var(--muted);
  max-width: 420px;
  margin: 0 auto 20px;
  line-height: 1.6;
}

/* ============================================================
   FORM WRAPPER
   ============================================================ */
.dash-form-wrap {
  background: var(--surface);
  color: var(--ink);
}
.dash-form-wrap label { color: var(--ink-soft); }
.dash-form-wrap input:not([type="checkbox"]):not([type="radio"]),
.dash-form-wrap select,
.dash-form-wrap textarea {
  background: var(--surface);
  color: var(--ink);
  border-color: var(--border);
}
.dash-form-wrap input::placeholder,
.dash-form-wrap textarea::placeholder {
  color: var(--muted);
  opacity: 1;
}
.dash-form-wrap [style*="background: white"],
.dash-form-wrap [style*="background: #fff"],
.dash-form-wrap [style*="background: #FFF"] {
  background: var(--surface) !important;
}
.dash-form-wrap [style*="color: #1a2b1a"],
.dash-form-wrap [style*="color: #000"],
.dash-form-wrap [style*="color: black"] {
  color: var(--ink) !important;
}

/* ============================================================
   CONFIG
   ============================================================ */
.dash-config-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.dash-config-row:last-child { border-bottom: none; }
.dash-config-label { font-weight: 600; font-size: 14px; color: var(--ink); }
.dash-config-desc { font-size: 12.5px; color: var(--muted); margin-top: 2px; }

/* ============================================================
   DANGER ZONE
   ============================================================ */
.dash-danger-zone {
  border: 1px solid var(--danger-line);
  background: var(--danger-soft);
  border-radius: var(--radius);
  padding: 20px 22px;
}
.dash-danger-title {
  display: flex; align-items: center; gap: 8px;
  color: var(--danger);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -.01em;
  margin-bottom: 6px;
}
.dash-danger-desc { font-size: 12.5px; color: var(--ink-soft); margin-bottom: 16px; line-height: 1.55; }
.dash-danger-row {
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  padding-top: 14px;
  border-top: 1px solid color-mix(in srgb, var(--danger) 25%, transparent);
  flex-wrap: wrap;
}

/* ============================================================
   MODAL
   ============================================================ */
.dash-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6,12,9,.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
  animation: dashFade .18s ease;
}
@keyframes dashFade { from { opacity: 0; } to { opacity: 1; } }

.dash-modal {
  width: 100%;
  max-width: 480px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 28px;
  box-shadow: var(--shadow-lg);
  animation: dashRise .22s cubic-bezier(.2,.7,.2,1);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}
@keyframes dashRise {
  from { opacity: 0; transform: translateY(12px) scale(.98); }
  to { opacity: 1; transform: none; }
}
.dash-modal-icon {
  width: 60px; height: 60px;
  border-radius: 50%;
  display: grid; place-items: center;
  font-size: 28px;
  margin: 0 auto 16px;
  background: var(--danger-soft);
  border: 1px solid var(--danger-line);
}
.dash-modal-title {
  font-size: 20px;
  font-weight: 800;
  text-align: center;
  letter-spacing: -.025em;
  margin-bottom: 8px;
  color: var(--danger);
}
.dash-modal-desc {
  font-size: 13.5px;
  color: var(--ink-soft);
  text-align: center;
  line-height: 1.65;
  margin-bottom: 22px;
}
.dash-modal-label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
  color: var(--ink);
}
.dash-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
  flex-wrap: wrap;
}
.dash-error-inline {
  font-size: 12.5px;
  color: var(--danger);
  font-weight: 600;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ============================================================
   COMMAND PALETTE
   ============================================================ */
.dash-palette {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: dashRise .22s cubic-bezier(.2,.7,.2,1);
}
.dash-palette-input {
  width: 100%;
  padding: 18px 20px;
  border: none;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
  background: transparent;
  color: var(--ink);
  outline: none;
}
.dash-palette-input::placeholder { color: var(--muted); opacity: 1; }
.dash-palette-list {
  max-height: 360px;
  overflow-y: auto;
  padding: 6px;
}
.dash-palette-group {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--muted);
  padding: 10px 12px 6px;
}
.dash-palette-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 12px;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  color: var(--ink);
  font-size: 13.5px;
  transition: background .12s;
}
.dash-palette-item.is-selected,
.dash-palette-item:hover { background: var(--brand-soft); color: var(--brand); }
.dash[data-theme="escuro"] .dash-palette-item.is-selected,
.dash[data-theme="escuro"] .dash-palette-item:hover { color: var(--brand-3); }
.dash-palette-item-icon {
  width: 32px; height: 32px; border-radius: 9px;
  display: grid; place-items: center;
  background: var(--surface-2);
  font-size: 15px;
  flex-shrink: 0;
  color: inherit;
}
.dash-palette-item-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.dash-palette-item-title { font-weight: 600; }
.dash-palette-item-sub {
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dash-palette-empty {
  padding: 28px 20px;
  text-align: center;
  color: var(--muted);
  font-size: 13.5px;
}

/* ============================================================
   TOASTS
   ============================================================ */
.dash-toasts {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 2000;
  max-width: calc(100vw - 40px);
  pointer-events: none;
}
.dash-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 260px;
  max-width: 400px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  animation: dashSlideIn .24s cubic-bezier(.2,.7,.2,1);
}
@keyframes dashSlideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: none; }
}
.dash-toast-icon {
  width: 28px; height: 28px; border-radius: 50%;
  display: grid; place-items: center;
  font-size: 13px; font-weight: 800;
  flex-shrink: 0;
}
.dash-toast--sucesso .dash-toast-icon { background: var(--ok-soft); color: var(--ok); }
.dash-toast--erro .dash-toast-icon { background: var(--danger-soft); color: var(--danger); }
.dash-toast--info .dash-toast-icon { background: var(--brand-soft); color: var(--brand); }
.dash[data-theme="escuro"] .dash-toast--info .dash-toast-icon { color: var(--brand-3); }
.dash-toast-text { flex: 1; font-size: 13.5px; color: var(--ink); line-height: 1.45; }
.dash-toast-close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--muted);
  font-size: 16px;
  padding: 4px;
  border-radius: 6px;
  transition: background .12s, color .12s;
}
.dash-toast-close:hover { background: var(--surface-2); color: var(--ink); }

/* ============================================================
   DRAWER MOBILE
   ============================================================ */
.dash-mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6,12,9,.55);
  backdrop-filter: blur(2px);
  z-index: 40;
  animation: dashFade .18s ease;
}
.dash-mobile-drawer {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: min(300px, 85vw);
  background: var(--sidebar);
  border-right: 1px solid var(--border);
  padding: 20px 14px;
  display: flex;
  flex-direction: column;
  z-index: 41;
  overflow-y: auto;
  animation: dashSlideRight .22s cubic-bezier(.2,.7,.2,1);
}
@keyframes dashSlideRight {
  from { transform: translateX(-100%); }
  to { transform: none; }
}

/* ============================================================
   RESPONSIVO
   ============================================================ */
@media (max-width: 1024px) {
  .dash { grid-template-columns: 1fr; }
  .dash-sidebar { display: none; }
  .dash-burger { display: inline-flex; }
  .dash-content { padding: 20px 20px 80px; }
  .dash-topbar { padding: 12px 20px; }
  .dash-search-trigger { min-width: 0; padding: 0; width: 40px; height: 40px; justify-content: center; }
  .dash-search-trigger span:not(.dash-search-ico),
  .dash-search-trigger kbd { display: none; }
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
  .dash-chart-row { grid-template-columns: 80px 1fr 60px; gap: 8px; }
  .dash-chart-label { font-size: 12px; }
  .dash-chart-value { font-size: 12px; }
  .dash-modal { padding: 22px 18px; border-radius: 14px; }
  .dash-modal-actions > * { flex: 1 1 100%; }
  .dash-toasts { left: 16px; right: 16px; bottom: 16px; }
  .dash-toast { min-width: 0; max-width: none; }

  .dash-table-hint { display: flex; }

  .dash-table-wrap {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
    background-image:
      linear-gradient(to right, var(--surface) 30%, transparent),
      linear-gradient(to left, var(--surface) 30%, transparent),
      radial-gradient(farthest-side at 0% 50%, var(--scroll-shadow), transparent),
      radial-gradient(farthest-side at 100% 50%, var(--scroll-shadow), transparent);
    background-position: 0 0, 100% 0, 0 0, 100% 0;
    background-repeat: no-repeat;
    background-size: 40px 100%, 40px 100%, 16px 100%, 16px 100%;
    background-attachment: local, local, scroll, scroll;
  }

  .dash-table { min-width: 640px; font-size: 13px; }
  .dash-table thead th { padding: 10px 14px; }
  .dash-table tbody td { padding: 12px 14px; }

  .dash-table thead th:first-child,
  .dash-table tbody td:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--surface);
    box-shadow: 6px 0 6px -6px rgba(11,26,18,.28);
  }
  .dash[data-theme="escuro"] .dash-table thead th:first-child,
  .dash[data-theme="escuro"] .dash-table tbody td:first-child {
    box-shadow: 6px 0 6px -6px rgba(0,0,0,.75);
  }
  .dash-table thead th:first-child {
    background: var(--surface-2);
    z-index: 3;
  }
  .dash-table tbody tr:hover td:first-child { background: var(--surface-2); }
}

@media (max-width: 480px) {
  .dash-kpis { grid-template-columns: 1fr 1fr; gap: 10px; }
  .dash-kpi { padding: 14px; }
  .dash-kpi-icon { width: 32px; height: 32px; font-size: 15px; }
  .dash-kpi-value { font-size: 18px; }
  .dash-kpi-label { font-size: 10.5px; }
  .dash-panel-head { gap: 8px; }
}

@media (prefers-reduced-motion: reduce) {
  .dash-modal, .dash-palette, .dash-toast,
  .dash-menu, .dash-mobile-drawer, .dash-overlay, .dash-mobile-backdrop,
  .dash-chart-fill, .dash-status-panel .dash-spinner {
    animation: none !important;
  }
  .dash * { scroll-behavior: auto !important; }
}
`;

// ============================================================
// Ícones SVG inline
// ============================================================
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

// ============================================================
// Componente principal
// ============================================================
export default function Dashboard() {
  const { animais, salvar, excluir, importar, carregando, erro } = useAnimais();
  const { tema, alternar } = useTema();
  const { toasts, push, remover } = useToasts();
  const { usuario } = useAuth();

  const [aba, setAba] = useState<Aba>('visao');
  const [animalEditando, setAnimalEditando] = useState<Animal | null>(null);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<'Todas' | Animal['categoria']>('Todas');
  const [paletaAberta, setPaletaAberta] = useState(false);
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [drawerMobileAberto, setDrawerMobileAberto] = useState(false);
  const [paletaSelecionada, setPaletaSelecionada] = useState(0);

  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

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

  useEffect(() => {
    const ativo = paletaAberta || modalExcluirAberto || drawerMobileAberto;
    if (!ativo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const root =
        modalExcluirAberto ? modalRef.current :
        paletaAberta ? paletaRef.current :
        null;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const atual = document.activeElement as HTMLElement;
      if (e.shiftKey && atual === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && atual === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletaAberta, modalExcluirAberto, drawerMobileAberto]);

  const handleSalvar = useCallback(
    async (animal: Animal) => {
      try {
        await salvar(animal);
        setAnimalEditando(null);
        push(animal.id ? 'Animal atualizado' : 'Animal cadastrado', 'sucesso');
      } catch (err) {
        const msg =
          (err as ErroApi)?.response?.data?.mensagem ||
          'Erro ao salvar animal. Tente novamente.';
        push(msg, 'erro');
      }
    },
    [salvar, push]
  );

  const handleExcluir = useCallback(
    async (animal: Animal) => {
      const ok = window.confirm(
        `Excluir "${animal.nome}" (brinco ${animal.brinco})? Esta ação não pode ser desfeita.`
      );
      if (!ok) return;
      try {
        await excluir(animal.id);
        if (animalEditando?.id === animal.id) setAnimalEditando(null);
        push(`"${animal.nome}" foi excluído`, 'info');
      } catch (err) {
        const msg =
          (err as ErroApi)?.response?.data?.mensagem ||
          'Erro ao excluir animal. Tente novamente.';
        push(msg, 'erro');
      }
    },
    [excluir, push, animalEditando]
  );

  const exportarJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(animais, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrogestor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    push('Backup exportado', 'sucesso');
  }, [animais, push]);

  const importarJSON = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
          await importar(data);
          push(`${data.length} animais importados`, 'sucesso');
        } catch {
          push('Erro ao importar arquivo', 'erro');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importar, push]
  );

  const zerarRebanho = useCallback(async () => {
    if (!confirm('Apagar TODOS os animais? Esta ação não pode ser desfeita.')) return;
    try {
      for (const a of animais) {
        if (a.id !== undefined && a.id !== null) {
          await excluir(a.id);
        }
      }
      push('Rebanho zerado', 'info');
    } catch (err) {
      const msg =
        (err as ErroApi)?.response?.data?.mensagem ||
        'Erro ao zerar rebanho. Tente novamente.';
      push(msg, 'erro');
    }
  }, [animais, excluir, push]);

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

  const animaisFiltrados = useMemo(() => {
    const termo = normalizar(buscaDeferred.trim());
    return animais.filter((a) => {
      if (categoriaFiltro !== 'Todas' && a.categoria !== categoriaFiltro) return false;
      if (!termo) return true;
      return normalizar(a.nome).includes(termo) || normalizar(a.brinco).includes(termo);
    });
  }, [animais, buscaDeferred, categoriaFiltro]);

  const stats = useMemo(() => {
    const total = animais.length;
    const producaoTotal = animais.reduce((acc, a) => acc + (a.producaoDiaria || 0), 0);
    const media = total > 0 ? producaoTotal / total : 0;
    const maior = animais.reduce<Animal | null>(
      (m, a) => (!m || a.producaoDiaria > m.producaoDiaria ? a : m), null);
    const menor = animais.reduce<Animal | null>(
      (m, a) => (!m || a.producaoDiaria < m.producaoDiaria ? a : m), null);
    const porCategoria = animais.reduce<Record<string, number>>((acc, a) => {
      acc[a.categoria] = (acc[a.categoria] || 0) + 1;
      return acc;
    }, {});
    const top5 = [...animais].sort((a, b) => b.producaoDiaria - a.producaoDiaria).slice(0, 5);
    const maxProd = top5[0]?.producaoDiaria ?? 1;
    return { total, producaoTotal, media, maior, menor, porCategoria, top5, maxProd };
  }, [animais]);

  const paletaItens = useMemo(() => {
    const q = normalizar(buscaPaleta.trim());
    const comandos = [
      { id: 'go-visao', icon: '📊', titulo: 'Ir para Visão Geral', sub: 'Dashboard', run: () => setAba('visao') },
      { id: 'go-rebanho', icon: '🐮', titulo: 'Ir para Rebanho', sub: 'Lista de animais', run: () => setAba('rebanho') },
      { id: 'go-relatorios', icon: '📈', titulo: 'Ir para Relatórios', sub: 'Tabela detalhada', run: () => setAba('relatorios') },
      { id: 'go-config', icon: '⚙️', titulo: 'Ir para Configurações', sub: 'Preferências', run: () => setAba('config') },
      { id: 'export', icon: '⬇️', titulo: 'Exportar backup', sub: 'Baixar JSON', run: exportarJSON },
      { id: 'theme', icon: tema === 'claro' ? '🌙' : '☀️', titulo: 'Alternar tema', sub: tema === 'claro' ? 'Ativar escuro' : 'Ativar claro', run: alternar },
    ];
    const listaComandos = comandos.filter(
      (c) => !q || normalizar(c.titulo).includes(q) || normalizar(c.sub).includes(q)
    );
    const listaAnimais = q
      ? animais
          .filter((a) => normalizar(a.nome).includes(q) || normalizar(a.brinco).includes(q))
          .slice(0, 8)
          .map((a) => ({
            id: `animal-${a.id}`,
            icon: '🐄',
            titulo: `${a.nome} · ${a.brinco}`,
            sub: `${a.categoria} · ${a.producaoDiaria} L/dia`,
            run: () => {
              setAba('rebanho');
              setBusca(a.nome);
            },
          }))
      : [];

    return { comandos: listaComandos, animais: listaAnimais, todos: [...listaComandos, ...listaAnimais] };
  }, [buscaPaleta, animais, tema, alternar, exportarJSON]);

  const onPaletaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      paletaItens.todos[paletaSelecionada]?.run();
      setPaletaAberta(false);
    }
  };

  const navegarPara = (id: Aba) => {
    setAba(id);
    setDrawerMobileAberto(false);
  };

  const limparFiltros = () => {
    setBusca('');
    setCategoriaFiltro('Todas');
  };

  const filtrosAtivos = busca !== '' || categoriaFiltro !== 'Todas';

  return (
    <>
      <style>{STYLES}</style>
      <div className="dash" data-theme={tema}>
        <aside className="dash-sidebar" aria-label="Navegação principal">
          <div className="dash-brand">
            <span className="dash-brand-mark" aria-hidden="true">🐄</span>
            <div className="dash-brand-text">
              <span className="dash-brand-name">AgroGestor</span>
              <span className="dash-brand-sub">Gestão de Rebanho</span>
            </div>
          </div>

          <span className="dash-nav-label">Navegação</span>
          <nav className="dash-nav">
            {(
              [
                ['visao', '📊', 'Visão Geral', null],
                ['rebanho', '🐮', 'Rebanho', animais.length || null],
                ['relatorios', '📈', 'Relatórios', null],
                ['config', '⚙️', 'Configurações', null],
              ] as const
            ).map(([id, icon, label, badge]) => (
              <button
                key={id}
                type="button"
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
            <button
              type="button"
              className="dash-nav-btn"
              onClick={() => { setPaletaAberta(true); setBuscaPaleta(''); setPaletaSelecionada(0); }}
            >
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
              <button
                type="button"
                className="dash-burger"
                onClick={() => setDrawerMobileAberto(true)}
                aria-label="Abrir menu de navegação"
                aria-expanded={drawerMobileAberto}
              >
                <span aria-hidden="true">☰</span>
              </button>
              <div style={{ minWidth: 0 }}>
                <h1 className="dash-title">
                  {aba === 'visao' && 'Visão Geral'}
                  {aba === 'rebanho' && 'Rebanho'}
                  {aba === 'relatorios' && 'Relatórios'}
                  {aba === 'config' && 'Configurações'}
                </h1>
                <p className="dash-subtitle">
                  {formatarData()} · {animais.length} {animais.length === 1 ? 'animal' : 'animais'}
                </p>
              </div>
            </div>

            <div className="dash-topbar-right">
              <button
                type="button"
                className="dash-search-trigger"
                onClick={() => { setPaletaAberta(true); setBuscaPaleta(''); setPaletaSelecionada(0); }}
                aria-label="Abrir busca de comandos"
              >
                <span className="dash-search-ico" aria-hidden="true">🔍</span>
                <span>Buscar…</span>
                <kbd>Ctrl K</kbd>
              </button>

              <button
                type="button"
                className="dash-icon-btn"
                onClick={alternar}
                aria-label={tema === 'claro' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              >
                <span aria-hidden="true">{tema === 'claro' ? '🌙' : '☀️'}</span>
              </button>

              <div className="dash-user" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="dash-user-btn"
                  onClick={() => setMenuUsuarioAberto((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuUsuarioAberto}
                  aria-label="Menu do usuário"
                >
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
                    <button
                      type="button"
                      role="menuitem"
                      className="dash-menu-item"
                      onClick={() => { setMenuUsuarioAberto(false); setAba('config'); }}
                    >
                      <span aria-hidden="true">⚙️</span> Configurações
                    </button>
                    <div style={{ padding: 4 }}>
                      <LogoutButton
                        estilo={{
                          width: '100%',
                          padding: '9px 12px',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontSize: 13,
                          borderRadius: 8,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="dash-content">
            {aba === 'visao' && (
              <>
                <section className="dash-kpis" aria-label="Indicadores principais">
                  <KpiCard icon="🐮" label="Total de animais" value={stats.total} />
                  <KpiCard icon="🥛" label="Produção total" value={`${stats.producaoTotal.toFixed(1)} L`} />
                  <KpiCard icon="📊" label="Média por animal" value={`${stats.media.toFixed(2)} L`} />
                  <KpiCard
                    icon="🏆"
                    label="Maior produtor"
                    value={stats.maior ? `${stats.maior.nome} · ${stats.maior.producaoDiaria} L` : '—'}
                  />
                </section>

                <section className="dash-panel" aria-labelledby="top5-title">
                  <div className="dash-panel-head">
                    <h2 id="top5-title" className="dash-panel-title">Top 5 — Produção diária</h2>
                    <span className="dash-panel-meta">litros por dia</span>
                  </div>
                  {stats.top5.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Cadastre animais para ver o ranking.</p>
                  ) : (
                    <div className="dash-chart-rows">
                      {stats.top5.map((a, i) => (
                        <div key={String(a.id)} className="dash-chart-row">
                          <span className="dash-chart-label" title={a.nome}>{a.nome}</span>
                          <div className="dash-chart-track">
                            <div
                              className="dash-chart-fill"
                              style={{
                                width: `${(a.producaoDiaria / stats.maxProd) * 100}%`,
                                animationDelay: `${i * 0.06}s`,
                              }}
                            />
                          </div>
                          <span className="dash-chart-value">{a.producaoDiaria} L</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="dash-panel" aria-labelledby="cat-title">
                  <div className="dash-panel-head">
                    <h2 id="cat-title" className="dash-panel-title">Distribuição por categoria</h2>
                  </div>
                  <div className="dash-chips">
                    {Object.entries(stats.porCategoria).map(([cat, qtd]) => (
                      <span key={cat} className="dash-chip">
                        {cat}
                        <span className="dash-chip-count">{qtd}</span>
                      </span>
                    ))}
                    {stats.total === 0 && (
                      <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>Nenhum animal cadastrado.</span>
                    )}
                  </div>
                </section>
              </>
            )}

            {aba === 'rebanho' && (
              <>
                <section className="dash-kpis" aria-label="Resumo do rebanho">
                  <KpiCard icon="🐮" label="Total de animais" value={stats.total} />
                  <KpiCard icon="🥛" label="Produção total" value={`${stats.producaoTotal.toFixed(1)} L`} />
                  <KpiCard icon="📊" label="Média por animal" value={`${stats.media.toFixed(2)} L`} />
                  <KpiCard
                    icon="🏆"
                    label="Maior produtor"
                    value={stats.maior ? stats.maior.nome : '—'}
                  />
                </section>

                {/* ---------- ESTADO: CARREGANDO / ERRO ---------- */}
                {carregando && (
                  <div className="dash-status-panel" role="status" aria-live="polite">
                    <div className="dash-spinner" aria-hidden="true" />
                    <p className="dash-status-text">Carregando rebanho…</p>
                  </div>
                )}

                {!carregando && erro && (
                  <div className="dash-status-panel is-error" role="alert">
                    <p className="dash-status-text">
                      <span aria-hidden="true">⚠️</span> {erro}
                    </p>
                  </div>
                )}

                {/* ---------- FORMULÁRIO ---------- */}
                {!carregando && !erro && (
                  <section className="dash-panel" aria-labelledby="rebanho-form-title">
                    <div className="dash-panel-head">
                      <h2 id="rebanho-form-title" className="dash-panel-title">
                        {animalEditando ? 'Editar animal' : 'Novo animal'}
                      </h2>
                      <span className="dash-panel-meta">
                        {animalEditando
                          ? `Editando ${animalEditando.nome} · brinco ${animalEditando.brinco}`
                          : 'Preencha os dados abaixo para cadastrar'}
                      </span>
                    </div>
                    <div className="dash-form-wrap">
                      <AnimalForm
                        animalEditando={animalEditando}
                        onSalvar={handleSalvar}
                        onCancelar={() => setAnimalEditando(null)}
                      />
                    </div>
                  </section>
                )}

                {/* ---------- LISTA ---------- */}
                {!carregando && !erro && (
                  <section className="dash-panel" aria-labelledby="rebanho-list-title">
                    <div className="dash-panel-head">
                      <h2 id="rebanho-list-title" className="dash-panel-title">
                        Lista de animais
                      </h2>
                      <span className="dash-panel-meta">
                        {animaisFiltrados.length} de {animais.length}
                        {animaisFiltrados.length === 1 ? ' animal' : ' animais'}
                      </span>
                    </div>

                    <div className="dash-filters" role="search" aria-label="Filtros de animais" style={{ marginBottom: 16 }}>
                      <input
                        type="search"
                        className="dash-input"
                        placeholder="Buscar por nome ou brinco…"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        aria-label="Buscar animais"
                      />
                      <select
                        className="dash-select"
                        value={categoriaFiltro}
                        onChange={(e) => setCategoriaFiltro(e.target.value as typeof categoriaFiltro)}
                        aria-label="Filtrar por categoria"
                      >
                        {['Todas', 'Bezerra', 'Novilha', 'Vaca em Lactação', 'Vaca Seca'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {filtrosAtivos && (
                        <button
                          type="button"
                          className="dash-btn dash-btn-ghost"
                          onClick={limparFiltros}
                        >
                          Limpar filtros
                        </button>
                      )}
                    </div>

                    {animaisFiltrados.length === 0 ? (
                      <div className="dash-empty">
                        <span className="dash-empty-icon" aria-hidden="true">
                          {animais.length === 0 ? '🐄' : '🔎'}
                        </span>
                        <h3 className="dash-empty-title">
                          {animais.length === 0 ? 'Nenhum animal cadastrado' : 'Nenhum resultado'}
                        </h3>
                        <p className="dash-empty-desc">
                          {animais.length === 0
                            ? 'Cadastre seu primeiro animal usando o formulário acima para começar a acompanhar a produção.'
                            : 'Nenhum animal corresponde aos filtros aplicados. Tente ajustar a busca ou o filtro de categoria.'}
                        </p>
                        {animais.length > 0 && (
                          <button
                            type="button"
                            className="dash-btn dash-btn-primary"
                            onClick={limparFiltros}
                          >
                            Limpar filtros
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="dash-table-hint" aria-hidden="true">
                          <span>↔</span> Arraste para o lado para ver todas as colunas
                        </p>

                        <div
                          className="dash-table-wrap"
                          role="region"
                          aria-label="Tabela de animais"
                          tabIndex={0}
                        >
                          <table className="dash-table">
                            <caption className="sr-only">
                              Lista de animais do rebanho. Use os botões na coluna de ações para editar ou excluir.
                            </caption>
                            <thead>
                              <tr>
                                <th scope="col">Brinco</th>
                                <th scope="col">Nome</th>
                                <th scope="col">Categoria</th>
                                <th scope="col" className="num">Produção</th>
                                <th scope="col" className="actions-col">
                                  <span className="sr-only">Ações</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {animaisFiltrados.map((a) => (
                                <tr key={String(a.id)}>
                                  <td className="brinco-cell">{a.brinco}</td>
                                  <td>{a.nome}</td>
                                  <td>
                                    <span className="dash-cat-badge">{a.categoria}</span>
                                  </td>
                                  <td className="num">{a.producaoDiaria} L</td>
                                  <td className="actions-cell">
                                    <div className="dash-row-actions">
                                      <button
                                        type="button"
                                        className="dash-row-btn"
                                        onClick={() => {
                                          setAnimalEditando(a);
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        aria-label={`Editar ${a.nome}`}
                                        title="Editar"
                                      >
                                        <IconEdit />
                                      </button>
                                      <button
                                        type="button"
                                        className="dash-row-btn is-danger"
                                        onClick={() => handleExcluir(a)}
                                        aria-label={`Excluir ${a.nome}`}
                                        title="Excluir"
                                      >
                                        <IconTrash />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </section>
                )}
              </>
            )}

            {aba === 'relatorios' && (
              <>
                <section className="dash-kpis" aria-label="Resumo">
                  <KpiCard icon="🥛" label="Produção total" value={`${stats.producaoTotal.toFixed(1)} L`} />
                  <KpiCard icon="📊" label="Média geral" value={`${stats.media.toFixed(2)} L`} />
                  <KpiCard icon="🏆" label="Maior produtor" value={stats.maior ? stats.maior.nome : '—'} />
                  <KpiCard icon="📉" label="Menor produtor" value={stats.menor ? stats.menor.nome : '—'} />
                </section>

                <section className="dash-panel" aria-labelledby="rel-title">
                  <div className="dash-panel-head">
                    <h2 id="rel-title" className="dash-panel-title">Relatório detalhado</h2>
                    <button
                      type="button"
                      className="dash-btn dash-btn-ghost"
                      onClick={() => window.print()}
                    >
                      🖨️ Imprimir
                    </button>
                  </div>

                  <p className="dash-table-hint" aria-hidden="true">
                    <span>↔</span> Arraste para o lado para ver todas as colunas
                  </p>

                  <div className="dash-table-wrap" role="region" aria-label="Tabela de animais" tabIndex={0}>
                    <table className="dash-table">
                      <caption className="sr-only">
                        Relatório detalhado de animais
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Brinco</th>
                          <th scope="col">Nome</th>
                          <th scope="col">Categoria</th>
                          <th scope="col" className="num">Produção</th>
                        </tr>
                      </thead>
                      <tbody>
                        {animais.map((a) => (
                          <tr key={String(a.id)}>
                            <td className="brinco-cell">{a.brinco}</td>
                            <td>{a.nome}</td>
                            <td>
                              <span className="dash-cat-badge">{a.categoria}</span>
                            </td>
                            <td className="num">{a.producaoDiaria} L</td>
                          </tr>
                        ))}
                        {animais.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                              Sem dados para exibir.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {aba === 'config' && (
              <>
                <section className="dash-panel" aria-labelledby="pref-title">
                  <div className="dash-panel-head">
                    <h2 id="pref-title" className="dash-panel-title">Preferências</h2>
                  </div>

                  <div className="dash-config-row">
                    <div>
                      <div className="dash-config-label">Tema da interface</div>
                      <div className="dash-config-desc">Alterna entre claro e escuro</div>
                    </div>
                    <button
                      type="button"
                      className="dash-btn dash-btn-ghost"
                      onClick={alternar}
                    >
                      {tema === 'claro' ? '🌙 Ativar escuro' : '☀️ Ativar claro'}
                    </button>
                  </div>

                  <div className="dash-config-row">
                    <div>
                      <div className="dash-config-label">Backup dos dados</div>
                      <div className="dash-config-desc">Exporte ou importe em formato JSON</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="dash-btn dash-btn-ghost" onClick={exportarJSON}>
                        ⬇️ Exportar
                      </button>
                      <button
                        type="button"
                        className="dash-btn dash-btn-ghost"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        ⬆️ Importar
                      </button>
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
                      <div className="dash-config-label">Zerar rebanho</div>
                      <div className="dash-config-desc">Remove todos os animais cadastrados</div>
                    </div>
                    <button
                      type="button"
                      className="dash-btn dash-btn-danger"
                      onClick={zerarRebanho}
                    >
                      Zerar rebanho
                    </button>
                  </div>
                </section>

                <section className="dash-danger-zone" aria-labelledby="danger-title">
                  <h2 id="danger-title" className="dash-danger-title">
                    <span aria-hidden="true">⚠️</span> Zona de Perigo
                  </h2>
                  <p className="dash-danger-desc">
                    Ações irreversíveis. Tenha certeza antes de continuar.
                  </p>

                  <div className="dash-danger-row">
                    <div>
                      <div className="dash-config-label">Excluir minha conta</div>
                      <div className="dash-config-desc">
                        Apaga permanentemente sua conta e todos os dados associados.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="dash-btn dash-btn-danger"
                      onClick={abrirModalExcluir}
                    >
                      Excluir conta
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        </main>

        {drawerMobileAberto && (
          <>
            <div
              className="dash-mobile-backdrop"
              onClick={() => setDrawerMobileAberto(false)}
              aria-hidden="true"
            />
            <aside
              className="dash-mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navegação"
            >
              <div className="dash-brand">
                <span className="dash-brand-mark" aria-hidden="true">🐄</span>
                <div className="dash-brand-text">
                  <span className="dash-brand-name">AgroGestor</span>
                  <span className="dash-brand-sub">Gestão de Rebanho</span>
                </div>
              </div>

              <span className="dash-nav-label">Navegação</span>
              <nav className="dash-nav">
                {(
                  [
                    ['visao', '📊', 'Visão Geral', null],
                    ['rebanho', '🐮', 'Rebanho', animais.length || null],
                    ['relatorios', '📈', 'Relatórios', null],
                    ['config', '⚙️', 'Configurações', null],
                  ] as const
                ).map(([id, icon, label, badge]) => (
                  <button
                    key={id}
                    type="button"
                    className={`dash-nav-btn${aba === id ? ' is-active' : ''}`}
                    onClick={() => navegarPara(id)}
                  >
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
          <div
            className="dash-overlay"
            onClick={() => !excluindo && setModalExcluirAberto(false)}
            role="presentation"
          >
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-excluir-title"
              aria-describedby="modal-excluir-desc"
              className="dash-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dash-modal-icon" aria-hidden="true">⚠️</div>
              <h2 id="modal-excluir-title" className="dash-modal-title">
                Excluir conta permanentemente?
              </h2>
              <p id="modal-excluir-desc" className="dash-modal-desc">
                Esta ação é <strong>irreversível</strong>. Todos os seus animais, relatórios e
                dados serão apagados permanentemente. Digite sua senha para confirmar.
              </p>

              <label htmlFor="senha-excluir" className="dash-modal-label">
                Senha atual
              </label>
              <input
                id="senha-excluir"
                type="password"
                className="dash-input"
                placeholder="Digite sua senha"
                value={senhaExcluir}
                onChange={(e) => setSenhaExcluir(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !excluindo) handleExcluirConta();
                }}
                autoFocus
                disabled={excluindo}
                autoComplete="current-password"
                aria-describedby={erroExcluir ? 'erro-excluir' : undefined}
                aria-invalid={!!erroExcluir}
              />
              {erroExcluir && (
                <p id="erro-excluir" className="dash-error-inline" role="alert">
                  <span aria-hidden="true">●</span> {erroExcluir}
                </p>
              )}

              <div className="dash-modal-actions">
                <button
                  type="button"
                  className="dash-btn dash-btn-ghost"
                  onClick={() => setModalExcluirAberto(false)}
                  disabled={excluindo}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="dash-btn dash-btn-danger"
                  onClick={handleExcluirConta}
                  disabled={excluindo || !senhaExcluir.trim()}
                >
                  {excluindo ? 'Excluindo…' : 'Sim, excluir conta'}
                </button>
              </div>
            </div>
          </div>
        )}

        {paletaAberta && (
          <div
            className="dash-overlay"
            onClick={() => setPaletaAberta(false)}
            role="presentation"
            style={{ alignItems: 'flex-start', paddingTop: '12vh' }}
          >
            <div
              ref={paletaRef}
              role="dialog"
              aria-modal="true"
              aria-label="Paleta de comandos"
              className="dash-palette"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                type="text"
                className="dash-palette-input"
                placeholder="Buscar comandos ou animais…"
                value={buscaPaleta}
                onChange={(e) => { setBuscaPaleta(e.target.value); setPaletaSelecionada(0); }}
                onKeyDown={onPaletaKeyDown}
                aria-label="Buscar"
              />

              <div className="dash-palette-list" role="listbox">
                {paletaItens.todos.length === 0 && (
                  <div className="dash-palette-empty">Nada encontrado.</div>
                )}

                {paletaItens.comandos.length > 0 && (
                  <>
                    <div className="dash-palette-group">Ações</div>
                    {paletaItens.comandos.map((item, i) => {
                      const sel = i === paletaSelecionada;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={sel}
                          className={`dash-palette-item${sel ? ' is-selected' : ''}`}
                          onMouseEnter={() => setPaletaSelecionada(i)}
                          onClick={() => { item.run(); setPaletaAberta(false); }}
                        >
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

                {paletaItens.animais.length > 0 && (
                  <>
                    <div className="dash-palette-group">Animais</div>
                    {paletaItens.animais.map((item, i) => {
                      const idx = paletaItens.comandos.length + i;
                      const sel = idx === paletaSelecionada;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={sel}
                          className={`dash-palette-item${sel ? ' is-selected' : ''}`}
                          onMouseEnter={() => setPaletaSelecionada(idx)}
                          onClick={() => { item.run(); setPaletaAberta(false); }}
                        >
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

        <div
          className="dash-toasts"
          role="region"
          aria-label="Notificações"
          aria-live="polite"
        >
          {toasts.map((tst) => (
            <div key={tst.id} className={`dash-toast dash-toast--${tst.tipo}`}>
              <span className="dash-toast-icon" aria-hidden="true">
                {tst.tipo === 'sucesso' ? '✓' : tst.tipo === 'erro' ? '!' : 'i'}
              </span>
              <span className="dash-toast-text">{tst.texto}</span>
              <button
                type="button"
                className="dash-toast-close"
                onClick={() => remover(tst.id)}
                aria-label="Fechar notificação"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={importarJSON}
          style={{ display: 'none' }}
        />
      </div>
    </>
  );
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
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