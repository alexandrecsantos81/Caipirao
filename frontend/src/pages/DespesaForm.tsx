// /frontend/src/pages/DespesaForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateDespesaPayload } from "@/services/despesas.service";

/**
 * CORREÇÃO: Voltamos a um schema simples, sem '.transform()'.
 * O formulário irá lidar com strings e undefined, que é o padrão do react-hook-form.
 */
const formSchema = z.object({
  tipo_saida: z.string().min(1, "O tipo de saída é obrigatório."),
  valor: z.string().min(1, "O valor é obrigatório.").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "O valor deve ser um número positivo.",
  }),
  discriminacao: z.string().optional(),
  nome_recebedor: z.string().optional(),
  data_pagamento: z.string().optional(),
  data_vencimento: z.string().optional(),
  forma_pagamento: z.string().optional(),
  responsavel_pagamento: z.string().optional(),
});

// Este tipo agora representa os dados brutos do formulário (com undefined)
type DespesaFormValues = z.infer<typeof formSchema>;

interface DespesaFormProps {
  onSubmit: (values: CreateDespesaPayload) => void;
  isSubmitting: boolean;
}

export default function DespesaForm({ onSubmit, isSubmitting }: DespesaFormProps) {
  // O useForm agora usa o tipo simples DespesaFormValues, sem conflitos.
  const form = useForm<DespesaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_saida: "",
      valor: "",
      discriminacao: "",
      nome_recebedor: "",
      data_pagamento: "",
      data_vencimento: "",
      forma_pagamento: "",
      responsavel_pagamento: "",
    },
  });

  /**
   * CORREÇÃO: A conversão de 'undefined' para 'null' acontece aqui,
   * no momento da submissão, antes de chamar a função 'onSubmit' externa.
   */
  function handleFormSubmit(values: DespesaFormValues) {
    const payload: CreateDespesaPayload = {
      tipo_saida: values.tipo_saida,
      valor: parseFloat(values.valor),
      discriminacao: values.discriminacao || null,
      nome_recebedor: values.nome_recebedor || null,
      data_pagamento: values.data_pagamento || null,
      data_vencimento: values.data_vencimento || null,
      forma_pagamento: values.forma_pagamento || null,
      responsavel_pagamento: values.responsavel_pagamento || null,
    };
    onSubmit(payload);
  }

  return (
    <Form {...form}>
      {/* O 'handleSubmit' do react-hook-form chama a nossa função 'handleFormSubmit' */}
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="tipo_saida" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Saída (Ex: Salário, Insumos)</FormLabel>
              <FormControl><Input placeholder="Tipo da despesa" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="valor" render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="discriminacao" render={({ field }) => (
          <FormItem>
            <FormLabel>Discriminação (Detalhes)</FormLabel>
            <FormControl><Textarea placeholder="Detalhes da despesa..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="data_pagamento" render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Pagamento</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="data_vencimento" render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Vencimento</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField control={form.control} name="nome_recebedor" render={({ field }) => (
            <FormItem>
              <FormLabel>Nome de Quem Recebe</FormLabel>
              <FormControl><Input placeholder="Nome do recebedor" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
           <FormField control={form.control} name="responsavel_pagamento" render={({ field }) => (
            <FormItem>
              <FormLabel>Responsável pelo Pagamento</FormLabel>
              <FormControl><Input placeholder="Nome do responsável" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full !mt-6">
          {isSubmitting ? "Salvando..." : "Salvar Despesa"}
        </Button>
      </form>
    </Form>
  );
}
