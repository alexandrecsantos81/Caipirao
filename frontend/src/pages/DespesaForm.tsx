// /frontend/src/pages/DespesaForm.tsx

import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// O schema de validação permanece o mesmo
export const formSchema = z.object({
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

// O tipo para os valores do formulário permanece o mesmo
export type DespesaFormValues = z.infer<typeof formSchema>;

// A interface de props foi ATUALIZADA para receber a instância do form
interface DespesaFormProps {
  onSubmit: (values: DespesaFormValues) => void;
  isSubmitting: boolean;
  formInstance: UseFormReturn<DespesaFormValues>;
}

export default function DespesaForm({ onSubmit, isSubmitting, formInstance: form }: DespesaFormProps) {
  // A criação do form foi removida daqui. Agora ele vem das props.
  // A função 'handleFormSubmit' também foi removida, pois a lógica de tratamento
  // de dados (converter para número, etc.) agora reside no componente pai (Movimentacoes.tsx).

  return (
    <Form {...form}>
      {/* O handleSubmit agora chama diretamente a função onSubmit recebida via props */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
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
