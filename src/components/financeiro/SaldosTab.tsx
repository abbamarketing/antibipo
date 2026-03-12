import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, saldoColor, saldoTextColor } from "@/lib/currency";
import { useState, useMemo } from "react";

interface DayRow {
  dia: number;
  entrada: number;
  saida: number;
  saldo: number | null;
  hasData: boolean;
  isPast: boolean;
  isToday: boolean;
  confirmed: boolean;
}

interface SaldosTabProps {
  dailyList: DayRow[];
  onDayClick: (dia: number) => void;
}

export function SaldosTab({ dailyList, onDayClick }: SaldosTabProps) {
  const [showAllDays, setShowAllDays] = useState(false);

  const { summary, visibleDays, hiddenCount } = useMemo(() => {
    // Only count entries up to today (past + today), not future
    const upToToday = dailyList.filter((r) => r.isPast || r.isToday);
    const totalEntradas = upToToday.reduce((s, r) => s + r.entrada, 0);
    const totalSaidas = upToToday.reduce((s, r) => s + r.saida, 0);
    const lastSaldo = [...upToToday].reverse().find((r) => r.saldo !== null)?.saldo ?? null;

    // Show: today, days with data, and 2 future days without data
    const todayIdx = dailyList.findIndex((r) => r.isToday);
    const relevant = dailyList.filter((r, i) => {
      if (r.isToday || r.hasData) return true;
      // Show 2 future days around today for context
      if (todayIdx >= 0 && i > todayIdx && i <= todayIdx + 2) return true;
      return false;
    });

    return {
      summary: { totalEntradas, totalSaidas, saldo: lastSaldo },
      visibleDays: showAllDays ? dailyList : relevant,
      hiddenCount: dailyList.length - relevant.length,
    };
  }, [dailyList, showAllDays]);

  const perf = summary.totalEntradas - summary.totalSaidas;

  return (
    <div className="animate-fade-in space-y-3">
      {/* Summary card */}
      <div className="bg-card rounded-lg border p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase mb-1">Entradas</p>
            <p className="font-mono text-sm font-bold text-green-600">{formatCurrency(summary.totalEntradas)}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase mb-1">Saidas</p>
            <p className="font-mono text-sm font-bold text-red-500">{formatCurrency(summary.totalSaidas)}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase mb-1">Saldo</p>
            <p className={`font-mono text-sm font-bold ${perf >= 0 ? "text-green-600" : "text-red-500"}`}>
              {formatCurrency(perf)}
            </p>
          </div>
        </div>
        {summary.saldo !== null && (
          <div className="mt-3 pt-3 border-t border-border/50 text-center">
            <p className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase mb-1">Saldo acumulado</p>
            <span
              className="font-mono text-lg font-bold px-3 py-1 rounded-md inline-block"
              style={{
                backgroundColor: saldoColor(summary.saldo),
                color: saldoTextColor(summary.saldo),
              }}
            >
              {formatCurrency(summary.saldo)}
            </span>
          </div>
        )}
      </div>

      {/* Day list */}
      <div>
        <div className="flex items-center justify-between px-2 py-2 text-muted-foreground font-mono text-[10px] tracking-widest uppercase border-b mb-1">
          <span className="w-10">Dia</span>
          <span className="flex-1 text-center">Movimento</span>
          <span className="w-24 text-right">Saldo</span>
        </div>

        <div className="space-y-0">
          {visibleDays.map((row) => {
            const mov = row.entrada - row.saida;
            return (
              <button
                key={row.dia}
                onClick={() => onDayClick(row.dia)}
                className={`w-full flex items-center justify-between py-3 px-2 border-b border-border/50 hover:bg-secondary/30 transition-colors ${
                  row.isToday ? "bg-primary/5" : ""
                }`}
              >
                <div className="w-10 flex items-center gap-1">
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full font-mono text-xs font-medium ${
                      row.isToday ? "bg-foreground text-background" : ""
                    }`}
                  >
                    {row.dia}
                  </span>
                  {row.confirmed && <Check className="w-3 h-3 text-green-500" />}
                </div>

                <div className="flex-1 text-center">
                  {row.hasData ? (
                    <div className="flex items-center justify-center gap-2">
                      {row.entrada > 0 && (
                        <span className="font-mono text-xs text-green-600">+{formatCurrency(row.entrada)}</span>
                      )}
                      {row.saida > 0 && (
                        <span className="font-mono text-xs text-red-500">-{formatCurrency(row.saida)}</span>
                      )}
                    </div>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground/30">—</span>
                  )}
                </div>

                <div className="w-24 text-right">
                  {row.saldo !== null ? (
                    <span
                      className="font-mono text-xs font-medium px-2 py-1 rounded"
                      style={{
                        backgroundColor: saldoColor(row.saldo),
                        color: saldoTextColor(row.saldo),
                      }}
                    >
                      {formatCurrency(row.saldo)}
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground/30">—</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Toggle all days */}
        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAllDays(!showAllDays)}
            className="w-full py-3 flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAllDays ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="font-mono text-[10px] tracking-wider">MENOS DIAS</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="font-mono text-[10px] tracking-wider">VER TODOS ({hiddenCount} DIAS)</span>
              </>
            )}
          </button>
        )}
      </div>

      {dailyList.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground font-body">
          Nenhum dia neste mes.
        </div>
      )}
    </div>
  );
}
