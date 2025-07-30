// /frontend/src/pages/MovimentacaoForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProdutos } from "@/hooks/useProdutos";
import { useClientes } from "@/hooks/useClientes";

/**
 * CORREÇÃO FINAL: A sintaxe do z.enum foi corrigida.
 * A validação de erro é tratada pelo Zod por padrão se o campo for obrigatório.
 */
export const formSchema = z.object({
  tipo: z.enum(['saida', 'entrada']), // Sintaxe correta, sem o segundo argumento de erro.
  produto_id: z.string().min(1, "Selecione um produto."),
  cliente_id: z.string().optional(),
  valor: z.string().min(1, "O valor é obrigatório.").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "O valor deve ser um número maior que zero.",
  }),
}).refine(data => !(data.tipo === 'saida' && !data.cliente_id), {
  message: "Cliente é obrigatório para saídas.",
  path: ["cliente_id"],
});

type MovimentacaoFormValues = z.infer<typeof formSchema>;

interface MovimentacaoFormProps {
    onSubmit: (values: MovimentacaoFormValues) => void;
    isSubmitting: boolean;
}

export default function MovimentacaoForm({ onSubmit, isSubmitting }: MovimentacaoFormProps) {
    const form = useForm<MovimentacaoFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { tipo: "saida", produto_id: "", cliente_id: "", valor: "" },
    });

    const { data: produtos } = useProdutos();
    const { data: clientes } = useClientes();
    const tipoMovimentacao = form.watch("tipo");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
                {/* Campo Tipo de Movimentação */}
                <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Movimentação</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="saida">Saída (Venda)</SelectItem>
                                    <SelectItem value="entrada">Entrada (Compra)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                {/* Campo Produto */}
                <FormField
                    control={form.control}
                    name="produto_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Produto</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um produto" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {produtos?.map((p: any) => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                                  ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Campo Cliente (Condicional) */}
                {tipoMovimentacao === 'saida' && (
                    <FormField
                        control={form.control}
                        name="cliente_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cliente</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um cliente" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {clientes?.map((c: any) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Campo Valor */}
                <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor (R$)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Salvando..." : "Salvar Movimentação"}
                </Button>
            </form>
        </Form>
    );
}
