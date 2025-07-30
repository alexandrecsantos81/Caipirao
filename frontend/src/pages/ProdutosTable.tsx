// /frontend/src/pages/ProdutosTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Produto } from "@/services/produtos.service";

interface ProdutosTableProps {
  produtos: Produto[];
}

// Função para formatar o valor como moeda brasileira
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function ProdutosTable({ produtos }: ProdutosTableProps) {
  return (
    <div className="rounded-lg border shadow-sm mt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Preço</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((produto) => (
            <TableRow key={produto.id}>
              <TableCell className="font-medium">{produto.id}</TableCell>
              <TableCell>{produto.nome}</TableCell>
              <TableCell>{produto.descricao || 'N/A'}</TableCell>
              <TableCell className="text-right">{formatCurrency(produto.preco)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
