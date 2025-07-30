// Caminho do arquivo: /frontend/src/pages/Movimentacoes.tsx

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Componentes de UI
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import MovimentacoesTable from './MovimentacoesTable';
import MovimentacaoForm, { MovimentacaoSchema } from './MovimentacaoForm';

// Serviços e Tipos
// AQUI ESTÁ A IMPORTAÇÃO CORRIGIDA:
// Importamos tanto a função `createMovimentacao` quanto o tipo `CreateMovimentacaoPayload`.
import { createMovimentacao, CreateMovimentacaoPayload } from '@/services/movimentacoes.service';
import { useMovimentacoes } from '@/hooks/useMovimentacoes';

export function Movimentacoes() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: movimentacoes, isLoading, isError } = useMovimentacoes();

  const createMovimentacaoMutation = useMutation({
    mutationFn: createMovimentacao,
    onSuccess: () => {
      toast.success('Movimentação criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      setIsDrawerOpen(false);
    },
    onError: (error) => {
      console.error("Erro ao criar movimentação:", error);
      toast.error('Erro ao criar movimentação. Verifique os dados e tente novamente.');
    },
  });

  /**
   * Função chamada quando o formulário é submetido com dados válidos.
   * Recebe os dados do formulário (que podem ter campos como string)
   * e os converte para o formato que a API espera (CreateMovimentacaoPayload).
   */
  const handleSubmit = (data: MovimentacaoSchema) => {
    const payload: CreateMovimentacaoPayload = {
      ...data,
      produto_id: Number(data.produto_id),
      cliente_id: Number(data.cliente_id),
      quantidade: Number(data.quantidade),
      valor_unitario: Number(data.valor_unitario),
      observacao: data.observacao ? data.observacao : undefined,
    };
    createMovimentacaoMutation.mutate(payload);
  };


  if (isLoading) return <div className="p-6">Carregando movimentações...</div>;
  if (isError) return <div className="p-6 text-red-500">Erro ao carregar os dados das movimentações.</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Movimentações</h1>
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button>Nova Movimentação</Button>
          </DrawerTrigger>
          <DrawerContent className="bg-background">
            <DrawerHeader>
              <DrawerTitle>Criar Nova Movimentação</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <MovimentacaoForm 
                onSubmit={handleSubmit} 
                isSubmitting={createMovimentacaoMutation.isPending} 
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <MovimentacoesTable data={movimentacoes || []} />
    </div>
  );
}

// Adicione esta linha para fazer desta página uma exportação padrão, mantendo a consistência.
export default Movimentacoes;
