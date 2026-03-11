import { Check } from "lucide-react";
import { formatCurrency, saldoColor, saldoTextColor } from "@/lib/currency";

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
  return (
    <div className="animate-fade-in">
      {/* Sub-header */}
      <div className="flex items-center justify-between px-2 py-2 text-muted-foreground font-mono text-[10px] tracking-widest uppercase border-b mb-1">
        <span>Dia</span>
        <span>Diários</span>
        <span>Saldos</span>
      </div>

      <div className="space-y-0">
        {dailyList.map((row) => {
          const mov = row.entrada - row.saida;
          return (
            <button
              key={row.dia}
              onClick={() => onDayClick(row.dia)}
              className="w-full flex items-center justify-between py-2.5 px-2 border-b border-border/50 hover:bg-secondary/30 transition-colors"
            >
              {/* Day */}
              <div className="w-10 flex items-center gap-1">
                <span
                  className={`
                    w-7 h-7 flex items-center justify-center rounded-full font-mono text-xs font-medium
                    ${row.isToday ? "bg-foreground text-background" : ""}
                  `}
                >
                  {row.dia}
                </span>
                {row.confirmed && <Check className="w-3 h-3 text-green-500" />}
              </div>

              {/* Daily movement */}
              <div className="flex-1 text-center">
                {row.hasData ? (
                  <span className={`font-mono text-xs ${mov >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {formatCurrency(mov)}
                  </span>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground/40">—</span>
                )}
              </div>

              {/* Balance */}
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
                  <span className="font-mono text-xs text-muted-foreground/40">—</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {dailyList.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Nenhum dia neste mês.
        </div>
      )}
    </div>
  );
}
