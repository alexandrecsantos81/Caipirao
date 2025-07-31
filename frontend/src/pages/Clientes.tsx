// /frontend/src/pages/Clientes.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Importe seus componentes shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Defina a interface para o tipo Cliente com os novos campos
interface Cliente {
  id?: number;
  nome: string;
  contato: string;
  nome_responsavel?: string;
  telefone_whatsapp?: boolean;
  logradouro?: string;
  quadra?: string;
  lote?: string;
  bairro?: string;
  cep?: string;
  ponto_referencia?: string;
}

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formData, setFormData] = useState<Cliente>({
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
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Função para buscar os clientes da API
  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('caipirao-auth-token');
      const res = await axios.get('http://localhost:3000/api/clientes', {
        headers: { Authorization: `Bearer ${token}` },
      } );
      setClientes(res.data);
    } catch (error) {
      toast.error('Falha ao buscar clientes.');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, telefone_whatsapp: !!checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.contato) {
      return toast.warn("Preencha pelo menos o nome e o contato.");
    }

    const token = localStorage.getItem('caipirao-auth-token');
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    try {
      if (isEditing) {
        await axios.put(`http://localhost:3000/api/clientes/${formData.id}`, formData, config );
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await axios.post('http://localhost:3000/api/clientes', formData, config );
        toast.success("Cliente cadastrado com sucesso!");
      }
      resetForm();
      fetchClientes();
    } catch (error) {
      toast.error("Ocorreu um erro ao salvar o cliente.");
      console.error(error);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setFormData(cliente);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (window.confirm("Tem certeza que deseja deletar este cliente?")) {
      try {
        const token = localStorage.getItem('caipirao-auth-token');
        await axios.delete(`http://localhost:3000/api/clientes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        } );
        toast.success("Cliente deletado com sucesso!");
        fetchClientes();
      } catch (error) {
        toast.error("Falha ao deletar cliente.");
      }
    }
  };

  const resetForm = () => {
    setFormData({
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
    setIsEditing(false);
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Clientes</h1>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
        <DialogTrigger asChild>
          <Button onClick={() => setIsDialogOpen(true)}>Adicionar Novo Cliente</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">Nome</Label>
              <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome_responsavel" className="text-right">Responsável</Label>
              <Input id="nome_responsavel" name="nome_responsavel" value={formData.nome_responsavel} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contato" className="text-right">Telefone</Label>
              <Input id="contato" name="contato" value={formData.contato} onChange={handleChange} className="col-span-3" placeholder="(xx) xxxxx-xxxx" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefone_whatsapp" className="text-right">É WhatsApp?</Label>
              <Checkbox id="telefone_whatsapp" name="telefone_whatsapp" checked={formData.telefone_whatsapp} onCheckedChange={handleCheckboxChange} />
            </div>
            
            <hr className="col-span-full my-2" />
            <h3 className="col-span-full font-semibold">Endereço</h3>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logradouro" className="text-right">Logradouro</Label>
              <Input id="logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input name="quadra" placeholder="Quadra" value={formData.quadra} onChange={handleChange} />
                <Input name="lote" placeholder="Lote" value={formData.lote} onChange={handleChange} />
            </div>
            <Input name="bairro" placeholder="Bairro" value={formData.bairro} onChange={handleChange} />
            <Input name="cep" placeholder="CEP (Opcional)" value={formData.cep} onChange={handleChange} />
            <Input name="ponto_referencia" placeholder="Ponto de Referência (Opcional)" value={formData.ponto_referencia} onChange={handleChange} />

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mt-6 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Endereço Principal</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">{cliente.nome}</TableCell>
                <TableCell>
                  {cliente.contato}
                  {cliente.telefone_whatsapp && <span className="ml-2 text-xs text-green-600 font-semibold">(WhatsApp)</span>}
                </TableCell>
                <TableCell>
                  {`${cliente.logradouro || ''}, Qd. ${cliente.quadra || 'S/N'}, Lt. ${cliente.lote || 'S/N'} - ${cliente.bairro || 'Bairro não informado'}`}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(cliente)}>Editar</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(cliente.id)}>Deletar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Clientes;
