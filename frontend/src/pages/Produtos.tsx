// /frontend/src/pages/Produtos.tsx
import { useState } from 'react';
import { useProdutos, useCreateProduto } from "@/hooks/useProdutos";
import ProdutosTable from "./ProdutosTable";
import ProdutoForm from "./ProdutoForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerDescription } from "@/components/ui/drawer";
import { Terminal, PlusCircle } from "lucide-react";
import { toast } from "sonner";

export default function Produtos() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { data: produtos, isLoading, isError, error } = useProdutos();
  const createProdutoMutation = useCreateProduto();

  const handleSubmit = (values: any) => {
    createProdutoMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Produto criado com sucesso!");
        setIsDrawerOpen(false);
      },
      onError: (err: any) => {
        toast.error(`Erro ao criar produto: ${err.response?.data?.error || err.message}`);
      },
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }
    if (isError) {
      return (
        <Alert variant="destructive" className="mt-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar</AlertTitle>
          <AlertDescription>
            Não foi possível buscar os dados. Erro: {error.message}
          </AlertDescription>
        </Alert>
      );
    }
    if (produtos && produtos.length > 0) {
      return <ProdutosTable produtos={produtos} />;
    }
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg mt-6">
        <h3 className="text-lg font-medium">Nenhum produto encontrado.</h3>
        <p className="text-sm text-gray-500">Crie seu primeiro produto para começar.</p>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="mt-2 text-gray-600">Gerencie seus produtos, descrições e preços.</p>
        </div>
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="bg-popover text-popover-foreground">
              <DrawerHeader className="text-left">
                <DrawerTitle>Cadastrar Novo Produto</DrawerTitle>
                <DrawerDescription>
                  Preencha os detalhes abaixo para adicionar um novo produto.
                </DrawerDescription>
              </DrawerHeader>
              <ProdutoForm
                onSubmit={handleSubmit}
                isSubmitting={createProdutoMutation.isPending}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
      {renderContent()}
    </div>
  );
}
