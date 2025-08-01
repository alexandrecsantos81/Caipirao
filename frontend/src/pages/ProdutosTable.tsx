// /frontend/src/pages/ProdutosTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Importando o botão
import { Produto } from "@/services/produtos.service";

// Interface de props atualizada para incluir as funções de callback
interface ProdutosTableProps {
  produtos: Produto[];
  onEdit: (produto: Produto) => void;
  onDelete: (id: number) => void;
}

// Função para formatar o valor como moeda brasileira
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function ProdutosTable({ produtos, onEdit, onDelete }: ProdutosTableProps) {
  return (
    <div className="rounded-lg border shadow-sm mt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Preço</TableHead>
            {/* Nova coluna para as ações */}
            <TableHead className="text-right w-[180px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((produto) => (
            <TableRow key={produto.id}>
              <TableCell className="font-medium">{produto.nome}</TableCell>
              <TableCell>{produto.descricao || 'N/A'}</TableCell>
              <TableCell>{formatCurrency(produto.preco)}</TableCell>
              {/* Célula com os botões de ação */}
              <TableCell className="text-right space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEdit(produto)}
                >
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => onDelete(produto.id)}
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
