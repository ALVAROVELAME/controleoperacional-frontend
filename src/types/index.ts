// src/types/index.ts

// ============================================================
// Tipos da API (alinhados com o Swagger)
// ============================================================

export interface Usuario {
  id?: string | number;
  nome: string;
  email: string;
  ativo?: boolean;
  confirmado?: boolean;
}

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface LoginRespostaDTO {
  sucesso?: boolean;
  mensagem?: string;
  token: string;
  tipo?: string;
  usuario?: Usuario;
}

export interface UsuarioCadastroDTO {
  nome: string;
  email: string;
  senha: string;
}

export interface ExcluirContaDTO {
  senha: string;
}

export interface MensagemRespostaDTO {
  sucesso?: boolean;
  mensagem: string;
}

// Cliente (endpoint /clientes do Swagger — usado apenas para testes)
export interface Cliente {
  id?: string | number;
  nome: string;
}

export interface ClienteRequestDTO {
  nome: string;
}

export interface ApiError {
  status: number;
  mensagem: string;
  detalhes?: unknown;
}

// ============================================================
// Reexports dos tipos de domínio (fonte única: ./tarefa.ts)
// ============================================================
export type {
  StatusColuna,
  Prioridade,
  Tarefa,
  TarefaInput,
  Toast,
  ToastTipo,
} from './tarefa';

export type Tema = 'claro' | 'escuro';
export type Aba = 'quadro' | 'lista' | 'relatorios' | 'config';