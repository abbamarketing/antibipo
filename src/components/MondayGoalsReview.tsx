import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDayContext } from "@/hooks/use-day-context";
import { ClipboardList, X, Zap, Sun, Battery, ChevronRight } from "lucide-react";

interface MondayGoalsReviewProps {
  onDismiss: () => void;
}

export function MondayGoalsReview({ onDismiss }: MondayGoalsReviewProps) {
  const dayCtx = useDayContext();
  const [actions, setActions] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  // Fetch last Friday's report for context
  const { data: lastReport } = useQuery({
    queryKey: ["last-friday-report"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports_semanais")
        .select("reflexao, destaques, dificuldades, nota_semana, metricas")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 60 * 60 * 1000,
  });

  const handleAddAction = () => {
    if (actions.length < 5) setActions([...actions, ""]);
  };

  const handleUpdateAction = (i: number, val: string) => {
    const next = [...actions];
    next[i] = val;
    setActions(next);
  };

  const handleSave = async () => {
    const validActions = actions.filter((a) => a.trim());
    if (validActions.length === 0) { onDismiss(); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("activity_log").insert({
        user_id: user.id,
        acao: "monday_actions",
        detalhes: { actions: validActions, dayScore: dayCtx.dayScore, energy: dayCtx.energy },
      });

      onDismiss();
    } finally {
      setSaving(false);
    }
  };

  const energyIcon = dayCtx.energy === "foco_total" ? Zap : dayCtx.energy === "modo_leve" ? Sun : Battery;
  const EIcon = energyIcon;

  return (
    <div className="animate-fade-in space-y-5">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <ClipboardList className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-mono text-lg font-bold">Planejamento de Segunda</h2>
        <p className="text-sm text-muted-foreground font-body">
          Defina até 5 ações concretas para esta semana. Na sexta, vamos analisar o impacto.
        </p>
      </div>

      {/* Last week context */}
      {lastReport && (
        <div className="bg-secondary/40 rounded-xl p-3 space-y-1.5">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">SEMANA ANTERIOR</span>
          {lastReport.reflexao && (
            <p className="text-xs text-foreground/80 font-body">"{lastReport.reflexao}"</p>
          )}
          {lastReport.nota_semana && (
            <span className="font-mono text-[10px] text-muted-foreground">
              Nota: {lastReport.nota_semana}/5
            </span>
          )}
          {lastReport.dificuldades && (lastReport.dificuldades as string[]).length > 0 && (
            <div className="mt-1">
              <span className="font-mono text-[9px] text-destructive/70">Dificuldades pendentes:</span>
              {(lastReport.dificuldades as string[]).slice(0, 2).map((d, i) => (
                <p key={i} className="text-[11px] text-muted-foreground font-body">• {d}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Energy context */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <EIcon className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono">
          {dayCtx.energy === "foco_total" ? "Energia alta — bom momento para ações ambiciosas"
            : dayCtx.energy === "basico" ? "Energia baixa — foque em 1-2 ações simples"
            : "Energia moderada — defina ações realistas"}
        </span>
      </div>

      {/* Actions input */}
      <div className="space-y-2">
        <label className="font-mono text-xs font-medium">Ações da semana</label>
        {actions.map((action, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground w-4">{i + 1}.</span>
            <input
              value={action}
              onChange={(e) => handleUpdateAction(i, e.target.value)}
              placeholder={i === 0 ? "Ex: Entregar proposta do cliente X" : "Outra ação..."}
              className="flex-1 bg-background border rounded-lg p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus={i === 0}
            />
          </div>
        ))}
        {actions.length < 5 && (
          <button
            onClick={handleAddAction}
            className="font-mono text-[10px] text-primary hover:opacity-80 flex items-center gap-1 ml-6"
          >
            + adicionar ação
          </button>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {saving ? "SALVANDO..." : "DEFINIR AÇÕES"}
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onDismiss}
        className="w-full font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors text-center"
      >
        PULAR POR AGORA
      </button>
    </div>
  );
}
