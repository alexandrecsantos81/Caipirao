// /frontend/src/services/despesas.service.ts
import api from './api';

// Interface que define a estrutura de uma Despesa (sem alteração)
export interface Despesa {
  id: number;
  tipo_saida: string;
  discriminacao: string | null;
  nome_recebedor: string | null;
  data_pagamento: string | null;
  data_vencimento: string | null;
  forma_pagamento: string | null;
  valor: number;
  responsavel_pagamento: string | null;
  criado_em: string;
}

// Tipo para o payload de criação (sem alteração)
export type CreateDespesaPayload = Omit<Despesa, 'id' | 'criado_em'>;

// NOVO: Tipo para o payload de atualização
export type UpdateDespesaPayload = Omit<Despesa, 'id' | 'criado_em'>;

// --- Funções da API ---

// Função GET (sem alteração)
export async function getDespesas(): Promise<Despesa[]> {
  const response = await api.get('/api/despesas');
  return response.data;
}

// Função POST (sem alteração)
export async function createDespesa(data: CreateDespesaPayload): Promise<Despesa> {
  const response = await api.post('/api/despesas', data);
  return response.data;
}

// NOVO: Função para atualizar uma despesa
export async function updateDespesa({ id, payload }: { id: number, payload: UpdateDespesaPayload }): Promise<Despesa> {
  const response = await api.put(`/api/despesas/${id}`, payload);
  return response.data;
}

// NOVO: Função para deletar uma despesa
export async function deleteDespesa(id: number): Promise<void> {
  await api.delete(`/api/despesas/${id}`);
}
