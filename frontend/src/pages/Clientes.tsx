// /frontend/src/pages/Clientes.tsx

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import InputMask from 'react-input-mask';
import { toast } from 'sonner';

import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente } from '@/hooks/useClientes';
import { Cliente, CreateClientePayload, UpdateClientePayload } from '@/services/clientes.service';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlusCircle, Terminal } from 'lucide-react';

// CORREÇÃO APLICADA AQUI
const formSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  contato: z.string().refine(val => {
    const cleaned = val.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    return cleaned.length === 10 || cleaned.length === 11; // Aceita 10 (fixo) ou 11 (celular) dígitos
  }, {
    message: "O telefone deve ter 10 ou 11 dígitos.", // Mensagem de erro mais clara
  }),
  nome_responsavel: z.string().optional(),
  telefone_whatsapp: z.boolean().default(false),
  logradouro: z.string().optional(),
  quadra: z.string().optional(),
  lote: z.string().optional(),
  bairro: z.string().optional(),
  cep: z.string().optional().refine(val => !val || val.replace(/\D/g, '').length === 8, {
    message: "O CEP, se preenchido, deve ter 8 dígitos.",
  }),
  ponto_referencia: z.string().optional(),
});

type ClienteFormValues = z.infer<typeof formSchema>;

const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return 'N/A';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
  return phone;
};

export default function Clientes() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);

  const { data: clientes, isLoading, isError, error } = useClientes();
  const createClienteMutation = useCreateCliente();
  const updateClienteMutation = useUpdateCliente();
  const deleteClienteMutation = useDeleteCliente();

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      contato: '',
      nome_responsavel: '',
      telefone_whatsapp: false,
      logradouro: '',
      quadra: '',
      lote: '',
      bairro: '',
      cep: '',
      ponto_referencia: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = (data: ClienteFormValues) => {
    const payload = {
        nome: data.nome,
        contato: data.contato.replace(/\D/g, ''),
        nome_responsavel: data.nome_responsavel,
        telefone_whatsapp: data.telefone_whatsapp,
        logradouro: data.logradouro,
        quadra: data.quadra,
        lote: data.lote,
        bairro: data.bairro,
        cep: data.cep?.replace(/\D/g, ''),
        ponto_referencia: data.ponto_referencia,
    };

    const handleSuccess = (action: string) => {
      toast.success(`Cliente ${action} com sucesso!`);
      setIsDrawerOpen(false);
    };

    const handleError = (action: string, err: any) => {
      toast.error(`Erro ao ${action} cliente: ${err.response?.data?.error || err.message}`);
    };

    if (clienteParaEditar) {
      updateClienteMutation.mutate({ id: clienteParaEditar.id, payload }, {
        onSuccess: () => handleSuccess('atualizado'),
        onError: (err) => handleError('atualizar', err),
      });
    } else {
      createClienteMutation.mutate(payload as CreateClientePayload, {
        onSuccess: () => handleSuccess('criado'),
        onError: (err) => handleError('criar', err),
      });
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setClienteParaEditar(cliente);
    form.reset({
        ...cliente,
        nome_responsavel: cliente.nome_responsavel || '',
        logradouro: cliente.logradouro || '',
        quadra: cliente.quadra || '',
        lote: cliente.lote || '',
        bairro: cliente.bairro || '',
        cep: cliente.cep || '',
        ponto_referencia: cliente.ponto_referencia || '',
    });
    setIsDrawerOpen(true);
  };

  const handleAddNew = () => {
    setClienteParaEditar(null);
    form.reset({
        nome: '',
        contato: '',
        nome_responsavel: '',
        telefone_whatsapp: false,
        logradouro: '',
        quadra: '',
        lote: '',
        bairro: '',
        cep: '',
        ponto_referencia: '',
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    if (window.confirm("Tem certeza que deseja deletar este cliente?")) {
        deleteClienteMutation.mutate(id, {
            onSuccess: () => toast.success("Cliente deletado com sucesso!"),
            onError: (err: any) => toast.error(`Erro ao deletar: ${err.response?.data?.error || err.message}`),
        });
    }
  };

  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open);
    if (!open) {
      setClienteParaEditar(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
        return <div className="mt-6 space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>;
    }
    if (isError) {
        return <Alert variant="destructive" className="mt-6"><Terminal className="h-4 w-4" /><AlertTitle>Erro ao Carregar</AlertTitle><AlertDescription>Não foi possível buscar os dados. Erro: {error.message}</AlertDescription></Alert>;
    }
    return (
        <div className="mt-6 rounded-md border">
            <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Contato</TableHead><TableHead>Endereço Principal</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                    {clientes?.map((cliente) => (
                        <TableRow key={cliente.id}>
                            <TableCell className="font-medium">{cliente.nome}</TableCell>
                            <TableCell>{formatPhone(cliente.contato)}{cliente.telefone_whatsapp && <span className="ml-2 text-xs text-green-600 font-semibold">(WhatsApp)</span>}</TableCell>
                            <TableCell>{`${cliente.logradouro || ''}, Qd. ${cliente.quadra || 'S/N'}, Lt. ${cliente.lote || 'S/N'} - ${cliente.bairro || 'Bairro não informado'}`}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(cliente)}>Editar</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(cliente.id)}>Deletar</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="mt-2 text-gray-600">Adicione, edite e gerencie seus clientes.</p>
        </div>
        <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Novo Cliente</Button>
      </div>

      {renderContent()}

      <Drawer open={isDrawerOpen} onOpenChange={handleDrawerOpenChange}>
        <DrawerContent>
          <div className="mx-auto w-full p-4">
            <DrawerHeader>
              <DrawerTitle>{clienteParaEditar ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</DrawerTitle>
              <DrawerDescription>Preencha os campos abaixo para salvar as informações do cliente.</DrawerDescription>
            </DrawerHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <FormField control={form.control} name="nome" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome completo do cliente" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="nome_responsavel" render={({ field }) => (<FormItem><FormLabel>Responsável (Opcional)</FormLabel><FormControl><Input placeholder="Nome do responsável" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="contato" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><InputMask mask="(99) 99999-9999" value={field.value} onChange={field.onChange} onBlur={field.onBlur}>{(inputProps: any) => <Input {...inputProps} placeholder="(xx) xxxxx-xxxx" />}</InputMask></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="telefone_whatsapp" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2 pb-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 font-normal">É WhatsApp?</FormLabel></FormItem>)} />
                </div>
                <h3 className="font-semibold text-lg border-t pt-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField control={form.control} name="logradouro" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Logradouro</FormLabel><FormControl><Input placeholder="Rua, Avenida, etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="quadra" render={({ field }) => (<FormItem><FormLabel>Quadra</FormLabel><FormControl><Input placeholder="Qd. 123" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="lote" render={({ field }) => (<FormItem><FormLabel>Lote</FormLabel><FormControl><Input placeholder="Lt. 45" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="bairro" render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Nome do bairro" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="cep" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><InputMask mask="99999-999" value={field.value} onChange={field.onChange} onBlur={field.onBlur}>{(inputProps: any) => <Input {...inputProps} placeholder="_____-___" />}</InputMask></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="ponto_referencia" render={({ field }) => (<FormItem><FormLabel>Ponto de Referência</FormLabel><FormControl><Input placeholder="Próximo a..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <DrawerFooter className="flex-row gap-2 px-0 pt-6">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">Salvar Cliente</Button>
                  <DrawerClose asChild><Button type="button" variant="outline" className="flex-1">Cancelar</Button></DrawerClose>
                </DrawerFooter>
              </form>
            </Form>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
