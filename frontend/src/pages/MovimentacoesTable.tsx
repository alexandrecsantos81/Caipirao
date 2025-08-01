// /frontend/src/pages/MovimentacoesTable.tsx

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Movimentacao } from "@/services/movimentacoes.service";
import { Badge } from "@/components/ui/badge";

interface MovimentacoesTableProps {
  data: Movimentacao[];
}

export default function MovimentacoesTable({ data }: MovimentacoesTableProps) {
  // Função para formatar a data no padrão brasileiro (dd/mm/aaaa)
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data inválida';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

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
          {data.map((mov) => (
            <TableRow key={mov.id}>
              <TableCell>
                {/* CORREÇÃO: A comparação agora usa 'entrada' (minúsculo) */}
                <Badge variant={mov.tipo === 'entrada' ? 'default' : 'destructive'}>
                  {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{mov.produto_nome}</TableCell>
              <TableCell>{mov.cliente_nome || 'N/A'}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(mov.valor)}
              </TableCell>
              <TableCell>
                {/* CORREÇÃO: Usa a função de formatação e o campo correto 'criado_em' */}
                {formatDate(mov.criado_em)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
