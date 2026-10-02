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
// Tipos da aplicação — CtOperacional (Kanban)
// ============================================================

export type StatusColuna = 'a_fazer' | 'em_progresso' | 'revisao' | 'concluido';

export type Prioridade = 'baixa' | 'media' | 'alta';

export type Tema = 'claro' | 'escuro';

export type Aba = 'quadro' | 'lista' | 'relatorios' | 'config';

export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  prioridade: Prioridade;
  status: StatusColuna;
  criadoEm: string;
}

export interface Coluna {
  id: StatusColuna;
  titulo: string;
  icon: string;
}

export interface Toast {
  id: string;
  texto: string;
  tipo: 'sucesso' | 'erro' | 'info';
}