// frontend/src/pages/ProdutoForm.tsx

import { UseFormReturn } from "react-hook-form"; // Importa apenas o tipo necessário
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Schema de validação com Zod
const formSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  descricao: z.string().optional(),
  preco: z.string()
    .min(1, { message: "O preço é obrigatório." })
    .refine(value => !isNaN(parseFloat(value.replace(',', '.'))) && parseFloat(value.replace(',', '.')) > 0, {
      message: "O preço deve ser um número maior que zero.",
    }),
});

export type ProdutoFormValues = z.infer<typeof formSchema>;

interface ProdutoFormProps {
  onSubmit: (values: ProdutoFormValues) => void;
  isSubmitting: boolean;
  formInstance: UseFormReturn<ProdutoFormValues>; // Recebe a instância do form
}

export default function ProdutoForm({ onSubmit, isSubmitting, formInstance: form }: ProdutoFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Produto</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Frango Assado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes do produto (opcional)" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="preco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Salvando..." : "Salvar Produto"}
        </Button>
      </form>
    </Form>
  );
}
