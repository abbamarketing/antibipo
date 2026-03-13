import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMetasStore, prazoLabel } from "@/lib/metas-store";
import { BarChart3, Star, AlertTriangle, TrendingUp, Frown, Meh, Smile, Laugh, Angry, Target, ChevronDown, ChevronRight } from "lucide-react";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface FridayWeeklyReportProps {
  onDismiss: () => void;
}

const ratingOptions = [
  { val: 1, label: "Dificil", icon: Angry },
  { val: 2, label: "Ruim", icon: Frown },
  { val: 3, label: "Normal", icon: Meh },
  { val: 4, label: "Boa", icon: Smile },
  { val: 5, label: "Otima", icon: Laugh },
];

export function FridayWeeklyReport({ onDismiss }: FridayWeeklyReportProps) {
  const store = useMetasStore();
  const [step, setStep] = useState(0);
  const [nota, setNota] = useState(3);
  const [reflexao, setReflexao] = useState("");
  const [destaques, setDestaques] = useState("");
  const [dificuldades, setDificuldades] = useState("");
  const [actionResults, setActionResults] = useState<Record<number, "done" | "partial" | "missed">>({});
  const [impactNotes, setImpactNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Fetch Monday's planned actions
  const { data: mondayActions } = useQuery({
    queryKey: ["monday-actions-this-week"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("activity_log")
        .select("detalhes, criado_em")
        .eq("user_id", user.id)
        .eq("acao", "monday_actions")
        .gte("criado_em", format(weekStart, "yyyy-MM-dd"))
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data?.detalhes) return null;
      const d = data.detalhes as Record<string, unknown>;
      return (d.actions as string[]) || null;
    },
    staleTime: 30 * 60 * 1000,
  });

  const hasMondayActions = mondayActions && mondayActions.length > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const mondayImpact = hasMondayActions ? {
        actions: mondayActions,
        results: actionResults,
        impactNotes: impactNotes.trim() || null,
        completionRate: Object.values(actionResults).filter((r) => r === "done").length / mondayActions!.length,
      } : null;

      store.saveReport({
        user_id: user.id,
        semana_inicio: format(weekStart, "yyyy-MM-dd"),
        semana_fim: format(weekEnd, "yyyy-MM-dd"),
        reflexao: reflexao.trim() || null,
        nota_semana: nota,
        destaques: destaques.trim() ? destaques.split("\n").filter(Boolean) : null,
        dificuldades: dificuldades.trim() ? dificuldades.split("\n").filter(Boolean) : null,
        metas_update: [],
        metricas: { mondayImpact },
      });
      onDismiss();
    } finally {
      setSaving(false);
    }
  };

  const resultLabels: Record<string, { label: string; color: string }> = {
    done: { label: "Feito", color: "bg-green-500/15 text-green-600 border-green-500/30" },
    partial: { label: "Parcial", color: "bg-primary/10 text-primary border-primary/30" },
    missed: { label: "Não feito", color: "bg-destructive/10 text-destructive border-destructive/30" },
  };

  const steps = [
    // Step 0: Rating
    <div key="rating" className="space-y-4">
      <label className="font-mono text-sm font-medium block">Como foi sua semana?</label>
      <div className="flex justify-between gap-2">
        {ratingOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.val}
              onClick={() => { setNota(opt.val); setTimeout(() => setStep(1), 300); }}
              className={`flex-1 py-4 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                nota === opt.val ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-mono text-[9px]">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>,

    // Step 1: Monday Impact Analysis
    <div key="impact" className="space-y-4">
      <label className="font-mono text-sm font-medium block flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" /> Análise de Impacto — Ações da Segunda
      </label>
      {hasMondayActions ? (
        <>
          <p className="text-xs text-muted-foreground font-body">
            Avalie cada ação planejada na segunda-feira e seu impacto nas suas metas.
          </p>
          <div className="space-y-2">
            {mondayActions!.map((action, i) => (
              <div key={i} className="bg-card rounded-xl border p-3 space-y-2">
                <p className="text-sm font-body">{i + 1}. {action}</p>
                <div className="flex gap-2">
                  {(["done", "partial", "missed"] as const).map((r) => {
                    const cfg = resultLabels[r];
                    const isSelected = actionResults[i] === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setActionResults({ ...actionResults, [i]: r })}
                        className={`flex-1 py-2 rounded-lg border text-[11px] font-mono transition-all ${
                          isSelected ? cfg.color : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Metas impact notes */}
          {store.metasAtivas.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <label className="font-mono text-[10px] tracking-widest text-muted-foreground">
                IMPACTO NAS METAS
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {store.metasAtivas.slice(0, 4).map((m) => (
                  <span key={m.id} className="text-[10px] font-mono bg-secondary px-2 py-1 rounded-md">
                    {m.titulo} ({m.progresso}%)
                  </span>
                ))}
              </div>
              <textarea
                value={impactNotes}
                onChange={(e) => setImpactNotes(e.target.value)}
                rows={2}
                placeholder="Como essas ações afetaram suas metas? Alguma meta ficou para trás?"
                className="w-full bg-background border rounded-lg p-3 text-sm font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
        </>
      ) : (
        <div className="bg-secondary/40 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground font-body">
            Nenhuma ação foi planejada na segunda-feira desta semana.
          </p>
          <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">
            Na próxima segunda, defina ações para acompanhar o impacto aqui.
          </p>
        </div>
      )}
    </div>,

    // Step 2: Highlights
    <div key="highlights" className="space-y-4">
      <label className="font-mono text-sm font-medium block flex items-center gap-2">
        <Star className="w-4 h-4 text-primary" /> Destaques da semana
      </label>
      <p className="text-xs text-muted-foreground font-body">O que deu certo? O que te orgulhou? (um por linha)</p>
      <textarea
        value={destaques}
        onChange={(e) => setDestaques(e.target.value)}
        rows={3}
        placeholder="Entreguei o projeto X&#10;Fiz exercicio 3x&#10;Mantive a casa organizada"
        className="w-full bg-background border rounded-lg p-3 text-sm font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>,

    // Step 3: Difficulties
    <div key="diff" className="space-y-4">
      <label className="font-mono text-sm font-medium block flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" /> Dificuldades
      </label>
      <p className="text-xs text-muted-foreground font-body">O que foi dificil? Sem julgamento. (um por linha)</p>
      <textarea
        value={dificuldades}
        onChange={(e) => setDificuldades(e.target.value)}
        rows={3}
        placeholder="Procrastinei na segunda&#10;Nao dormi bem&#10;Esqueci do remedio"
        className="w-full bg-background border rounded-lg p-3 text-sm font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>,

    // Step 4: Reflection
    <div key="reflexao" className="space-y-4">
      <label className="font-mono text-sm font-medium block flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" /> Reflexão
      </label>
      <p className="text-xs text-muted-foreground font-body">Uma frase sobre o que levar pra próxima semana.</p>
      <textarea
        value={reflexao}
        onChange={(e) => setReflexao(e.target.value)}
        rows={2}
        placeholder="Preciso dormir mais cedo e priorizar menos tarefas."
        className="w-full bg-background border rounded-lg p-3 text-sm font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
      />

      {/* Summary of action completion */}
      {hasMondayActions && Object.keys(actionResults).length > 0 && (
        <div className="bg-secondary/40 rounded-xl p-3 space-y-1">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">RESUMO DAS AÇÕES</span>
          <div className="flex gap-3 mt-1">
            <span className="text-[11px] font-mono text-green-600">
              ✓ {Object.values(actionResults).filter((r) => r === "done").length} feitas
            </span>
            <span className="text-[11px] font-mono text-primary">
              ~ {Object.values(actionResults).filter((r) => r === "partial").length} parciais
            </span>
            <span className="text-[11px] font-mono text-destructive">
              ✗ {Object.values(actionResults).filter((r) => r === "missed").length} não feitas
            </span>
          </div>
          {impactNotes && (
            <p className="text-[11px] text-muted-foreground font-body mt-1">"{impactNotes}"</p>
          )}
        </div>
      )}
    </div>,
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mx-auto">
          <BarChart3 className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-mono text-lg font-bold">Report da semana</h2>
        <p className="text-xs text-muted-foreground font-mono">
          {format(weekStart, "dd/MM", { locale: ptBR })} — {format(weekEnd, "dd/MM", { locale: ptBR })}
        </p>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-secondary"}`}
          />
        ))}
      </div>

      {steps[step]}

      {/* Navigation */}
      <div className="flex gap-2">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 py-2.5 rounded-lg border font-mono text-xs hover:bg-secondary"
          >
            VOLTAR
          </button>
        )}
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-mono text-xs hover:opacity-90"
          >
            PRÓXIMO
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-mono text-xs hover:opacity-90 disabled:opacity-40"
          >
            {saving ? "SALVANDO..." : "FECHAR SEMANA"}
          </button>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="w-full font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors text-center"
      >
        PULAR POR AGORA
      </button>
    </div>
  );
}
