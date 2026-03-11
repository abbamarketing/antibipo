import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { daysInMonth, isValidDay, formatCurrencyShort, saldoColor, saldoTextColor, mesAbreviado } from "@/lib/currency";

interface HorizonteTabProps {
  currentAno: number;
  currentMes: number;
  onBack: () => void;
  onDayClick: (ano: number, mes: number, dia: number) => void;
}

function getMonths(ano: number, mes: number) {
  const months: { ano: number; mes: number }[] = [];
  for (let i = -1; i <= 1; i++) {
    let m = mes + i;
    let a = ano;
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    months.push({ ano: a, mes: m });
  }
  return months;
}

export function HorizonteTab({ currentAno, currentMes, onBack, onDayClick }: HorizonteTabProps) {
  const months = getMonths(currentAno, currentMes);

  const { data: allLancs = [] } = useQuery({
    queryKey: ["fc_horizonte", months.map((m) => `${m.ano}-${m.mes}`).join(",")],
    queryFn: async () => {
      const results: any[] = [];
      for (const m of months) {
        const { data } = await supabase
          .from("fc_lancamentos")
          .select("dia, saldo")
          .eq("ano", m.ano)
          .eq("mes", m.mes)
          .order("dia");
        if (data) results.push(...data.map((d: any) => ({ ...d, ano: m.ano, mes: m.mes, saldo: Number(d.saldo) })));
      }
      return results;
    },
  });

  const saldoMap = new Map<string, number>();
  allLancs.forEach((l: any) => {
    saldoMap.set(`${l.ano}-${l.mes}-${l.dia}`, l.saldo);
  });

  const maxDays = Math.max(...months.map((m) => daysInMonth(m.ano, m.mes)));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="font-mono text-sm font-bold tracking-tight">HORIZONTE DE SALDOS</h2>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {/* Headers */}
        {months.map((m) => {
          const isCurrent = m.ano === currentAno && m.mes === currentMes;
          return (
            <div
              key={`h-${m.ano}-${m.mes}`}
              className={`text-center py-2 rounded-t-md font-mono text-[10px] font-bold tracking-wider ${
                isCurrent ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
              }`}
            >
              {mesAbreviado(m.mes)}/{String(m.ano).slice(2)}
            </div>
          );
        })}

        {/* Days */}
        {Array.from({ length: maxDays }, (_, i) => i + 1).map((day) => (
          months.map((m) => {
            const key = `${m.ano}-${m.mes}-${day}`;
            const valid = isValidDay(m.ano, m.mes, day);
            const saldo = saldoMap.get(key);

            if (!valid) {
              return <div key={key} className="h-7" />;
            }

            return (
              <button
                key={key}
                onClick={() => onDayClick(m.ano, m.mes, day)}
                className="h-7 flex items-center justify-between px-1.5 border-b border-border/30 hover:opacity-80 transition-opacity"
                style={
                  saldo !== undefined
                    ? { backgroundColor: saldoColor(saldo), color: saldoTextColor(saldo) }
                    : {}
                }
              >
                <span className="font-mono text-[9px]">{day}</span>
                <span className="font-mono text-[9px] font-medium">
                  {saldo !== undefined ? formatCurrencyShort(saldo) : ""}
                </span>
              </button>
            );
          })
        ))}
      </div>
    </div>
  );
}
