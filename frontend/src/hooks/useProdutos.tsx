// /frontend/src/hooks/useProdutos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProdutos, 
  createProduto, 
  updateProduto, // Importado
  deleteProduto, // Importado
  CreateProdutoPayload,
  UpdateProdutoPayload  // Importado
} from '../services/produtos.service';

const PRODUTOS_QUERY_KEY = 'produtos';

// Hook para BUSCAR a lista de produtos (sem alterações)
export function useProdutos() {
  return useQuery({
    queryKey: [PRODUTOS_QUERY_KEY],
    queryFn: getProdutos,
  });
}

// Hook para CRIAR um novo produto (sem alterações)
export function useCreateProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProdutoPayload) => createProduto(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUTOS_QUERY_KEY] });
    },
  });
}

// NOVO: Hook para ATUALIZAR um produto existente
export function useUpdateProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    // A função de mutação agora espera um objeto contendo o ID e o payload
    mutationFn: ({ id, payload }: { id: number, payload: UpdateProdutoPayload }) => updateProduto({ id, payload }),
    onSuccess: () => {
      // Invalida a query de produtos para atualizar a UI
      queryClient.invalidateQueries({ queryKey: [PRODUTOS_QUERY_KEY] });
    },
  });
}

// NOVO: Hook para DELETAR um produto
export function useDeleteProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProduto(id),
    onSuccess: () => {
      // Invalida a query de produtos para atualizar a UI
      queryClient.invalidateQueries({ queryKey: [PRODUTOS_QUERY_KEY] });
    },
  });
}
