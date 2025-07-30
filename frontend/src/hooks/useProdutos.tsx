// /frontend/src/hooks/useProdutos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProdutos, createProduto, CreateProdutoPayload } from '../services/produtos.service';

// Hook para BUSCAR a lista de produtos
export function useProdutos() {
  return useQuery({
    queryKey: ['produtos'], // Chave de cache para os dados de produtos
    queryFn: getProdutos,
  });
}

// Hook para CRIAR um novo produto
export function useCreateProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProdutoPayload) => createProduto(payload),
    onSuccess: () => {
      // Invalida a query 'produtos' para forçar a atualização da tabela.
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
}
