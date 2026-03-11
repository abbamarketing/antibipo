import { TrendingUp, TrendingDown, Wallet, CalendarDays, ArrowUpCircle, ArrowDownCircle, Minus } from "lucide-react";
import { formatCurrency, daysInMonth } from "@/lib/currency";
import type { Consolidacao } from "@/lib/financial-store";

interface TotaisTabProps {
  consolidacao: Consolidacao | null | undefined;
  ano: number;
  mes: number;
}

export function TotaisTab({ consolidacao, ano, mes }: TotaisTabProps) {
  const c = consolidacao;
  const totalEntradas = c?.total_entradas || 0;
  const totalSaidas = c?.total_saidas || 0;
  const perf = totalEntradas - totalSaidas;
  const econPct = totalEntradas > 0 ? (perf / totalEntradas) * 100 : 0;

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === ano && today.getMonth() + 1 === mes;
  const diasPassados = isCurrentMonth ? today.getDate() : daysInMonth(ano, mes);
  const totalDias = daysInMonth(ano, mes);
  const custoReal = diasPassados > 0 ? totalSaidas / diasPassados : 0;
  const custoProjetado = totalDias > 0 ? (totalSaidas / diasPassados) * totalDias : 0;

  const econColor = econPct >= 20 ? "text-green-600" : econPct >= 10 ? "text-yellow-600" : "text-red-500";
  const econBarColor = econPct >= 20 ? "bg-green-500" : econPct >= 10 ? "bg-yellow-500" : "bg-red-500";
  const econStatus = econPct >= 20 ? "Dentro do ideal" : econPct >= 10 ? "Atenção" : "Abaixo do ideal";

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Performance */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-2">
          {perf >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Performance</span>
        </div>
        <p className={`text-2xl font-mono font-bold ${perf >= 0 ? "text-green-600" : "text-red-500"}`}>
          {formatCurrency(perf)}
        </p>
        <p className={`text-xs font-body mt-1 ${perf >= 0 ? "text-green-600" : "text-red-500"}`}>
          {perf >= 0 ? "Sobrou dinheiro" : "Gastou mais do que entrou"}
        </p>
      </div>

      {/* Economizado */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Economizado</span>
        </div>
        <p className={`text-2xl font-mono font-bold ${econColor}`}>
          {econPct.toFixed(1)}%
        </p>
        <div className="w-full h-2 bg-secondary rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${econBarColor}`}
            style={{ width: `${Math.min(Math.max(econPct, 0), 100)}%` }}
          />
        </div>
        <p className={`text-xs font-body mt-1 ${econColor}`}>{econStatus}</p>
      </div>

      {/* Custo de vida */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Custo de vida</span>
        </div>
        <p className="text-2xl font-mono font-bold">{formatCurrency(totalSaidas)}</p>
        <p className={`text-xs font-body mt-1 ${totalSaidas < totalEntradas ? "text-green-600" : "text-red-500"}`}>
          {totalSaidas < totalEntradas ? "Dentro da renda" : "Acima da renda"}
        </p>
      </div>

      {/* Diário médio */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-2">
          <Minus className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Diário médio</span>
        </div>
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-body">Real</p>
            <p className="text-lg font-mono font-bold">{formatCurrency(custoReal)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-body">Projetado</p>
            <p className="text-lg font-mono font-bold text-muted-foreground">{formatCurrency(custoProjetado)}</p>
          </div>
        </div>
      </div>

      {/* Movimentações */}
      <div className="mt-6">
        <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-3">
          Movimentações do mês
        </h3>
        <div className="bg-card rounded-lg border divide-y">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-body">Entradas</span>
            </div>
            <span className="font-mono text-sm font-bold text-green-600">{formatCurrency(totalEntradas)}</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-body">Saídas</span>
            </div>
            <span className="font-mono text-sm font-bold text-red-500">{formatCurrency(totalSaidas)}</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-body font-medium">Saldo do período</span>
            <span className={`font-mono text-sm font-bold ${perf >= 0 ? "text-green-600" : "text-red-500"}`}>
              {formatCurrency(perf)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
