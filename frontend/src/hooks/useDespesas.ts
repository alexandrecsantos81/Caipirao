// /frontend/src/hooks/useDespesas.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDespesas, createDespesa, CreateDespesaPayload } from '../services/despesas.service';

// Hook para BUSCAR a lista de todas as despesas
export function useDespesas() {
  return useQuery({
    queryKey: ['despesas'],
    queryFn: getDespesas,
  });
}

// Hook para CRIAR uma nova despesa
export function useCreateDespesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDespesaPayload) => createDespesa(payload),
    // Após o sucesso, invalida a query 'despesas' para forçar a atualização da lista.
    // Os callbacks específicos (toast, etc.) serão tratados no componente que chama a mutação.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
    },
  });
}
