import { useState, useEffect } from "react";
import { brasiliaTime } from "@/lib/brasilia";
import { useMetasStore } from "@/lib/metas-store";
import { MondayGoalsReview } from "@/components/MondayGoalsReview";
import { FridayWeeklyReport } from "@/components/FridayWeeklyReport";
import { Target, BarChart3, Lock } from "lucide-react";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface DayGateProps {
  children: React.ReactNode;
}

/**
 * Gates the app on specific days:
 * - Monday: Must review goals before using the app
 * - Friday: Must complete weekly report before using the app
 * 
 * Uses localStorage to persist completion state for the day.
 */
export function DayGate({ children }: DayGateProps) {
  const hoje = brasiliaTime();
  const dia = hoje.getDay(); // 0=Sun, 1=Mon, 5=Fri
  const todayStr = hoje.toISOString().split("T")[0];

  const mondayKey = `ab_gate_monday_${todayStr}`;
  const fridayKey = `ab_gate_friday_${todayStr}`;

  const [mondayDone, setMondayDone] = useState(() => !!localStorage.getItem(mondayKey));
  const [fridayDone, setFridayDone] = useState(() => !!localStorage.getItem(fridayKey));
  const [checkingFriday, setCheckingFriday] = useState(dia === 5 && !fridayDone);

  const metasStore = useMetasStore();

  // Check if Friday report was already submitted this week
  useEffect(() => {
    if (dia !== 5 || fridayDone) return;

    (async () => {
      const weekStart = startOfWeek(hoje, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(hoje, { weekStartsOn: 1 });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("reports_semanais")
        .select("id")
        .eq("user_id", user.id)
        .eq("semana_inicio", format(weekStart, "yyyy-MM-dd"))
        .maybeSingle();

      if (data) {
        localStorage.setItem(fridayKey, "1");
        setFridayDone(true);
        setCheckingFriday(false);
      } else {
        setCheckingFriday(false);
      }
    })();
  }, [dia, fridayDone, todayStr]);

  // Monday gate: must review goals
  if (dia === 1 && !mondayDone) {
    const hasGoals = metasStore.metasAtivas.length > 0;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-lg mx-auto px-4 py-8 w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-mono text-xl font-bold mb-2">Segunda-feira</h1>
            <p className="text-sm text-muted-foreground font-body">
              Antes de começar, revise suas metas da semana.
            </p>
          </div>

          {hasGoals ? (
            <MondayGoalsReview
              onDismiss={() => {
                localStorage.setItem(mondayKey, "1");
                setMondayDone(true);
              }}
            />
          ) : (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border p-6 text-center">
                <Target className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground font-body mb-4">
                  Você ainda não tem metas configuradas.
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Use a captura rápida para criar metas (ex: "meta de ler 12 livros no ano").
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem(mondayKey, "1");
                  setMondayDone(true);
                }}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90"
              >
                ENTENDI, VAMOS LÁ
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Friday gate: must complete weekly report
  if (dia === 5 && !fridayDone && !checkingFriday) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-lg mx-auto px-4 py-8 w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-mono text-xl font-bold mb-2">Sexta-feira</h1>
            <p className="text-sm text-muted-foreground font-body">
              Antes de continuar, responda o report semanal.
            </p>
          </div>

          <FridayWeeklyReport
            onDismiss={() => {
              localStorage.setItem(fridayKey, "1");
              setFridayDone(true);
            }}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
