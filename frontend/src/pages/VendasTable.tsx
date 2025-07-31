// /frontend/src/pages/VendasTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Venda } from "@/services/movimentacoes.service";

interface VendasTableProps {
  vendas: Venda[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

export default function VendasTable({ vendas }: VendasTableProps) {
  return (
    <div className="rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data da Venda</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendas.map((venda) => (
            <TableRow key={venda.id}>
              <TableCell>{formatDate(venda.data_venda)}</TableCell>
              <TableCell>{venda.cliente_nome}</TableCell>
              <TableCell>{venda.produto_nome}</TableCell>
              <TableCell className="text-right">{formatCurrency(venda.valor_total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
