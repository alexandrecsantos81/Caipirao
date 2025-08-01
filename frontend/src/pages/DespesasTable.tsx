// /frontend/src/pages/DespesasTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Importando o componente Button
import { Despesa } from "@/services/despesas.service";

// A interface de props agora inclui as funções de callback para as ações
interface DespesasTableProps {
  despesas: Despesa[];
  onEdit: (despesa: Despesa) => void;
  onDelete: (id: number) => void;
}

// Funções de formatação (sem alteração)
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export default function DespesasTable({ despesas, onEdit, onDelete }: DespesasTableProps) {
  return (
    <div className="rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Discriminação</TableHead>
            <TableHead>Data Pag.</TableHead>
            <TableHead>Valor</TableHead>
            {/* NOVA COLUNA DE AÇÕES */}
            <TableHead className="text-right w-[180px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {despesas.map((despesa) => (
            <TableRow key={despesa.id}>
              <TableCell className="font-medium">{despesa.tipo_saida}</TableCell>
              <TableCell>{despesa.discriminacao || 'Não informado'}</TableCell>
              <TableCell>{formatDate(despesa.data_pagamento)}</TableCell>
              <TableCell className="font-semibold text-red-600">
                {formatCurrency(despesa.valor)}
              </TableCell>
              {/* CÉLULA COM OS BOTÕES DE AÇÃO */}
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(despesa)}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(despesa.id)}
                >
                  Deletar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
