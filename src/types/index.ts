// ============================================================
// Tipos da API
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

export interface Nome {
  id?: string | number;
  nome: string;
}

export interface NomeRequestDTO {
  nome: string;
}

// ============================================================
// Tipos da aplicação
// ============================================================

export interface Animal {
  id?: string | number;
  brinco: string;
  nome: string;
  categoria: 'Bezerra' | 'Novilha' | 'Vaca em Lactação' | 'Vaca Seca';
  producaoDiaria: number;
}

export interface ApiError {
  status: number;
  mensagem: string;
  detalhes?: unknown;
}