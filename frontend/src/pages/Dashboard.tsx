import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMovimentacoes, useUpdateMovimentacao } from "@/hooks/useMovimentacoes";
import { useDespesas } from "@/hooks/useDespesas";
import { Venda } from '@/services/movimentacoes.service';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Package, AlertCircle, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import QuickPaymentDialog from './QuickPaymentDialog';

// --- Tipos e Funções Auxiliares ---
// CORREÇÃO: Definição dos tipos que estavam faltando.
type PeriodoFoco = { label: string; entradas: number; saidas: number; saldo: number };
type PeriodoGrafico = '6M' | 'ANO' | '5A';
type FiltroMovimentacoesData = 'hoje' | 'mes' | 'personalizado';
type FiltroMovimentacoesTipo = 'todos' | 'Entrada' | 'Saída';

interface Vencimento {
  cliente_nome: string;
  valor_total: number;
  dias_para_vencer: number;
  data_vencimento: string;
  venda: Venda;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(value);
const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';
const toISODateString = (date: Date) => date.toISOString().split('T')[0];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: vendas, isLoading: isLoadingVendas, isError: isErrorVendas } = useMovimentacoes();
  const { data: despesas, isLoading: isLoadingDespesas, isError: isErrorDespesas } = useDespesas();
  const updateVendaMutation = useUpdateMovimentacao();

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [vendaParaQuitar, setVendaParaQuitar] = useState<Venda | null>(null);
  
  const [periodoGrafico, setPeriodoGrafico] = useState<PeriodoGrafico>('6M');
  const [periodoEmFoco, setPeriodoEmFoco] = useState<PeriodoFoco | null>(null);
  const [filtroData, setFiltroData] = useState<FiltroMovimentacoesData>('hoje');
  const [filtroTipo, setFiltroTipo] = useState<FiltroMovimentacoesTipo>('todos');
  const [dataInicio, setDataInicio] = useState(toISODateString(new Date()));
  const [dataFim, setDataFim] = useState(toISODateString(new Date()));

  const { kpis, dadosGraficoPrincipal, movimentacoesFiltradas, totalMovimentacoes, dadosGraficoProdutos, tituloGraficoProdutos, proximosVencimentos } = useMemo(() => {
    if (!vendas || !despesas) {
      return { kpis: { label: 'Mês Atual', entradas: 0, saidas: 0, saldo: 0 }, dadosGraficoPrincipal: [], movimentacoesFiltradas: [], totalMovimentacoes: 0, dadosGraficoProdutos: [], tituloGraficoProdutos: 'Análise de Produtos', proximosVencimentos: [] };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const entradasMesAtual = vendas.filter(v => v.data_venda && new Date(v.data_venda).getFullYear() === currentYear && new Date(v.data_venda).getMonth() === currentMonth).reduce((acc, v) => acc + (Number(v.valor_total) || 0), 0);
    const saidasMesAtual = despesas.filter(d => d.data_pagamento && new Date(d.data_pagamento).getFullYear() === currentYear && new Date(d.data_pagamento).getMonth() === currentMonth).reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
    const kpis = { label: 'Mês Atual', entradas: entradasMesAtual, saidas: saidasMesAtual, saldo: entradasMesAtual - saidasMesAtual };

    const dataMap = new Map<string, { Entradas: number, Saídas: number }>();
    let tituloGraficoProdutos = 'Análise de Produtos';

    if (periodoGrafico === '6M') {
      tituloGraficoProdutos += ' (Últimos 6 Meses)';
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const name = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('. de', '');
        dataMap.set(name, { Entradas: 0, Saídas: 0 });
      }
      vendas.forEach(v => { if (v.data_venda) { const name = new Date(v.data_venda).toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('. de', ''); if (dataMap.has(name)) dataMap.get(name)!.Entradas += Number(v.valor_total) || 0; } });
      despesas.forEach(d => { if (d.data_pagamento) { const name = new Date(d.data_pagamento).toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('. de', ''); if (dataMap.has(name)) dataMap.get(name)!.Saídas += Number(d.valor) || 0; } });
    } else if (periodoGrafico === 'ANO') {
      tituloGraficoProdutos += ' (Este Ano)';
      for (let i = 0; i < 12; i++) { const name = new Date(currentYear, i, 1).toLocaleString('pt-BR', { month: 'long' }); dataMap.set(name, { Entradas: 0, Saídas: 0 }); }
      vendas.filter(v => v.data_venda && new Date(v.data_venda).getFullYear() === currentYear).forEach(v => { const name = new Date(v.data_venda!).toLocaleString('pt-BR', { month: 'long' }); if (dataMap.has(name)) dataMap.get(name)!.Entradas += Number(v.valor_total) || 0; });
      despesas.filter(d => d.data_pagamento && new Date(d.data_pagamento).getFullYear() === currentYear).forEach(d => { const name = new Date(d.data_pagamento!).toLocaleString('pt-BR', { month: 'long' }); if (dataMap.has(name)) dataMap.get(name)!.Saídas += Number(d.valor) || 0; });
    } else if (periodoGrafico === '5A') {
      tituloGraficoProdutos += ' (Anual)';
      for (let i = 4; i >= 0; i--) { const name = String(currentYear - i); dataMap.set(name, { Entradas: 0, Saídas: 0 }); }
      vendas.forEach(v => { if (v.data_venda) { const name = String(new Date(v.data_venda).getFullYear()); if (dataMap.has(name)) dataMap.get(name)!.Entradas += Number(v.valor_total) || 0; } });
      despesas.forEach(d => { if (d.data_pagamento) { const name = String(new Date(d.data_pagamento).getFullYear()); if (dataMap.has(name)) dataMap.get(name)!.Saídas += Number(d.valor) || 0; } });
    }
    const dadosGraficoPrincipal = Array.from(dataMap.entries()).map(([name, values]) => ({ name, ...values }));

    const vendasFiltradasGrafico = vendas.filter(v => {
        if (!v.data_venda) return false;
        const vendaDate = new Date(v.data_venda);
        if (periodoGrafico === '6M') {
            const seisMesesAtras = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            return vendaDate >= seisMesesAtras;
        }
        if (periodoGrafico === 'ANO') return vendaDate.getFullYear() === currentYear;
        if (periodoGrafico === '5A') return vendaDate.getFullYear() >= (currentYear - 4);
        return true;
    });

    const produtosMap = new Map<string, { Faturamento: number, Peso: number }>();
    vendasFiltradasGrafico.forEach(v => {
      if (v.produto_nome) {
        const entry = produtosMap.get(v.produto_nome) || { Faturamento: 0, Peso: 0 };
        entry.Faturamento += Number(v.valor_total) || 0;
        entry.Peso += Number(v.peso) || 0;
        produtosMap.set(v.produto_nome, entry);
      }
    });
    const dadosGraficoProdutos = Array.from(produtosMap.entries()).map(([name, values]) => ({ name, ...values })).sort((a, b) => b.Faturamento - a.Faturamento);

    const todasMovimentacoes = [
      ...vendas.map(v => ({ ...v, tipo: 'Entrada' as const, data: v.data_venda, valor: v.valor_total, descricao: v.produto_nome })),
      ...despesas.map(d => ({ ...d, tipo: 'Saída' as const, data: d.data_pagamento, valor: d.valor, descricao: d.tipo_saida }))
    ];

    const movimentacoesFiltradas = todasMovimentacoes.filter(m => {
      if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false;
      if (!m.data) return false;
      const dataMovimentacao = new Date(m.data);
      dataMovimentacao.setUTCHours(0, 0, 0, 0);
      if (filtroData === 'hoje') {
        const hoje = new Date();
        hoje.setUTCHours(0, 0, 0, 0);
        return dataMovimentacao.getTime() === hoje.getTime();
      }
      if (filtroData === 'mes') return dataMovimentacao.getFullYear() === currentYear && dataMovimentacao.getMonth() === currentMonth;
      if (filtroData === 'personalizado') {
        const inicio = new Date(dataInicio);
        inicio.setUTCHours(0,0,0,0);
        const fim = new Date(dataFim);
        fim.setUTCHours(0,0,0,0);
        return dataMovimentacao >= inicio && dataMovimentacao <= fim;
      }
      return false;
    }).sort((a, b) => new Date(b.data!).getTime() - new Date(a.data!).getTime());

    const totalMovimentacoes = movimentacoesFiltradas.reduce((acc, mov) => acc + (Number(mov.tipo === 'Entrada' ? mov.valor : -mov.valor) || 0), 0);

    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);
    const cincoDiasFrente = new Date(hoje);
    cincoDiasFrente.setDate(hoje.getDate() + 5);

    const proximosVencimentos: Vencimento[] = vendas
      .filter(venda => {
        if (venda.data_pagamento || !venda.data_vencimento) return false;
        const dataVenc = new Date(venda.data_vencimento);
        dataVenc.setUTCHours(0, 0, 0, 0);
        return dataVenc >= hoje && dataVenc <= cincoDiasFrente;
      })
      .map(venda => {
        const dataVenc = new Date(venda.data_vencimento!);
        dataVenc.setUTCHours(0, 0, 0, 0);
        const diffTime = dataVenc.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          cliente_nome: venda.cliente_nome,
          valor_total: venda.valor_total,
          dias_para_vencer: diffDays,
          data_vencimento: formatDate(venda.data_vencimento),
          venda: venda,
        };
      })
      .sort((a, b) => a.dias_para_vencer - b.dias_para_vencer);

    return { kpis, dadosGraficoPrincipal, movimentacoesFiltradas, totalMovimentacoes, dadosGraficoProdutos, tituloGraficoProdutos, proximosVencimentos };
  }, [vendas, despesas, periodoGrafico, filtroData, filtroTipo, dataInicio, dataFim]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const payload = data.activePayload[0].payload;
      setPeriodoEmFoco({ label: payload.name, entradas: payload.Entradas, saidas: payload.Saídas, saldo: payload.Entradas - payload.Saídas });
    }
  };

  const handleOpenQuickPayment = (venda: Venda) => {
    setVendaParaQuitar(venda);
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = (vendaId: number, dataPagamento: string) => {
    const vendaOriginal = vendas?.find(v => v.id === vendaId);
    if (!vendaOriginal) {
      toast.error("Venda original não encontrada para quitar.");
      return;
    }

    const payload = {
      ...vendaOriginal,
      produto_nome: vendaOriginal.produto_nome,
      peso_produto: vendaOriginal.peso,
      data_pagamento: dataPagamento,
    };

    updateVendaMutation.mutate({ id: vendaId, payload }, {
      onSuccess: () => {
        toast.success("Pagamento registrado com sucesso!");
        setIsPaymentDialogOpen(false);
        setVendaParaQuitar(null);
      },
      onError: (err: any) => {
        toast.error(`Erro ao registrar pagamento: ${err.response?.data?.error || err.message}`);
      }
    });
  };

  const isLoading = isLoadingVendas || isLoadingDespesas;
  const isError = isErrorVendas || isErrorDespesas;
  const kpisEmExibicao = periodoEmFoco || kpis;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"><Skeleton className="h-80 lg:col-span-3" /><Skeleton className="h-80 lg:col-span-2" /></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Erro ao Carregar</AlertTitle><AlertDescription>Não foi possível buscar os dados do dashboard.</AlertDescription></Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Análise de desempenho do seu negócio. <span className="font-semibold text-blue-600">Clique nas barras do gráfico para filtrar os valores.</span></p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Entradas ({kpisEmExibicao.label})</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(kpisEmExibicao.entradas)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Saídas ({kpisEmExibicao.label})</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(kpisEmExibicao.saidas)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Saldo ({kpisEmExibicao.label})</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${kpisEmExibicao.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(kpisEmExibicao.saldo)}</div></CardContent></Card>
      </div>

      <Card className="border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20 dark:border-yellow-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
            <AlertCircle size={22} />
            Pagamentos a Vencer (Próximos 5 dias)
          </CardTitle>
          <CardDescription className="text-yellow-700 dark:text-yellow-500">
            Clientes com pagamentos pendentes que vencem em breve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {proximosVencimentos.length > 0 ? (
            <div className="max-h-[200px] overflow-y-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vence em</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    {user?.perfil === 'ADMIN' && <TableHead className="text-center">Ação</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {proximosVencimentos.map((v, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{v.cliente_nome}</TableCell>
                        <TableCell>
                        <Badge variant={v.dias_para_vencer <= 1 ? "destructive" : "secondary"}>
                            {v.dias_para_vencer === 0 ? 'Hoje' : `${v.dias_para_vencer} dia(s)`}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(v.valor_total)}</TableCell>
                        {user?.perfil === 'ADMIN' && (
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenQuickPayment(v.venda)}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Quitar
                            </Button>
                          </TableCell>
                        )}
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">Nenhum pagamento a vencer nos próximos 5 dias.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Visão Geral Financeira</CardTitle>
                <CardDescription>Entradas vs. Saídas por período</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button variant={periodoGrafico === '6M' ? 'default' : 'outline'} size="sm" onClick={() => { setPeriodoGrafico('6M'); setPeriodoEmFoco(null); }}>6 Meses</Button>
                <Button variant={periodoGrafico === 'ANO' ? 'default' : 'outline'} size="sm" onClick={() => { setPeriodoGrafico('ANO'); setPeriodoEmFoco(null); }}>Este Ano</Button>
                <Button variant={periodoGrafico === '5A' ? 'default' : 'outline'} size="sm" onClick={() => { setPeriodoGrafico('5A'); setPeriodoEmFoco(null); }}>Anual</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dadosGraficoPrincipal} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#22c55e" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value / 1000}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar yAxisId="left" dataKey="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} cursor="pointer" />
                <Bar yAxisId="left" dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package size={20} /> {tituloGraficoProdutos}</CardTitle>
            <CardDescription>Faturamento vs. Peso vendido por produto</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dadosGraficoProdutos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} stroke="#888888" fontSize={12} />
                <Tooltip formatter={(value: number, name: string) => name === 'Peso' ? `${formatNumber(value)} kg` : formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Faturamento" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Peso" fill="#8884d8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>Filtre e analise as movimentações por período e tipo.</CardDescription>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-muted-foreground">
                    {filtroTipo === 'todos' ? 'Saldo do Período' : `Total de ${filtroTipo}s`}
                </span>
                <span className={`text-2xl font-bold ${totalMovimentacoes >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                    {formatCurrency(totalMovimentacoes)}
                </span>
            </div>
          </div>
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center pt-4 mt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant={filtroData === 'hoje' ? 'default' : 'outline'} onClick={() => setFiltroData('hoje')}>Hoje</Button>
              <Button size="sm" variant={filtroData === 'mes' ? 'default' : 'outline'} onClick={() => setFiltroData('mes')}>Este Mês</Button>
              <div className="flex items-center gap-2 pl-2 border-l">
                <Checkbox id="filtro-personalizado" checked={filtroData === 'personalizado'} onCheckedChange={(checked) => setFiltroData(checked ? 'personalizado' : 'hoje')} />
                <Label htmlFor="filtro-personalizado" className="text-sm font-medium">Personalizado</Label>
              </div>
              {filtroData === 'personalizado' && (
                <div className="flex items-center gap-2 animate-in fade-in">
                  <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="h-9"/>
                  <span className="text-muted-foreground">até</span>
                  <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="h-9"/>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={filtroTipo === 'todos' ? 'secondary' : 'ghost'} onClick={() => setFiltroTipo('todos')}>Todos</Button>
              <Button size="sm" variant={filtroTipo === 'Entrada' ? 'secondary' : 'ghost'} className="text-green-600 hover:bg-green-100" onClick={() => setFiltroTipo('Entrada')}>Entradas</Button>
              <Button size="sm" variant={filtroTipo === 'Saída' ? 'secondary' : 'ghost'} className="text-red-600 hover:bg-red-100" onClick={() => setFiltroTipo('Saída')}>Saídas</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoesFiltradas.length > 0 ? (
                  movimentacoesFiltradas.map((mov, index) => (
                    <TableRow key={`${mov.id}-${mov.tipo}-${index}`}>
                      <TableCell><Badge variant={mov.tipo === 'Entrada' ? 'default' : 'destructive'}>{mov.tipo}</Badge></TableCell>
                      <TableCell className="font-medium">{mov.descricao}</TableCell>
                      <TableCell>{formatDate(mov.data)}</TableCell>
                      <TableCell className={`text-right font-semibold ${mov.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(Number(mov.valor))}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">Nenhuma movimentação encontrada para este período.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <QuickPaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        venda={vendaParaQuitar}
        onConfirm={handleConfirmPayment}
        isSubmitting={updateVendaMutation.isPending}
      />
    </div>
  );
}
