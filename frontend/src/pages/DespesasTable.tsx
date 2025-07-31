// /frontend/src/pages/DespesasTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Despesa } from "@/services/despesas.service";

// CORREÇÃO: A interface agora espera um objeto com a propriedade 'despesas'
interface DespesasTableProps {
  despesas: Despesa[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';

export default function DespesasTable({ despesas }: DespesasTableProps) {
  return (
    <div className="rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Discriminação</TableHead>
            <TableHead>Data Pag.</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {despesas.map((despesa) => (
            <TableRow key={despesa.id}>
              <TableCell>{despesa.tipo_saida}</TableCell>
              <TableCell>{despesa.discriminacao || 'N/A'}</TableCell>
              <TableCell>{formatDate(despesa.data_pagamento)}</TableCell>
              <TableCell className="text-right">{formatCurrency(despesa.valor)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
