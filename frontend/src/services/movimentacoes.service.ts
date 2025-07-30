// /frontend/src/services/movimentacoes.service.ts
import api from './api';

/**
 * Interface que representa a estrutura de uma Movimentação
 * como ela é recebida da API (após o JOIN no backend).
 */
export interface Movimentacao {
  id: number;
  criado_em: string;
  tipo: 'entrada' | 'saida'; // Corrigido para minúsculas, como vem da API
  valor: number;
  produto_id: number;
  cliente_id: number | null; // Corrigido para aceitar nulo
  produto_nome: string;
  cliente_nome: string | null; // Corrigido para aceitar nulo
}

/**
 * Define o tipo de dados que a API espera ao CRIAR uma nova movimentação.
 * Este é o "contrato" que o frontend deve seguir ao enviar dados.
 * CORREÇÃO: Os campos agora correspondem ao formulário e à rota da API.
 */
export type CreateMovimentacaoPayload = {
  tipo: 'saida' | 'entrada';
  produto_id: number;
  cliente_id?: number; // Cliente é opcional
  valor: number;
};

/**
 * Busca a lista de todas as movimentações na API.
 * @returns Uma promessa que resolve para um array de Movimentacao.
 */
export async function getMovimentacoes(): Promise<Movimentacao[]> {
  const response = await api.get('/api/movimentacoes');
  return response.data;
}

/**
 * Envia os dados de uma nova movimentação para a API.
 * @param data - Os dados da nova movimentação, seguindo o tipo CreateMovimentacaoPayload.
 * @returns Uma promessa que resolve para a movimentação recém-criada.
 */
export async function createMovimentacao(data: CreateMovimentacaoPayload): Promise<Movimentacao> {
  const response = await api.post('/api/movimentacoes', data);
  return response.data;
}

/**
 * Apaga uma movimentação pelo seu ID.
 * @param id - O ID da movimentação a ser apagada.
 */
export async function deleteMovimentacao(id: number): Promise<void> {
  await api.delete(`/api/movimentacoes/${id}`);
}
