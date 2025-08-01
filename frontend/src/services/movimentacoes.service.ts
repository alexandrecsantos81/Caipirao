// /frontend/src/services/movimentacoes.service.ts
import api from './api';

export interface Venda {
  id: number;
  data_venda: string;
  produto_nome: string;
  valor_total: number;
  cliente_nome: string;
  cliente_id: number;
  peso: number | null;
  data_pagamento: string | null;
  data_vencimento: string | null; // <<< ADICIONADO AQUI
  preco_manual: number | null;
  responsavel_venda: string | null;
}

export type CreateMovimentacaoPayload = {
  cliente_id: number;
  produto_nome: string;
  data_venda: string;
  data_pagamento: string | null;
  data_vencimento: string | null; // <<< ADICIONADO AQUI
  peso_produto: number | null;
  valor_total: number;
  preco_manual: number | null;
  responsavel_venda: string | null;
};

export type UpdateMovimentacaoPayload = CreateMovimentacaoPayload;

// --- Funções da API (não precisam de alteração na assinatura) ---

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
