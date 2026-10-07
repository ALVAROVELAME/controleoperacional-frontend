// src/types/index.ts
// Barrel de tipos. Reexporta domínio + DTOs da API.
// Nada de "legacy" — fonte única da verdade.

// Domínio (modelos da UI)
export * from './domain';

// DTOs da API (contrato com o backend C#)
export type {
  // Auth
  LoginRequest,
  LoginResponse,
  UsuarioResponse,
  CadastroRequest,
  ExcluirContaRequest,
  MensagemResponse,

  // Tarefas
  PrioridadeApi,
  StatusColunaApi,
  CriarTarefaRequest,
  AtualizarTarefaRequest,
  MudarStatusRequest,
  TarefaResponse,

  // Pomodoro
  EventoPomodoroRequest,
  TipoEventoPomodoro,
  ModoPomodoro,
} from './api';