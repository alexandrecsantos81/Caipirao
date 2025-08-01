// /frontend/src/hooks/useMovimentacoes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getMovimentacoes, 
  createMovimentacao, 
  updateMovimentacao, // Importado
  deleteMovimentacao, // Importado
  CreateMovimentacaoPayload,
  UpdateMovimentacaoPayload  // Importado
} from '../services/movimentacoes.service';

const MOVIMENTACOES_QUERY_KEY = 'movimentacoes';

export function useMovimentacoes() {
  return useQuery({
    queryKey: [MOVIMENTACOES_QUERY_KEY],
    queryFn: getMovimentacoes,
  });
}

export function useCreateMovimentacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMovimentacaoPayload) => createMovimentacao(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MOVIMENTACOES_QUERY_KEY] });
    },
  });
}

// NOVO: Hook para ATUALIZAR uma venda
export function useUpdateMovimentacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number, payload: UpdateMovimentacaoPayload }) => updateMovimentacao({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MOVIMENTACOES_QUERY_KEY] });
    },
  });
}

// NOVO: Hook para DELETAR uma venda
export function useDeleteMovimentacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteMovimentacao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MOVIMENTACOES_QUERY_KEY] });
    },
  });
}
