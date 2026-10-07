// src/types/api.ts
// Contrato EXATO com o backend C#. Nada aqui pode ser inventado sem
// combinar com o swagger.

// ============================================================
// AUTH
// ============================================================

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  sucesso?: boolean;
  mensagem?: string;
  token: string;
  tipo?: string;
  usuario?: UsuarioResponse;
}

export interface UsuarioResponse {
  id?: string | number;
  nome: string;
  email: string;
  ativo?: boolean;
  confirmado?: boolean;
}

export interface CadastroRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface ExcluirContaRequest {
  senha: string;
}

export interface MensagemResponse {
  sucesso?: boolean;
  mensagem: string;
}

// ============================================================
// TAREFAS — enum vai como STRING (backend usa JsonStringEnumConverter)
// ============================================================

export type PrioridadeApi = 'baixa' | 'media' | 'alta';
export type StatusColunaApi = 'a_fazer' | 'em_progresso' | 'revisao' | 'concluido';

export interface CriarTarefaRequest {
  titulo: string;
  descricao: string | null;
  prioridade: PrioridadeApi;
  status: StatusColunaApi;
  prazo: string | null;              // YYYY-MM-DD (DateOnly?)
  pomodorosPlanejados: number | null;
  pomodoros: number;                 // só no criar (0)
}

export interface AtualizarTarefaRequest {
  titulo: string;
  descricao: string | null;
  prioridade: PrioridadeApi;
  status: StatusColunaApi;
  prazo: string | null;
  pomodorosPlanejados: number | null;
  // pomodoros NÃO vai no PUT — pertence ao servidor
}

export interface MudarStatusRequest {
  status: StatusColunaApi;
}

export interface TarefaResponse {
  id: string;
  titulo: string;
  descricao?: string | null;
  prioridade: PrioridadeApi | number;   // aceita os dois
  status: StatusColunaApi | number;
  criadoEm: string;                     // ISO 8601
  prazo?: string | null;
  pomodoros?: number | null;
  pomodorosPlanejados?: number | null;
}

// ============================================================
// POMODORO
// ============================================================

export type ModoPomodoro = 'foco' | 'pausa_curta' | 'pausa_longa';

export type TipoEventoPomodoro =
  | 'foco_iniciado'    | 'foco_pausado'    | 'foco_retomado'
  | 'foco_completado'  | 'foco_interrompido'
  | 'pausa_iniciada'   | 'pausa_pausada'   | 'pausa_retomada'
  | 'pausa_completada' | 'pausa_interrompida'
  | 'modo_alterado';

export interface EventoPomodoroRequest {
  tipo: TipoEventoPomodoro;
  modo: ModoPomodoro;
  ciclo: number;
  minutosPlanejados: number;
  minutosReais: number;
  segundosReais: number;
  ocorridoEm: string;              // ISO 8601 com timezone
  tarefaId: string | null;
  tarefaTitulo: string | null;
  statusTarefa: StatusColunaApi | null;
}