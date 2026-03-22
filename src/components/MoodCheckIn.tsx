import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDayContext } from "@/hooks/use-day-context";
import { useFlowStore, today } from "@/lib/store";
import { logActivity } from "@/lib/activity-log";
import { Angry, Frown, Meh, Smile, Laugh, X, Bell, CheckCircle2, ThumbsUp, Minus, ThumbsDown } from "lucide-react";

// Adaptive check-in interval based on energy state:
// basico: 6h (less interruption when low energy)
// modo_leve: 4h
// foco_total: 3h (more frequent tracking when highly active)
// no energy set: 4h (safe default)
const ENERGY_INTERVAL_HOURS: Record<string, number> = {
  basico: 6,
  modo_leve: 4,
  foco_total: 3,
};
const DEFAULT_INTERVAL_HOURS = 4;
const STORAGE_KEY = "last_mood_checkin";

const moodOptions = [
  { val: -2, label: "Muito baixo", icon: Angry, color: "text-destructive" },
  { val: -1, label: "Baixo", icon: Frown, color: "text-orange-400" },
  { val: 0, label: "Neutro", icon: Meh, color: "text-muted-foreground" },
  { val: 1, label: "Bom", icon: Smile, color: "text-primary" },
  { val: 2, label: "Muito bom", icon: Laugh, color: "text-green-500" },
];

interface MoodCheckInProps {
  onMoodUpdated?: (valor: number) => void;
}

type MedEffectiveness = "bem" | "normal" | "sem_efeito";

export function MoodCheckIn({ onMoodUpdated }: MoodCheckInProps) {
  const [showCheckin, setShowCheckin] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [showMedFollowUp, setShowMedFollowUp] = useState(false);
  const [medEffectiveness, setMedEffectiveness] = useState<MedEffectiveness | null>(null);
  const dayCtx = useDayContext();
  const { state } = useFlowStore();
  const noMoodYet = dayCtx.moodValue === null;

  useEffect(() => {
    let cancelled = false;

    const checkIfDue = async () => {
      // 1. Get local timestamp
      const localLast = localStorage.getItem(STORAGE_KEY);
      const localTs = localLast ? parseInt(localLast, 10) : 0;

      // 2. Get server timestamp (source of truth for cross-device)
      let serverTs = 0;
      try {
        const { data } = await supabase
          .from("configuracoes")
          .select("valor")
          .eq("chave", "ultimo_mood_checkin")
          .maybeSingle();
        if (data?.valor) {
          const valor = data.valor as Record<string, string> | null;
          const serverDate = new Date(valor?.timestamp || 0).getTime();
          if (!isNaN(serverDate)) serverTs = serverDate;
        }
      } catch {
        // offline — use localStorage only
      }

      if (cancelled) return;

      // Use whichever is more recent
      const lastCheckin = Math.max(localTs, serverTs);

      // Sync localStorage if server is newer
      if (serverTs > localTs) {
        localStorage.setItem(STORAGE_KEY, serverTs.toString());
      }

      // Adaptive interval based on current energy state
      const intervalHours = dayCtx.energy
        ? (ENERGY_INTERVAL_HOURS[dayCtx.energy] ?? DEFAULT_INTERVAL_HOURS)
        : DEFAULT_INTERVAL_HOURS;
      const intervalMs = intervalHours * 60 * 60 * 1000;

      if (lastCheckin === 0 || Date.now() - lastCheckin >= intervalMs) {
        setShowCheckin(true);
      }
    };

    checkIfDue();
    const interval = setInterval(checkIfDue, 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [dayCtx.energy]);

  const persistCheckinTimestamp = async () => {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, now.toString());
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("configuracoes").upsert(
          {
            user_id: user.id,
            chave: "ultimo_mood_checkin",
            valor: { timestamp: new Date(now).toISOString() },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,chave" }
        );
      }
    } catch {
      // offline — localStorage is enough
    }
  };

  const checkRecentMeds = (): boolean => {
    const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
    return state.registros_medicamento.some((r) => {
      if (!r.tomado || r.data !== today()) return false;
      if (!r.horario_tomado) return false;
      return new Date(r.horario_tomado).getTime() >= fourHoursAgo;
    });
  };

  const saveMedEffectiveness = async (effectiveness: MedEffectiveness) => {
    setMedEffectiveness(effectiveness);
    try {
      const todayStr = today();
      const hora = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
      await supabase.from("registros_humor").update(
        { notas: `Check-in ${hora} | med_effectiveness: ${effectiveness}` }
      ).eq("data", todayStr);
      logActivity("mood_checkin", { med_effectiveness: effectiveness, hora });
    } catch (e) {
      console.error("Med effectiveness save error:", e);
    }
    setTimeout(() => {
      setShowCheckin(false);
      setSelected(null);
      setShowMedFollowUp(false);
      setMedEffectiveness(null);
    }, 1200);
  };

  const handleSelect = async (valor: number) => {
    setSelected(valor);
    await persistCheckinTimestamp();

    const todayStr = today();
    const hora = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

    try {
      await supabase.from("registros_humor").upsert(
        { data: todayStr, valor, notas: `Check-in ${hora}` },
        { onConflict: "data" }
      );
      logActivity("mood_checkin", { valor, hora, automatico: true });
      onMoodUpdated?.(valor);
    } catch (e) {
      console.error("Mood check-in error:", e);
    }

    // Check if any medication was taken in the last 4 hours
    if (checkRecentMeds()) {
      setTimeout(() => setShowMedFollowUp(true), 800);
    } else {
      setTimeout(() => {
        setShowCheckin(false);
        setSelected(null);
      }, 1500);
    }
  };

  const dismiss = () => {
    persistCheckinTimestamp();
    setShowCheckin(false);
  };

  if (!showCheckin) return null;

  // Contextual empty-state message
  const contextHint = noMoodYet
    ? dayCtx.contextMessage || "Registre como está se sentindo para personalizar seu dia."
    : "Como você está agora?";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Check-in emocional"
      className={`rounded-xl p-4 mb-4 animate-fade-in transition-all duration-300 ${
        noMoodYet
          ? "bg-card/60 backdrop-blur-sm border border-primary/30 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.25)]"
          : "bg-card/40 backdrop-blur-sm border border-border/40"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className={`w-3.5 h-3.5 ${noMoodYet ? "text-primary animate-pulse" : "text-primary"}`} />
          <span className="font-mono text-xs font-bold tracking-wider">CHECK-IN EMOCIONAL</span>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground font-body mb-3">
        {contextHint}
      </p>
      <div className="flex justify-between" role="radiogroup" aria-label="Como você está se sentindo">
        {moodOptions.map((m) => {
          const Icon = m.icon;
          const isSelected = selected === m.val;
          return (
            <button
              key={m.val}
              onClick={() => handleSelect(m.val)}
              disabled={selected !== null}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Humor: ${m.label}`}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                isSelected
                  ? "bg-primary/10 ring-1 ring-primary scale-110"
                  : selected !== null
                  ? "opacity-30"
                  : "hover:bg-secondary/60 active:scale-95"
              }`}
            >
              <Icon className={`w-6 h-6 ${isSelected ? "text-primary" : m.color}`} />
              <span className="font-mono text-[8px] text-muted-foreground">{m.label}</span>
            </button>
          );
        })}
      </div>
      {selected !== null && !showMedFollowUp && (
        <div className="flex items-center justify-center gap-1 mt-2 animate-fade-in">
          <CheckCircle2 className="w-3 h-3 text-primary" />
          <p className="text-[10px] text-primary font-mono">Registrado. Tarefas ajustadas.</p>
        </div>
      )}
      {showMedFollowUp && medEffectiveness === null && (
        <div className="mt-3 pt-3 border-t border-border/30 animate-fade-in">
          <p className="text-xs text-muted-foreground font-body mb-2">
            Como os remedios estao funcionando?
          </p>
          <div className="flex gap-2">
            {([
              { val: "bem" as MedEffectiveness, label: "Bem", Icon: ThumbsUp, color: "text-green-500" },
              { val: "normal" as MedEffectiveness, label: "Normal", Icon: Minus, color: "text-muted-foreground" },
              { val: "sem_efeito" as MedEffectiveness, label: "Sem efeito", Icon: ThumbsDown, color: "text-orange-400" },
            ]).map(({ val, label, Icon, color }) => (
              <button
                key={val}
                onClick={() => saveMedEffectiveness(val)}
                className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-secondary/60 active:scale-95 transition-all"
              >
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="font-mono text-[8px] text-muted-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {medEffectiveness !== null && (
        <div className="flex items-center justify-center gap-1 mt-2 animate-fade-in">
          <CheckCircle2 className="w-3 h-3 text-primary" />
          <p className="text-[10px] text-primary font-mono">Eficacia registrada.</p>
        </div>
      )}
    </div>
  );
}
