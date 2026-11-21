import STYLES from '../styles/dashboard.css?inline';
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
import LogoutButton from '../components/auth/LogoutButton';
import { useAuth } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastProvider';
import { useToast } from '../contexts/ToastContext';
import { TarefasProvider } from '../contexts/TarefasProvider';
import { useTarefas } from '../contexts/TarefasContext';
import { limparCacheTarefas } from '../contexts/tarefasCache';
import { authService } from '../services/auth.service';
import { mensagemDeErro } from '../services/http';
import { pomodoroApi } from '../services/pomodoro.service';
import { sanitizarTarefa } from '../mappers/tarefa.mapper';
import { Pomodoro, PomodoroMini } from '../components/Pomodoro';
import { usePomodoro, POMODORO_STORAGE_KEY } from '../hooks/usePomodoro';
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
    inputRef.current?.focus();
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

  /* ------------------------------------------------------------
     tarefaFocoRef: sempre tem o id atual de forma SÍNCRONA.
     O callback onEvento do Pomodoro lê deste ref em vez do state,
     evitando o problema clássico de "stale closure" (o state ainda
     não atualizou quando o timer dispara o primeiro evento).
     ------------------------------------------------------------ */
  const tarefaFocoRef = useRef<string | null>(null);

  const setFoco = useCallback((id: string | null) => {
    tarefaFocoRef.current = id;   // síncrono — leitura imediata pelo callback
    setTarefaFocoId(id);          // assíncrono — re-render da UI
  }, []);

  const tarefasRef = useRef(tarefas);
  useEffect(() => { tarefasRef.current = tarefas; }, [tarefas]);

  const pomodoro = usePomodoro({
    onEvento: (evento) => {
      // Lê do REF (valor atual, síncrono) — não do state (que pode estar atrasado)
      const focoId = tarefaFocoRef.current;
      const alvo = focoId
        ? tarefasRef.current.find((t) => t.id === focoId)
        : undefined;

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
      // Se a tarefa excluída era a que estava em foco, limpa o foco (via ref+state)
      if (tarefaFocoRef.current === t.id) setFoco(null);
      push(`"${cortar(t.titulo)}" excluída`, 'info', {
        rotulo: 'Desfazer',
        fn: () => {
          void restaurar(removida);
        },
      });
    },
    [excluir, restaurar, push, setFoco]
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
      // ⚠️ ORDEM IMPORTA: setFoco atualiza o REF de forma síncrona,
      // então quando focarAgora() disparar o primeiro evento, o callback
      // onEvento vai ler o id da tarefa correta.
      setFoco(t.id);
      if (t.status === 'a_fazer') void mover(t.id, 'em_progresso');
      focarAgora();
      push(`Foco iniciado: ${cortar(t.titulo)}`, 'info');
    },
    [mover, focarAgora, push, setFoco]
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
    setFoco(null);
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
                        onTarefaChange={setFoco}
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