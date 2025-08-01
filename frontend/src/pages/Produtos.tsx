// frontend/src/pages/Produtos.tsx

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerDescription } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, PlusCircle } from "lucide-react";

// Hooks, tipos e componentes
import { useProdutos, useCreateProduto, useUpdateProduto, useDeleteProduto } from "@/hooks/useProdutos";
import { Produto, CreateProdutoPayload, UpdateProdutoPayload } from '@/services/produtos.service';
import ProdutosTable from "./ProdutosTable";
import ProdutoForm, { ProdutoFormValues } from "./ProdutoForm";

export default function Produtos() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<Produto | null>(null);

  // Hooks de dados e mutações
  const { data: produtos, isLoading, isError, error } = useProdutos();
  const createProdutoMutation = useCreateProduto();
  const updateProdutoMutation = useUpdateProduto();
  const deleteProdutoMutation = useDeleteProduto();

  // Instância do formulário
  const form = useForm<ProdutoFormValues>();

  // Função chamada ao submeter o formulário
  const handleSubmit = (values: ProdutoFormValues) => {
    // CORREÇÃO: Garante que a descrição seja 'null' se não for fornecida.
    const payload: CreateProdutoPayload | UpdateProdutoPayload = {
      nome: values.nome,
      preco: parseFloat(values.preco.replace(',', '.')),
      descricao: values.descricao || null,
    };

    const handleSuccess = (action: string) => {
      toast.success(`Produto ${action} com sucesso!`);
      setIsDrawerOpen(false);
      setProdutoParaEditar(null);
      form.reset();
    };

    const handleError = (action: string, err: any) => {
      toast.error(`Erro ao ${action} produto: ${err.response?.data?.error || err.message}`);
    };

    if (produtoParaEditar) {
      // Lógica de ATUALIZAÇÃO
      updateProdutoMutation.mutate({ id: produtoParaEditar.id, payload }, {
        onSuccess: () => handleSuccess('atualizado'),
        onError: (err) => handleError('atualizar', err),
      });
    } else {
      // Lógica de CRIAÇÃO
      createProdutoMutation.mutate(payload as CreateProdutoPayload, {
        onSuccess: () => handleSuccess('criado'),
        onError: (err) => handleError('criar', err),
      });
    }
  };

  // Função para abrir o formulário em modo de edição
  const handleEdit = (produto: Produto) => {
    setProdutoParaEditar(produto);
    form.reset({
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: String(produto.preco),
    });
    setIsDrawerOpen(true);
  };

  // Função para deletar um produto
  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja deletar este produto?")) {
      deleteProdutoMutation.mutate(id, {
        onSuccess: () => toast.success("Produto deletado com sucesso!"),
        onError: (err: any) => toast.error(`Erro ao deletar: ${err.response?.data?.error || err.message}`),
      });
    }
  };

  // Função para lidar com a abertura/fechamento do Drawer
  const handleDrawerOpenChange = (open: boolean) => {
    if (!open) {
      setProdutoParaEditar(null);
      form.reset({ nome: '', descricao: '', preco: '' });
    }
    setIsDrawerOpen(open);
  };

  // Função para renderizar o conteúdo principal (tabela, loading, erro)
  const renderContent = () => {
    if (isLoading) {
      return <div className="mt-6 space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>;
    }
    if (isError) {
      return <Alert variant="destructive" className="mt-6"><Terminal className="h-4 w-4" /><AlertTitle>Erro ao Carregar</AlertTitle><AlertDescription>Não foi possível buscar os dados. Erro: {error.message}</AlertDescription></Alert>;
    }
    if (produtos && produtos.length > 0) {
      return <ProdutosTable produtos={produtos} onEdit={handleEdit} onDelete={handleDelete} />;
    }
    return <div className="text-center py-10 border-2 border-dashed rounded-lg mt-6"><h3 className="text-lg font-medium">Nenhum produto encontrado.</h3><p className="text-sm text-gray-500">Crie seu primeiro produto para começar.</p></div>;
  };

  const isSubmitting = createProdutoMutation.isPending || updateProdutoMutation.isPending;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="mt-2 text-gray-600">Gerencie seus produtos, descrições e preços.</p>
        </div>
        <Drawer open={isDrawerOpen} onOpenChange={handleDrawerOpenChange}>
          <DrawerTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Novo Produto</Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-md p-4">
              <DrawerHeader className="text-left">
                <DrawerTitle>{produtoParaEditar ? 'Editar Produto' : 'Cadastrar Novo Produto'}</DrawerTitle>
                <DrawerDescription>
                  {produtoParaEditar ? 'Altere os detalhes abaixo para atualizar o produto.' : 'Preencha os detalhes abaixo para adicionar um novo produto.'}
                </DrawerDescription>
              </DrawerHeader>
              <ProdutoForm
                key={produtoParaEditar?.id || 'new'}
                formInstance={form}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
      {renderContent()}
    </div>
  );
}
