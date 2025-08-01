import api from './api';

// Interface completa para o Cliente
export interface Cliente {
  id: number;
  nome: string;
  contato: string;
  nome_responsavel?: string;
  telefone_whatsapp?: boolean;
  logradouro?: string;
  quadra?: string;
  lote?: string;
  bairro?: string;
  cep?: string;
  ponto_referencia?: string;
}

// Tipo para o payload de criação (sem o 'id')
export type CreateClientePayload = Omit<Cliente, 'id'>;

// Tipo para o payload de atualização (também sem o 'id', pois ele será passado separadamente)
export type UpdateClientePayload = Omit<Cliente, 'id'>;

// --- Funções da API ---

export const getClientes = async (): Promise<Cliente[]> => {
  const response = await api.get('/api/clientes');
  return response.data;
};

export const createCliente = async (data: CreateClientePayload): Promise<Cliente> => {
  const response = await api.post('/api/clientes', data);
  return response.data;
};

// CORREÇÃO: A função agora aceita o ID e o payload separadamente.
export const updateCliente = async ({ id, payload }: { id: number, payload: UpdateClientePayload }): Promise<Cliente> => {
  const response = await api.put(`/api/clientes/${id}`, payload);
  return response.data;
};

export const deleteCliente = async (id: number): Promise<void> => {
  await api.delete(`/api/clientes/${id}`);
};
