// /frontend/src/pages/Movimentacoes.tsx

import { useState } from 'react';
import { toast } from 'sonner'; // Usando 'sonner' como no seu código original
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Assumindo que estes hooks e tipos existem. Se não, precisaremos criá-los.
import { useMovimentacoes, useCreateMovimentacao } from '@/hooks/useMovimentacoes';
import { useDespesas, useCreateDespesa } from '@/hooks/useDespesas';
import { CreateMovimentacaoPayload } from '@/services/movimentacoes.service';
import { CreateDespesaPayload } from '@/services/despesas.service';

// Assumindo que estes componentes de formulário e tabela existem.
import VendaForm from './VendaForm';
import VendasTable from './VendasTable';
import DespesaForm from './DespesaForm';
import DespesasTable from './DespesasTable';

export default function Movimentacoes() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("vendas");

  // A lógica de busca de dados
  const { data: vendas, isLoading: isLoadingVendas } = useMovimentacoes();
  const { data: despesas, isLoading: isLoadingDespesas } = useDespesas();

  // A lógica para criar novos registros
  const createVendaMutation = useCreateMovimentacao();
  const createDespesaMutation = useCreateDespesa();

  const handleVendaSubmit = (data: CreateMovimentacaoPayload) => {
    createVendaMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Venda registrada com sucesso!');
        setIsDrawerOpen(false);
      },
      onError: (error: any) => {
        toast.error(`Erro ao registrar venda: ${error.response?.data?.error || 'Erro de conexão'}`);
      },
    });
  };

  const handleDespesaSubmit = (data: CreateDespesaPayload) => {
    createDespesaMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Despesa registrada com sucesso!');
        setIsDrawerOpen(false);
      },
      onError: (error: any) => {
        toast.error(`Erro ao registrar despesa: ${error.response?.data?.error || 'Erro de conexão'}`);
      },
    });
  };

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="vendas">Entradas (Vendas)</TabsTrigger>
            <TabsTrigger value="despesas">Saídas (Despesas)</TabsTrigger>
          </TabsList>
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button>Nova Movimentação</Button>
            </DrawerTrigger>
            <DrawerContent className="bg-background">
              <DrawerHeader>
                <DrawerTitle>
                  {activeTab === 'vendas' ? 'Registrar Nova Venda' : 'Registrar Nova Despesa'}
                </DrawerTitle>
              </DrawerHeader>
              <div className="p-4">
                {activeTab === 'vendas' ? (
                  <VendaForm
                    onSubmit={handleVendaSubmit}
                    isSubmitting={createVendaMutation.isPending}
                  />
                ) : (
                  <DespesaForm
                    onSubmit={handleDespesaSubmit}
                    isSubmitting={createDespesaMutation.isPending}
                  />
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
        <TabsContent value="vendas">
          {isLoadingVendas ? <p>Carregando vendas...</p> : <VendasTable vendas={vendas || []} />}
        </TabsContent>
        <TabsContent value="despesas">
          {isLoadingDespesas ? <p>Carregando despesas...</p> : <DespesasTable despesas={despesas || []} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
