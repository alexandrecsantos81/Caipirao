// /frontend/src/services/movimentacoes.service.ts
import api from './api';

// Interface para a lista de vendas (o que RECEBEMOS da API)
// A propriedade 'peso' está alinhada com o que o backend envia.
export interface Venda {
  id: number;
  data_venda: string;
  produto_nome: string;
  valor_total: number;
  cliente_nome: string;
  cliente_id: number;
  peso: number | null; // <-- Propriedade correta para receber os dados
  data_pagamento: string | null;
  preco_manual: number | null;
  responsavel_venda: string | null;
}

// O payload para criar/atualizar uma venda (o que ENVIAMOS para a API)
// O backend espera 'peso_produto' no corpo da requisição.
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

export type UpdateMovimentacaoPayload = CreateMovimentacaoPayload;

// --- Funções da API ---

export async function getMovimentacoes(): Promise<Venda[]> {
  const response = await api.get('/api/movimentacoes');
  return response.data;
}

export async function createMovimentacao(data: CreateMovimentacaoPayload): Promise<Venda> {
  const response = await api.post('/api/movimentacoes', data);
  return response.data;
}

export async function updateMovimentacao({ id, payload }: { id: number, payload: UpdateMovimentacaoPayload }): Promise<Venda> {
  const response = await api.put(`/api/movimentacoes/${id}`, payload);
  return response.data;
}

export async function deleteMovimentacao(id: number): Promise<void> {
  await api.delete(`/api/movimentacoes/${id}`);
}
