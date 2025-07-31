// /frontend/src/pages/VendaForm.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientes } from "@/hooks/useClientes";
import { useProdutos } from "@/hooks/useProdutos";
import { CreateMovimentacaoPayload } from "@/services/movimentacoes.service";

// Schema de validação para o novo formulário de Venda
const formSchema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente."),
  produto_id: z.string().min(1, "Selecione um produto."),
  data_venda: z.string().min(1, "A data da venda é obrigatória."),
  peso_produto: z.string().optional(),
  preco_manual: z.string().optional(),
  valor_total: z.string().min(1, "O valor total é obrigatório e deve ser maior que zero."),
  data_pagamento: z.string().optional(),
  responsavel_venda: z.string().optional(),
});

type VendaFormValues = z.infer<typeof formSchema>;

interface VendaFormProps {
  onSubmit: (values: CreateMovimentacaoPayload) => void;
  isSubmitting: boolean;
}

export default function VendaForm({ onSubmit, isSubmitting }: VendaFormProps) {
  const { data: clientes } = useClientes();
  const { data: produtos } = useProdutos();

  const form = useForm<VendaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente_id: "",
      produto_id: "",
      data_venda: new Date().toISOString().split('T')[0], // Data de hoje por padrão
      peso_produto: "",
      preco_manual: "",
      valor_total: "",
      data_pagamento: "",
      responsavel_venda: "",
    },
  });

  // Lógica para cálculo automático do valor
  const watchedProductId = form.watch("produto_id");
  const watchedPeso = form.watch("peso_produto");
  const watchedPrecoManual = form.watch("preco_manual");

  useEffect(() => {
    const peso = parseFloat(watchedPeso || "0");
    if (!watchedProductId || !peso) {
      form.setValue("valor_total", ""); // Limpa o valor se não houver produto ou peso
      return;
    }

    // Usa o preço manual se ele existir, senão busca o preço do produto
    const precoManual = parseFloat(watchedPrecoManual || "0");
    if (precoManual > 0) {
      form.setValue("valor_total", (peso * precoManual).toFixed(2));
      return;
    }

    const produtoSelecionado = produtos?.find(p => String(p.id) === watchedProductId);
    if (produtoSelecionado) {
      const valorCalculado = peso * produtoSelecionado.preco;
      form.setValue("valor_total", valorCalculado.toFixed(2));
    }
  }, [watchedProductId, watchedPeso, watchedPrecoManual, produtos, form]);


  function handleFormSubmit(values: VendaFormValues) {
    const produtoSelecionado = produtos?.find(p => String(p.id) === values.produto_id);

    const payload: CreateMovimentacaoPayload = {
      cliente_id: Number(values.cliente_id),
      produto_nome: produtoSelecionado?.nome || 'Produto não encontrado',
      data_venda: values.data_venda,
      data_pagamento: values.data_pagamento || null,
      peso_produto: values.peso_produto ? parseFloat(values.peso_produto) : null,
      valor_total: parseFloat(values.valor_total),
      preco_manual: values.preco_manual ? parseFloat(values.preco_manual) : null,
      responsavel_venda: values.responsavel_venda || null,
    };
    onSubmit(payload);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="cliente_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger></FormControl>
                <SelectContent>{clientes?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="produto_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Produto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger></FormControl>
                <SelectContent>{produtos?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nome} (R$ {p.preco}/kg)</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="peso_produto" render={({ field }) => (
            <FormItem>
              <FormLabel>Peso do Produto (kg)</FormLabel>
              <FormControl><Input type="number" step="0.001" placeholder="Ex: 1.500" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="preco_manual" render={({ field }) => (
            <FormItem>
              <FormLabel>Preço Manual por Kg (Opcional)</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="Deixe em branco para usar o padrão" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="valor_total" render={({ field }) => (
          <FormItem>
            <FormLabel>Valor Total da Venda (R$)</FormLabel>
            <FormControl><Input type="number" step="0.01" placeholder="Calculado automaticamente" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="data_venda" render={({ field }) => (
            <FormItem>
              <FormLabel>Data da Venda</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="data_pagamento" render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Pagamento (Opcional)</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="responsavel_venda" render={({ field }) => (
          <FormItem>
            <FormLabel>Responsável pela Venda (Opcional)</FormLabel>
            <FormControl><Input placeholder="Nome do vendedor" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={isSubmitting} className="w-full !mt-6">
          {isSubmitting ? "Salvando Venda..." : "Salvar Venda"}
        </Button>
      </form>
    </Form>
  );
}
