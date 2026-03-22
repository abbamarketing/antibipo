import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-log";
import { brasiliaDateString } from "@/lib/brasilia";
import { Check, Sparkles } from "lucide-react";

const BRUSHING_TIMES = [
  { id: "manha", label: "Manhã" },
  { id: "noite", label: "Noite" },
] as const;

export function BrushingTracker() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const todayKey = new Date().toISOString().split("T")[0];

  useEffect(() => {
    // Load today's brushing from activity_log
    (async () => {
      const { data } = await supabase
        .from("activity_log")
        .select("detalhes")
        .eq("acao", "escovacao")
        .gte("criado_em", `${todayKey}T00:00:00`)
        .lt("criado_em", `${todayKey}T23:59:59`);
      if (data) {
        const ids = new Set(data.map((d: any) => (d.detalhes as any)?.periodo).filter(Boolean));
        setDone(ids);
      }
    })();
  }, [todayKey]);

  const handleBrush = async (periodo: string) => {
    if (done.has(periodo)) return;
    await logActivity("escovacao", { periodo, data: todayKey });
    setDone((prev) => new Set([...prev, periodo]));
  };

  const allDone = BRUSHING_TIMES.every((t) => done.has(t.id));

  return (
    <div className="space-y-2">
      <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" /> Escovação
      </h3>
      <div className="bg-card rounded-lg border p-4">
        <div className="flex gap-3">
          {BRUSHING_TIMES.map((t) => {
            const isDone = done.has(t.id);
            return (
              <button
                key={t.id}
                onClick={() => handleBrush(t.id)}
                disabled={isDone}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-mono text-xs transition-all ${
                  isDone
                    ? "bg-secondary text-foreground/50 cursor-default"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {isDone && <Check className="w-3 h-3" />}
                {isDone ? "FEITO" : t.label.toUpperCase()}
              </button>
            );
          })}
        </div>
        {allDone && (
          <p className="text-center text-[10px] text-muted-foreground mt-2 font-mono">
            Escovação completa hoje ✓
          </p>
        )}
      </div>
    </div>
  );
}
