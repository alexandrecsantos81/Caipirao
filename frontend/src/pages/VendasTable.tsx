// /frontend/src/pages/VendasTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Venda } from "@/services/movimentacoes.service";

interface VendasTableProps {
  vendas: Venda[];
  onEdit: (venda: Venda) => void;
  onDelete: (id: number) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

export default function VendasTable({ vendas, onEdit, onDelete }: VendasTableProps) {
  return (
    <div className="rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data da Venda</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead className="text-right w-[180px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendas.map((venda) => (
            <TableRow key={venda.id}>
              <TableCell>{formatDate(venda.data_venda)}</TableCell>
              <TableCell>{venda.cliente_nome}</TableCell>
              <TableCell>{venda.produto_nome}</TableCell>
              <TableCell className="font-semibold text-green-600">
                {formatCurrency(venda.valor_total)}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(venda)}
                  // A propriedade 'disabled' foi removida
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
