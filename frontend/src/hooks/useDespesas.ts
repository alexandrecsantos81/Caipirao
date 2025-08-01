// /frontend/src/hooks/useDespesas.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getDespesas, 
  createDespesa, 
  updateDespesa, // Importado
  deleteDespesa, // Importado
  CreateDespesaPayload,
  UpdateDespesaPayload  // Importado
} from '../services/despesas.service';

const DESPESAS_QUERY_KEY = 'despesas';

// Hook para BUSCAR (sem alteração)
export function useDespesas() {
  return useQuery({
    queryKey: [DESPESAS_QUERY_KEY],
    queryFn: getDespesas,
  });
}

// Hook para CRIAR (sem alteração)
export function useCreateDespesa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDespesaPayload) => createDespesa(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DESPESAS_QUERY_KEY] });
    },
  });
}

// NOVO: Hook para ATUALIZAR uma despesa
export function useUpdateDespesa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number, payload: UpdateDespesaPayload }) => updateDespesa({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DESPESAS_QUERY_KEY] });
    },
  });
}

// NOVO: Hook para DELETAR uma despesa
export function useDeleteDespesa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDespesa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DESPESAS_QUERY_KEY] });
    },
  });
}
