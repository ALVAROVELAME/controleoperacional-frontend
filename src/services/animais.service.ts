import { api } from './api';
import type { Animal } from '../types';

// ============================================================
// Mapeamento explícito UI <-> API
// (evita bugs com acento, espaço e case — ex.: "Vaca em Lactação")
// ============================================================
const CATEGORIA_PARA_API: Record<Animal['categoria'], string> = {
  'Bezerra': 'BEZERRA',
  'Novilha': 'NOVILHA',
  'Vaca em Lactação': 'VACA_EM_LACTACAO',
  'Vaca Seca': 'VACA_SECA',
};

const CATEGORIA_DA_API: Record<string, Animal['categoria']> = {
  BEZERRA: 'Bezerra',
  NOVILHA: 'Novilha',
  VACA_EM_LACTACAO: 'Vaca em Lactação',
  VACA_SECA: 'Vaca Seca',
};

const mapCategoriaParaApi = (c: Animal['categoria']): string =>
  CATEGORIA_PARA_API[c] ?? c.toUpperCase();

const mapCategoriaDaApi = (c: string): Animal['categoria'] =>
  CATEGORIA_DA_API[c] ?? 'Vaca em Lactação';

// ============================================================
// Service
// ============================================================
export const animaisService = {
  async listar(): Promise<Animal[]> {
    const { data } = await api.get<any[]>('/api/animais');
    return data.map((a) => ({
      id: a.id,
      brinco: a.brinco,
      nome: a.nome,
      categoria: mapCategoriaDaApi(a.categoria),
      producaoDiaria: a.producaoDiaria,
    }));
  },

  async criar(animal: Omit<Animal, 'id'>): Promise<Animal> {
    const { data } = await api.post<any>('/api/animais', {
      brinco: animal.brinco,
      nome: animal.nome,
      categoria: mapCategoriaParaApi(animal.categoria),
      producaoDiaria: animal.producaoDiaria,
    });
    return {
      id: data.id,
      brinco: data.brinco,
      nome: data.nome,
      categoria: mapCategoriaDaApi(data.categoria),
      producaoDiaria: data.producaoDiaria,
    };
  },

  async atualizar(animal: Animal): Promise<Animal> {
    const { data } = await api.put<any>(`/api/animais/${animal.id}`, {
      brinco: animal.brinco,
      nome: animal.nome,
      categoria: mapCategoriaParaApi(animal.categoria),
      producaoDiaria: animal.producaoDiaria,
    });
    return {
      id: data.id,
      brinco: data.brinco,
      nome: data.nome,
      categoria: mapCategoriaDaApi(data.categoria),
      producaoDiaria: data.producaoDiaria,
    };
  },

  async excluir(id: string | number): Promise<void> {
    await api.delete(`/api/animais/${id}`);
  },
};