import api from './api';

// Interface que define a estrutura de um Produto
export interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
}

// Interface para o payload de criação de um novo produto
export interface CreateProdutoPayload {
  nome: string;
  descricao?: string;
  preco: number;
}

// Função para buscar a lista de todos os produtos
export const getProdutos = async (): Promise<Produto[]> => {
  const response = await api.get('/api/produtos');
  return response.data;
};

// Função para criar um novo produto
export const createProduto = async (payload: CreateProdutoPayload): Promise<Produto> => {
  const response = await api.post('/api/produtos', payload);
  return response.data;
};
