// src/types/tarefa.ts

export type Prioridade = 'baixa' | 'media' | 'alta';
export type StatusColuna = 'a_fazer' | 'em_progresso' | 'revisao' | 'concluido';

export type Tarefa = {
  id: string;
  titulo: string;
  descricao?: string;
  prioridade: Prioridade;
  status: StatusColuna;
  criadoEm: string; // ISO
  prazo?: string; // YYYY-MM-DD
  pomodoros?: number; // concluídos
  pomodorosPlanejados?: number; // estimativa
};

/** O que o cliente envia para criar/atualizar (id e criadoEm são do servidor). */
export type TarefaInput = Omit<Tarefa, 'id' | 'criadoEm'>;

export type ToastTipo = 'sucesso' | 'erro' | 'info';
export type Toast = {
  id: string;
  texto: string;
  tipo: ToastTipo;
  acao?: { rotulo: string; fn: () => void };
};

export const LIMITES = { titulo: 200, descricao: 5000, pomodorosPlanejados: 20 } as const;

export const COLUNAS: { id: StatusColuna; titulo: string; icon: string }[] = [
  { id: 'a_fazer', titulo: 'A fazer', icon: '📋' },
  { id: 'em_progresso', titulo: 'Em progresso', icon: '⚡' },
  { id: 'revisao', titulo: 'Revisão', icon: '🔍' },
  { id: 'concluido', titulo: 'Concluído', icon: '✅' },
];

// A ORDEM destes arrays é o contrato com os enums numéricos do C# (0, 1, 2, 3).
export const PRIORIDADES: Prioridade[] = ['baixa', 'media', 'alta'];
export const STATUS_IDS: StatusColuna[] = COLUNAS.map((c) => c.id);

export const TITULO_COLUNA = Object.fromEntries(COLUNAS.map((c) => [c.id, c.titulo])) as Record<StatusColuna, string>;

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

/* ------------------- leitura tolerante (JSON do C# / backup) ------------------- */

const chave = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, ''); // "AFazer", "a_fazer", "A fazer" -> "afazer"

const lerStatus = (v: unknown): StatusColuna => {
  if (typeof v === 'number') return STATUS_IDS[v] ?? 'a_fazer';
  switch (chave(v)) {
    case 'emprogresso':
      return 'em_progresso';
    case 'revisao':
      return 'revisao';
    case 'concluido':
      return 'concluido';
    default:
      return 'a_fazer';
  }
};

const lerPrioridade = (v: unknown): Prioridade => {
  if (typeof v === 'number') return PRIORIDADES[v] ?? 'media';
  switch (chave(v)) {
    case 'alta':
      return 'alta';
    case 'baixa':
      return 'baixa';
    default:
      return 'media';
  }
};

/** Converte qualquer JSON em Tarefa válida (ou null). Usado na API, no cache e no backup. */
export const sanitizar = (raw: unknown): Tarefa | null => {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const titulo = typeof r.titulo === 'string' ? r.titulo.trim().slice(0, LIMITES.titulo) : '';
  if (!titulo) return null;
  const descricao = typeof r.descricao === 'string' ? r.descricao.trim().slice(0, LIMITES.descricao) : '';
  const prazo = typeof r.prazo === 'string' ? r.prazo.slice(0, 10) : '';
  const id = typeof r.id === 'string' || typeof r.id === 'number' ? String(r.id) : '';
  return {
    id: id || uid(),
    titulo,
    descricao: descricao || undefined,
    prioridade: lerPrioridade(r.prioridade),
    status: lerStatus(r.status),
    criadoEm: typeof r.criadoEm === 'string' ? r.criadoEm : new Date().toISOString(),
    prazo: /^\d{4}-\d{2}-\d{2}$/.test(prazo) ? prazo : undefined,
    pomodoros: typeof r.pomodoros === 'number' && r.pomodoros > 0 ? Math.floor(r.pomodoros) : undefined,
    pomodorosPlanejados:
      typeof r.pomodorosPlanejados === 'number' && r.pomodorosPlanejados > 0
        ? Math.min(LIMITES.pomodorosPlanejados, Math.floor(r.pomodorosPlanejados))
        : undefined,
  };
};

export const paraInput = (t: Tarefa): TarefaInput => ({
  titulo: t.titulo,
  descricao: t.descricao,
  prioridade: t.prioridade,
  status: t.status,
  prazo: t.prazo,
  pomodoros: t.pomodoros,
  pomodorosPlanejados: t.pomodorosPlanejados,
});