import { useBemEstarStore, type AnaliseSemanal } from "@/lib/bem-estar-store";
import { ChevronLeft, ChevronRight, Activity, Check, TrendingUp, CloudRain, ArrowUpDown, HelpCircle } from "lucide-react";
import { useState } from "react";

const classificacaoConfig: Record<string, { bg: string; text: string; icon: typeof Check; label: string }> = {
  equilibrado: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", icon: Check, label: "EQUILIBRADO" },
  tendencia_mania: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", icon: TrendingUp, label: "TENDENCIA MANIA" },
  tendencia_depressao: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", icon: CloudRain, label: "TENDENCIA DEPRESSAO" },
  misto: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-400", icon: ArrowUpDown, label: "MISTO" },
  dados_insuficientes: { bg: "bg-secondary", text: "text-muted-foreground", icon: HelpCircle, label: "DADOS INSUFICIENTES" },
};

function formatWeekLabel(start: string): string {
  const d = new Date(start + "T12:00:00");
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${d.getDate()} a ${end.getDate()} de ${months[end.getMonth()]}`;
}

export function WeeklyDashboard() {
  const { analises } = useBemEstarStore();
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (analises.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> Dashboard Semanal
        </h3>
        <div className="bg-card rounded-lg border p-6 text-center">
          <Activity className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground font-body">
            Continue registrando diariamente. Após 14 dias a IA começará a detectar padrões.
          </p>
        </div>
      </div>
    );
  }

  const current = analises[selectedIdx];
  const cfg = classificacaoConfig[current?.classificacao || "dados_insuficientes"] || classificacaoConfig.dados_insuficientes;

  return (
    <div className="space-y-3">
      <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
        <Activity className="w-3.5 h-3.5" /> Dashboard Semanal
      </h3>

      {/* Week navigator */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedIdx((i) => Math.min(i + 1, analises.length - 1))}
          disabled={selectedIdx >= analises.length - 1}
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-mono text-xs text-muted-foreground">
          Semana de {formatWeekLabel(current.semana_inicio)}
        </span>
        <button
          onClick={() => setSelectedIdx((i) => Math.max(i - 1, 0))}
          disabled={selectedIdx <= 0}
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Classification card */}
      <div className={`rounded-lg p-4 text-center ${cfg.bg}`}>
        <span className="text-2xl">{cfg.icon}</span>
        <p className={`font-mono text-sm font-bold tracking-wider mt-1 ${cfg.text}`}>{cfg.label}</p>
        {current.score_medio != null && (
          <p className="font-mono text-xs text-muted-foreground mt-1">Score: {Number(current.score_medio).toFixed(0)}/100</p>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Humor", value: current.humor_medio != null ? Number(current.humor_medio).toFixed(1) : "—" },
          { label: "Sono", value: current.sono_medio != null ? `${Number(current.sono_medio).toFixed(1)}h` : "—" },
          { label: "Exercício", value: current.exercicios_semana != null ? `${current.exercicios_semana} dias` : "—" },
        ].map((m) => (
          <div key={m.label} className="bg-card rounded-lg border p-3 text-center">
            <p className="text-[10px] font-mono text-muted-foreground uppercase">{m.label}</p>
            <p className="text-sm font-mono font-bold mt-0.5">{m.value}</p>
          </div>
        ))}
      </div>

      {/* AI summary */}
      {current.ia_resumo && (
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-foreground/80 font-body leading-relaxed">{current.ia_resumo}</p>
        </div>
      )}

      {/* AI insights */}
      {current.ia_insights && Array.isArray(current.ia_insights) && (current.ia_insights as any[]).length > 0 && (
        <div className="space-y-1.5">
          {(current.ia_insights as any[]).slice(0, 3).map((insight: any, i: number) => (
            <div key={i} className="bg-card rounded-lg border p-3">
              <p className="text-[10px] font-mono text-primary uppercase">{insight.dimensao || "Insight"}</p>
              <p className="text-xs font-body text-foreground/80 mt-0.5">{insight.observacao}</p>
              {insight.acao && <p className="text-[10px] font-mono text-muted-foreground mt-1">→ {insight.acao}</p>}
            </div>
          ))}
        </div>
      )}

      {/* 12-week history dots */}
      {analises.length > 1 && (
        <div className="flex gap-1.5 justify-center pt-2">
          {analises.slice(0, 12).map((a, i) => {
            const c = classificacaoConfig[a.classificacao || "dados_insuficientes"];
            return (
              <button
                key={a.id}
                onClick={() => setSelectedIdx(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === selectedIdx ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                } ${
                  a.classificacao === "equilibrado"
                    ? "bg-emerald-500"
                    : a.classificacao === "tendencia_mania"
                    ? "bg-orange-400"
                    : a.classificacao === "tendencia_depressao"
                    ? "bg-blue-400"
                    : a.classificacao === "misto"
                    ? "bg-purple-400"
                    : "bg-muted-foreground/30"
                }`}
                title={`Semana de ${formatWeekLabel(a.semana_inicio)}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
