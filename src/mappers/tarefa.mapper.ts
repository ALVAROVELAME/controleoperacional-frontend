// src/mappers/tarefa.mapper.ts
// ÚNICA camada que conhece domain E api. Toda conversão passa aqui.

import { PRIORIDADES, STATUS_IDS, uid, LIMITES } from '../types/domain';
import type { Prioridade, StatusColuna, Tarefa } from '../types/domain';
import type {
  CriarTarefaRequest,
  AtualizarTarefaRequest,
} from '../types/api';

/** Payload que o cliente envia para criar/atualizar (id e criadoEm são do servidor). */
export type TarefaInput = Omit<Tarefa, 'id' | 'criadoEm'>;

// ============================================================
// Helpers de enum
// ============================================================

/** Normaliza "EmProgresso", "em_progresso", "Em Progresso" → "emprogresso". */
const chaveEnum = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const lerStatus = (v: unknown): StatusColuna => {
  if (typeof v === 'number') return STATUS_IDS[v] ?? 'a_fazer';
  switch (chaveEnum(v)) {
    case 'emprogresso': return 'em_progresso';
    case 'revisao':     return 'revisao';
    case 'concluido':   return 'concluido';
    default:            return 'a_fazer';
  }
};

const lerPrioridade = (v: unknown): Prioridade => {
  if (typeof v === 'number') return PRIORIDADES[v] ?? 'media';
  switch (chaveEnum(v)) {
    case 'alta':  return 'alta';
    case 'baixa': return 'baixa';
    default:      return 'media';
  }
};

// ============================================================
// Response → Domain
// ============================================================

/**
 * Converte qualquer JSON vindo da API (ou do cache/backup) em `Tarefa` válida.
 * Retorna null se não der pra recuperar (ex: sem título).
 *
 * Tolerante a:
 *  - enum numérico (0..3) OU string ("EmProgresso", "alta", ...)
 *  - id string OU number
 *  - campos ausentes ou nulos
 *  - prazo em formatos inesperados (só aceita YYYY-MM-DD)
 */
export function sanitizarTarefa(raw: unknown): Tarefa | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const titulo = typeof r.titulo === 'string'
    ? r.titulo.trim().slice(0, LIMITES.titulo)
    : '';
  if (!titulo) return null;

  const descricao = typeof r.descricao === 'string'
    ? r.descricao.trim().slice(0, LIMITES.descricao)
    : '';

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
    pomodoros:
      typeof r.pomodoros === 'number' && r.pomodoros > 0
        ? Math.floor(r.pomodoros)
        : undefined,
    pomodorosPlanejados:
      typeof r.pomodorosPlanejados === 'number' && r.pomodorosPlanejados > 0
        ? Math.min(LIMITES.pomodorosPlanejados, Math.floor(r.pomodorosPlanejados))
        : undefined,
  };
}

/** Converte uma lista JSON em Tarefa[] filtrando entradas inválidas. */
export function sanitizarLista(raw: unknown): Tarefa[] {
  return Array.isArray(raw)
    ? raw.map(sanitizarTarefa).filter((t): t is Tarefa => t !== null)
    : [];
}

// ============================================================
// Domain → Request
// ============================================================

export function paraCriarRequest(t: TarefaInput): CriarTarefaRequest {
  return {
    titulo: t.titulo,
    descricao: t.descricao ?? null,
    prioridade: t.prioridade,
    status: t.status,
    prazo: t.prazo ?? null,
    pomodorosPlanejados: t.pomodorosPlanejados ?? null,
    pomodoros: t.pomodoros ?? 0,
  };
}

export function paraAtualizarRequest(t: TarefaInput): AtualizarTarefaRequest {
  return {
    titulo: t.titulo,
    descricao: t.descricao ?? null,
    prioridade: t.prioridade,
    status: t.status,
    prazo: t.prazo ?? null,
    pomodorosPlanejados: t.pomodorosPlanejados ?? null,
    // pomodoros NÃO vai no PUT — pertence ao servidor
  };
}

// ============================================================
// Tarefa (domain) → Request
// ============================================================
// Aceita `Tarefa` completo — os campos extras (id, criadoEm) são ignorados,
// já que `CriarTarefaRequest` / `AtualizarTarefaRequest` não os incluem.

export function paraPayloadCriar(t: Tarefa | TarefaInput): CriarTarefaRequest {
  return paraCriarRequest(t);
}

export function paraPayloadAtualizar(t: Tarefa | TarefaInput): AtualizarTarefaRequest {
  return paraAtualizarRequest(t);
}

// ============================================================
// Tarefa (domain) → TarefaInput
// ============================================================
// Usado quando precisamos "repassar" uma Tarefa de volta como input
// (ex: undo de exclusão, migração de legado).

export function paraInput(t: Tarefa): TarefaInput {
  return {
    titulo: t.titulo,
    descricao: t.descricao,
    prioridade: t.prioridade,
    status: t.status,
    prazo: t.prazo,
    pomodoros: t.pomodoros,
    pomodorosPlanejados: t.pomodorosPlanejados,
  };
}