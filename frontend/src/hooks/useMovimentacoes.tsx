// frontend/src/hooks/useMovimentacoes.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMovimentacoes, createMovimentacao, CreateMovimentacaoPayload } from '../services/movimentacoes.service';

// Hook para BUSCAR todas as movimentações
export function useMovimentacoes() {
  return useQuery({
    queryKey: ['movimentacoes'],
    queryFn: getMovimentacoes,
  });
}

// Hook para CRIAR uma nova movimentação
export function useCreateMovimentacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMovimentacaoPayload) => createMovimentacao(payload),
    onSuccess: () => {
      // Invalida a query de movimentações para forçar a atualização da tabela
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
    },
  });
}
