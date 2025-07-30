// /frontend/src/pages/Movimentacoes.tsx

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as z from 'zod';

// Componentes de UI
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import MovimentacoesTable from './MovimentacoesTable';
import MovimentacaoForm, { formSchema } from './MovimentacaoForm';

// Hooks e Serviços
import { useMovimentacoes } from '@/hooks/useMovimentacoes';
import { createMovimentacao, CreateMovimentacaoPayload } from '@/services/movimentacoes.service';

// Tipo gerado a partir do schema do formulário
type MovimentacaoFormData = z.infer<typeof formSchema>;

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
    onError: (error: any) => {
      console.error("Erro ao criar movimentação:", error);
      toast.error(error.response?.data?.error || 'Erro ao criar movimentação.');
    },
  });

  /**
   * CORREÇÃO: Esta função agora constrói o payload exatamente como a API espera.
   * Ela converte os valores de string do formulário para números.
   */
  const handleSubmit = (data: MovimentacaoFormData) => {
    const payload: CreateMovimentacaoPayload = {
      tipo: data.tipo,
      produto_id: Number(data.produto_id),
      valor: Number(data.valor),
    };

    // Adiciona o cliente_id apenas se ele existir (para movimentações de saída)
    if (data.cliente_id) {
      payload.cliente_id = Number(data.cliente_id);
    }

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

export default Movimentacoes;
