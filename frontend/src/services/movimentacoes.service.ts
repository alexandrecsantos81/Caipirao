// Caminho do arquivo: /frontend/src/services/movimentacoes.service.ts

import api from './api';
/**
 * Interface que representa a estrutura de uma Movimentação
 * como ela é recebida da API (após o JOIN no backend).
 */
export interface Movimentacao {
  id: number;
  tipo: 'ENTRADA' | 'SAIDA';
  produto_id: number;
  cliente_id: number;
  quantidade: number;
  valor_unitario: number;
  data: string;
  observacao?: string;
  produto_nome: string;
  cliente_nome: string;
}

/**
 * ESTA É A ADIÇÃO PRINCIPAL
 * Define o tipo de dados esperado pela API ao criar uma nova movimentação.
 * Este é o "contrato" que o frontend deve seguir ao enviar dados.
 */
export type CreateMovimentacaoPayload = {
  tipo: 'ENTRADA' | 'SAIDA';
  produto_id: number;
  cliente_id: number;
  quantidade: number;
  valor_unitario: number;
  data: string;
  observacao?: string;
};

/**
 * Busca a lista de todas as movimentações na API.
 * @returns Uma promessa que resolve para um array de Movimentacao.
 */
export async function getMovimentacoes(): Promise<Movimentacao[]> {
  const response = await api.get('/movimentacoes');
  return response.data;
}

/**
 * Envia os dados de uma nova movimentação para a API.
 * A função agora está tipada para receber o payload que acabamos de definir.
 * @param data - Os dados da nova movimentação, seguindo o tipo CreateMovimentacaoPayload.
 * @returns Uma promessa que resolve para a movimentação recém-criada.
 */
export async function createMovimentacao(data: CreateMovimentacaoPayload): Promise<Movimentacao> {
  const response = await api.post('/movimentacoes', data);
  return response.data;
}

// Futuramente, você pode adicionar as funções de update e delete aqui.
// export async function updateMovimentacao(id: number, data: Partial<CreateMovimentacaoPayload>): Promise<Movimentacao> { ... }
// export async function deleteMovimentacao(id: number): Promise<void> { ... }
