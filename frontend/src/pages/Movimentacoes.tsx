import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, PlusCircle } from 'lucide-react';

// Hooks e tipos
import { useMovimentacoes, useCreateMovimentacao, useUpdateMovimentacao, useDeleteMovimentacao } from '@/hooks/useMovimentacoes';
import { CreateMovimentacaoPayload, Venda } from '@/services/movimentacoes.service';
import VendaForm, { VendaFormValues, vendaFormSchema } from './VendaForm';
import VendasTable from './VendasTable';
import { useDespesas, useCreateDespesa, useUpdateDespesa, useDeleteDespesa } from '@/hooks/useDespesas';
import { Despesa, CreateDespesaPayload, UpdateDespesaPayload } from '@/services/despesas.service';
import DespesaForm, { DespesaFormValues, formSchema as despesaFormSchema } from './DespesaForm';
import DespesasTable from './DespesasTable';
import { useProdutos } from '@/hooks/useProdutos';

export default function Movimentacoes() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("vendas");
  
  const [vendaParaEditar, setVendaParaEditar] = useState<Venda | null>(null);
  const [despesaParaEditar, setDespesaParaEditar] = useState<Despesa | null>(null);

  const { data: vendas, isLoading: isLoadingVendas, isError: isErrorVendas, error: errorVendas } = useMovimentacoes();
  const { data: despesas, isLoading: isLoadingDespesas, isError: isErrorDespesas, error: errorDespesas } = useDespesas();
  const { data: produtos } = useProdutos();

  const createVendaMutation = useCreateMovimentacao();
  const updateVendaMutation = useUpdateMovimentacao();
  const deleteVendaMutation = useDeleteMovimentacao();

  const createDespesaMutation = useCreateDespesa();
  const updateDespesaMutation = useUpdateDespesa();
  const deleteDespesaMutation = useDeleteDespesa();

  const vendaForm = useForm<VendaFormValues>({ resolver: zodResolver(vendaFormSchema) });
  const despesaForm = useForm<DespesaFormValues>({ resolver: zodResolver(despesaFormSchema) });

  useEffect(() => {
    if (!isDrawerOpen) return;

    if (activeTab === 'vendas') {
      if (vendaParaEditar) {
        const produto = produtos?.find(p => p.nome === vendaParaEditar.produto_nome);
        vendaForm.reset({
          cliente_id: String(vendaParaEditar.cliente_id),
          produto_id: produto ? String(produto.id) : "",
          data_venda: vendaParaEditar.data_venda.split('T')[0],
          data_vencimento: vendaParaEditar.data_vencimento?.split('T')[0] || '',
          peso_produto: String(vendaParaEditar.peso || ''),
          preco_manual: String(vendaParaEditar.preco_manual || ''),
          valor_total: String(vendaParaEditar.valor_total || ''),
          data_pagamento: vendaParaEditar.data_pagamento?.split('T')[0] || '',
          responsavel_venda: vendaParaEditar.responsavel_venda || '',
        });
      } else {
        vendaForm.reset({
          cliente_id: "",
          produto_id: "",
          data_venda: new Date().toISOString().split('T')[0],
          data_vencimento: "",
          peso_produto: "",
          preco_manual: "",
          valor_total: "",
          data_pagamento: "",
          responsavel_venda: "",
        });
      }
    } else {
      if (despesaParaEditar) {
        despesaForm.reset({
          ...despesaParaEditar,
          valor: String(despesaParaEditar.valor),
          discriminacao: despesaParaEditar.discriminacao || '',
          nome_recebedor: despesaParaEditar.nome_recebedor || '',
          data_pagamento: despesaParaEditar.data_pagamento?.split('T')[0] || '',
          data_vencimento: despesaParaEditar.data_vencimento?.split('T')[0] || '',
          forma_pagamento: despesaParaEditar.forma_pagamento || '',
          responsavel_pagamento: despesaParaEditar.responsavel_pagamento || ''
        });
      } else {
        despesaForm.reset({ tipo_saida: '', valor: '', discriminacao: '', nome_recebedor: '', data_pagamento: '', data_vencimento: '', forma_pagamento: '', responsavel_pagamento: '' });
      }
    }
  }, [isDrawerOpen, vendaParaEditar, despesaParaEditar, activeTab, produtos, vendaForm, despesaForm]);

  const watchedProductId = vendaForm.watch("produto_id");
  const watchedPeso = vendaForm.watch("peso_produto");
  const watchedPrecoManual = vendaForm.watch("preco_manual");
  useEffect(() => {
    if (!vendaForm.formState.isDirty) return;
    const peso = parseFloat(watchedPeso || "0");
    if (!peso) { vendaForm.setValue("valor_total", ""); return; }
    const precoManual = parseFloat(watchedPrecoManual || "0");
    if (precoManual > 0) { vendaForm.setValue("valor_total", (peso * precoManual).toFixed(2)); return; }
    const produtoSelecionado = produtos?.find(p => String(p.id) === watchedProductId);
    if (produtoSelecionado) {
      const precoProduto = typeof produtoSelecionado.preco === 'number' ? produtoSelecionado.preco : parseFloat(produtoSelecionado.preco);
      if (!isNaN(precoProduto)) {
        vendaForm.setValue("valor_total", (peso * precoProduto).toFixed(2));
      }
    }
  }, [watchedProductId, watchedPeso, watchedPrecoManual, produtos, vendaForm]);

  const handleAddNew = () => {
    setVendaParaEditar(null);
    setDespesaParaEditar(null);
    setIsDrawerOpen(true);
  };

  const handleVendaEdit = (venda: Venda) => {
    setDespesaParaEditar(null);
    setVendaParaEditar(venda);
    setIsDrawerOpen(true);
  };

  const handleDespesaEdit = (despesa: Despesa) => {
    setVendaParaEditar(null);
    setDespesaParaEditar(despesa);
    setIsDrawerOpen(true);
  };

  const handleVendaSubmit = (values: VendaFormValues) => {
    const produtoSelecionado = produtos?.find(p => String(p.id) === values.produto_id);
    const payload: CreateMovimentacaoPayload = { 
        cliente_id: Number(values.cliente_id), 
        produto_nome: produtoSelecionado?.nome || 'Produto não encontrado', 
        data_venda: values.data_venda, 
        data_pagamento: values.data_pagamento || null, 
        data_vencimento: values.data_vencimento || null,
        peso_produto: values.peso_produto ? parseFloat(values.peso_produto) : null, 
        valor_total: parseFloat(values.valor_total), 
        preco_manual: values.preco_manual ? parseFloat(values.preco_manual) : null, 
        responsavel_venda: values.responsavel_venda || null 
    };
    const handleSuccess = (action: string) => { toast.success(`Venda ${action} com sucesso!`); setIsDrawerOpen(false); };
    const handleError = (action: string, err: any) => { toast.error(`Erro ao ${action} venda: ${err.response?.data?.error || err.message}`); };
    if (vendaParaEditar) {
      updateVendaMutation.mutate({ id: vendaParaEditar.id, payload }, { onSuccess: () => handleSuccess('atualizada'), onError: (err) => handleError('atualizar', err) });
    } else {
      createVendaMutation.mutate(payload, { onSuccess: () => handleSuccess('registrada'), onError: (err) => handleError('registrar', err) });
    }
  };

  const handleDespesaSubmit = (values: DespesaFormValues) => {
    // CORREÇÃO APLICADA AQUI: O payload é criado com o tipo correto.
    const payload: CreateDespesaPayload | UpdateDespesaPayload = {
        ...values,
        valor: parseFloat(values.valor),
        discriminacao: values.discriminacao || null,
        nome_recebedor: values.nome_recebedor || null,
        data_pagamento: values.data_pagamento || null,
        data_vencimento: values.data_vencimento || null,
        forma_pagamento: values.forma_pagamento || null,
        responsavel_pagamento: values.responsavel_pagamento || null
    };

    const handleSuccess = (action: string) => { toast.success(`Despesa ${action} com sucesso!`); setIsDrawerOpen(false); };
    const handleError = (action: string, err: any) => { toast.error(`Erro ao ${action} despesa: ${err.response?.data?.error || err.message}`); };

    if (despesaParaEditar) {
      // A chamada da mutação agora é simples e correta.
      updateDespesaMutation.mutate({ id: despesaParaEditar.id, payload }, { onSuccess: () => handleSuccess('atualizada'), onError: (err) => handleError('atualizar', err) });
    } else {
      // A chamada da mutação agora é simples e correta.
      createDespesaMutation.mutate(payload, { onSuccess: () => handleSuccess('criada'), onError: (err) => handleError('criar', err) });
    }
  };

  const handleVendaDelete = (id: number) => { if (window.confirm("Tem certeza?")) { deleteVendaMutation.mutate(id, { onSuccess: () => toast.success("Venda apagada!"), onError: (err: any) => toast.error(`Erro: ${err.response?.data?.error || err.message}`) }); } };
  const handleDespesaDelete = (id: number) => { if (window.confirm("Tem certeza?")) { deleteDespesaMutation.mutate(id, { onSuccess: () => toast.success("Despesa apagada!"), onError: (err: any) => toast.error(`Erro: ${err.response?.data?.error || err.message}`) }); } };

  const isEditing = !!vendaParaEditar || !!despesaParaEditar;

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Movimentações</h1>
            <p className="mt-2 text-gray-600">Registre e consulte as entradas e saídas do seu caixa.</p>
          </div>
          <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Nova Movimentação</Button>
        </div>

        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerContent>
            <div className="mx-auto w-full max-w-2xl p-4">
              <DrawerHeader>
                <DrawerTitle>{isEditing ? (activeTab === 'vendas' ? 'Editar Venda' : 'Editar Despesa') : (activeTab === 'vendas' ? 'Registrar Nova Venda' : 'Registrar Nova Despesa')}</DrawerTitle>
                <DrawerDescription>Preencha os campos abaixo para salvar o registro.</DrawerDescription>
              </DrawerHeader>
              <div className="p-4">
                {activeTab === 'vendas' ? (
                  <VendaForm formInstance={vendaForm} onSubmit={handleVendaSubmit} isSubmitting={createVendaMutation.isPending || updateVendaMutation.isPending} />
                ) : (
                  <DespesaForm formInstance={despesaForm} onSubmit={handleDespesaSubmit} isSubmitting={createDespesaMutation.isPending || updateDespesaMutation.isPending} />
                )}
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vendas">Entradas (Vendas)</TabsTrigger>
          <TabsTrigger value="despesas">Saídas (Despesas)</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas">
          {isLoadingVendas && <div className="mt-6 space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>}
          {isErrorVendas && <Alert variant="destructive" className="mt-6"><Terminal className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{errorVendas.message}</AlertDescription></Alert>}
          {vendas && <VendasTable vendas={vendas} onEdit={handleVendaEdit} onDelete={handleVendaDelete} />}
        </TabsContent>
        <TabsContent value="despesas">
          {isLoadingDespesas && <div className="mt-6 space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>}
          {isErrorDespesas && <Alert variant="destructive" className="mt-6"><Terminal className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{errorDespesas.message}</AlertDescription></Alert>}
          {despesas && <DespesasTable despesas={despesas} onEdit={handleDespesaEdit} onDelete={handleDespesaDelete} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
