import * as React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Venda } from "@/services/movimentacoes.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const toISODateString = (date: Date) => date.toISOString().split('T')[0];
const today = toISODateString(new Date());

// Schema de validação com a nova regra de data
const formSchema = z.object({
  data_pagamento: z.string()
    .min(1, "A data de pagamento é obrigatória.")
    .refine(date => new Date(date) <= new Date(today), {
      message: "A data de pagamento não pode ser no futuro.",
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface QuickPaymentDialogProps {
  venda: Venda | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (vendaId: number, dataPagamento: string) => void;
  isSubmitting: boolean;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function QuickPaymentDialog({ venda, isOpen, onOpenChange, onConfirm, isSubmitting }: QuickPaymentDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_pagamento: today,
    },
  });

  const handleSubmit = (values: FormValues) => {
    if (venda) {
      onConfirm(venda.id, values.data_pagamento);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      form.reset({ data_pagamento: today });
    }
  }, [isOpen, form]);

  if (!venda) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Confirme a data de quitação para a venda do cliente <span className="font-bold">{venda.cliente_nome}</span> no valor de <span className="font-bold">{formatCurrency(venda.valor_total)}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="data_pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Pagamento</FormLabel>
                  <FormControl>
                    {/* Adicionado o atributo 'max' para bloquear datas futuras no navegador */}
                    <Input type="date" {...field} max={today} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Confirmar Pagamento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
