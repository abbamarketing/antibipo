import { useState } from "react";
import { useMetasStore, prazoLabel, MetaPessoal } from "@/lib/metas-store";
import { Target, X, TrendingUp, Calendar } from "lucide-react";
import { differenceInDays } from "date-fns";

interface MondayGoalsReviewProps {
  onDismiss: () => void;
}

export function MondayGoalsReview({ onDismiss }: MondayGoalsReviewProps) {
  const store = useMetasStore();
  const metasAtivas = store.metasAtivas;

  if (metasAtivas.length === 0) return null;

  const prazoConfig: Record<string, { color: string; emoji: string; bar: string }> = {
    longo: { color: "text-purple-500", emoji: "🎯", bar: "bg-purple-500" },
    medio: { color: "text-blue-500", emoji: "📍", bar: "bg-blue-500" },
    curto: { color: "text-green-500", emoji: "⚡", bar: "bg-green-500" },
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Target className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-mono text-lg font-bold">Suas metas esta semana</h2>
        <p className="text-sm text-muted-foreground font-body">
          Boa segunda! Veja como estão seus objetivos.
        </p>
      </div>

      <div className="space-y-3">
        {(["longo", "medio", "curto"] as const).map((prazo) => {
          const metas = metasAtivas.filter((m) => m.prazo === prazo);
          if (metas.length === 0) return null;
          const config = prazoConfig[prazo];
          return (
            <div key={prazo} className="space-y-2">
              <h4 className={`font-mono text-[10px] tracking-widest uppercase ${config.color}`}>
                {config.emoji} {prazoLabel[prazo]}
              </h4>
              {metas.map((m) => {
                const diasRestantes = differenceInDays(new Date(m.data_alvo), new Date());
                return (
                  <div key={m.id} className="bg-card rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{m.titulo}</span>
                      <span className={`font-mono text-[10px] font-bold ${config.color}`}>{m.progresso}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${config.bar}`} style={{ width: `${m.progresso}%` }} />
                    </div>
                    <span className="font-mono text-[9px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {diasRestantes > 0 ? `${diasRestantes} dias restantes` : "Prazo encerrado"}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <button
        onClick={onDismiss}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90"
      >
        VAMOS LÁ! →
      </button>
    </div>
  );
}
