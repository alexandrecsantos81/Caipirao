// frontend/src/pages/MovimentacoesTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Movimentacao } from "@/services/movimentacoes.service";
import { Badge } from "@/components/ui/badge";

interface MovimentacoesTableProps {
  movimentacoes: Movimentacao[];
}

export default function MovimentacoesTable({ movimentacoes }: MovimentacoesTableProps) {
  return (
    <div className="rounded-lg border shadow-sm mt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimentacoes.map((mov) => (
            <TableRow key={mov.id}>
              <TableCell>
                <Badge variant={mov.tipo === 'entrada' ? 'default' : 'destructive'}>
                  {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{mov.produto_nome}</TableCell>
              <TableCell>{mov.cliente_nome || 'N/A'}</TableCell>
              <TableCell className="text-right">
                {mov.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
              <TableCell>
                {mov.criado_em ? new Date(mov.criado_em).toLocaleDateString('pt-BR') : 'Data inválida'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
