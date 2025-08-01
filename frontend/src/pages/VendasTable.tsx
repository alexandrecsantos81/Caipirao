// frontend/src/pages/VendasTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Importar Badge
import { Venda } from "@/services/movimentacoes.service";
import { CheckCircle2 } from "lucide-react"; // Importar ícone

interface VendasTableProps {
  vendas: Venda[];
  onEdit: (venda: Venda) => void;
  onDelete: (id: number) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';

export default function VendasTable({ vendas, onEdit, onDelete }: VendasTableProps) {
  return (
    <div className="rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data da Venda</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Status</TableHead> {/* NOVA COLUNA */}
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead className="text-center w-[180px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendas.map((venda) => (
            <TableRow key={venda.id} className={venda.data_pagamento ? 'bg-green-50/50 dark:bg-green-900/20' : ''}>
              <TableCell>{formatDate(venda.data_venda)}</TableCell>
              <TableCell>{venda.cliente_nome}</TableCell>
              <TableCell>{venda.produto_nome}</TableCell>
              {/* CÉLULA DE STATUS */}
              <TableCell>
                {venda.data_pagamento ? (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Pago
                  </Badge>
                ) : (
                  <Badge variant="destructive">Pendente</Badge>
                )}
              </TableCell>
              <TableCell className="text-right font-semibold text-green-600">
                {formatCurrency(venda.valor_total)}
              </TableCell>
              <TableCell className="text-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(venda)}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(venda.id)}
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
