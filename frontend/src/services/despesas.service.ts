// /frontend/src/services/despesas.service.ts
import api from './api';

// Interface que define a estrutura de uma Despesa, como vem da API
export interface Despesa {
  id: number;
  tipo_saida: string;
  discriminacao: string | null;
  nome_recebedor: string | null;
  data_pagamento: string | null; // Datas vêm como string (ISO format)
  data_vencimento: string | null;
  forma_pagamento: string | null;
  valor: number;
  responsavel_pagamento: string | null;
  criado_em: string;
}

// Tipo para o payload de criação de uma nova despesa.
// Os campos opcionais são tratados aqui.
export type CreateDespesaPayload = Omit<Despesa, 'id' | 'criado_em'>;

/**
 * Busca a lista de todas as despesas na API.
 * @returns Uma promessa que resolve para um array de Despesa.
 */
export async function getDespesas(): Promise<Despesa[]> {
  const response = await api.get('/api/despesas');
  return response.data;
}

/**
 * Envia os dados de uma nova despesa para a API.
 * @param data - Os dados da nova despesa.
 * @returns Uma promessa que resolve para a despesa recém-criada.
 */
export async function createDespesa(data: CreateDespesaPayload): Promise<Despesa> {
  const response = await api.post('/api/despesas', data);
  return response.data;
}
