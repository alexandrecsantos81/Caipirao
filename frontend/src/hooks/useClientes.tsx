import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getClientes, 
  createCliente, 
  updateCliente, 
  deleteCliente,
  CreateClientePayload,
  UpdateClientePayload
} from '../services/clientes.service';

const CLIENTES_QUERY_KEY = 'clientes';

export function useClientes() {
  return useQuery({ 
    queryKey: [CLIENTES_QUERY_KEY], 
    queryFn: getClientes 
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientePayload) => createCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
    },
  });
}

// CORREÇÃO: A mutação agora espera um objeto com 'id' e 'payload'.
export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number, payload: UpdateClientePayload }) => updateCliente({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
    },
  });
}
