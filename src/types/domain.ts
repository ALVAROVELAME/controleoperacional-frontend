// src/types/domain.ts
// Modelos usados pela UI. NÃO são os DTOs da API.

export type Prioridade = 'baixa' | 'media' | 'alta';
export type StatusColuna = 'a_fazer' | 'em_progresso' | 'revisao' | 'concluido';

export type Tarefa = {
  id: string;
  titulo: string;
  descricao?: string;
  prioridade: Prioridade;
  status: StatusColuna;
  criadoEm: string;      // ISO 8601 (com Z)
  prazo?: string;        // YYYY-MM-DD
  pomodoros?: number;
  pomodorosPlanejados?: number;
};

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

// ORDEM = contrato com enums numéricos do C# (0,1,2,3)
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