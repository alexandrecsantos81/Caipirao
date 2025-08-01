// /frontend/src/services/produtos.service.ts
import api from './api';

// Interface que define a estrutura de um Produto
export interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
}

// Tipo para o payload de criação (sem o 'id')
export type CreateProdutoPayload = Omit<Produto, 'id'>;

// Tipo para o payload de atualização (também sem o 'id')
export type UpdateProdutoPayload = Omit<Produto, 'id'>;

// --- Funções da API ---

export const getProdutos = async (): Promise<Produto[]> => {
  const response = await api.get('/api/produtos');
  return response.data;
};

export const createProduto = async (payload: CreateProdutoPayload): Promise<Produto> => {
  const response = await api.post('/api/produtos', payload);
  return response.data;
};

// NOVO: Função para atualizar um produto
export const updateProduto = async ({ id, payload }: { id: number, payload: UpdateProdutoPayload }): Promise<Produto> => {
  const response = await api.put(`/api/produtos/${id}`, payload);
  return response.data;
};

// NOVO: Função para deletar um produto
export const deleteProduto = async (id: number): Promise<void> => {
  await api.delete(`/api/produtos/${id}`);
};
