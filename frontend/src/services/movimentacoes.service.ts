// /frontend/src/services/movimentacoes.service.ts
import api from './api';

// Interface para a lista de vendas (o que a tabela mostra)
export interface Venda {
  id: number;
  data_venda: string;
  produto_nome: string;
  valor_total: number;
  cliente_nome: string;
}

// O "contrato" de dados para criar uma nova venda
export type CreateMovimentacaoPayload = {
  cliente_id: number;
  produto_nome: string;
  data_venda: string;
  data_pagamento: string | null;
  peso_produto: number | null;
  valor_total: number;
  preco_manual: number | null;
  responsavel_venda: string | null;
};

// Busca a lista de todas as VENDAS na API.
export async function getMovimentacoes(): Promise<Venda[]> {
  const response = await api.get('/api/movimentacoes');
  return response.data;
}

// Envia os dados de uma nova VENDA para a API.
export async function createMovimentacao(data: CreateMovimentacaoPayload): Promise<any> {
  const response = await api.post('/api/movimentacoes', data);
  return response.data;
}
