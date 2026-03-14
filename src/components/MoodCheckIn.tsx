import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDayContext } from "@/hooks/use-day-context";
import { logActivity } from "@/lib/activity-log";
import { Angry, Frown, Meh, Smile, Laugh, X, Bell, CheckCircle2 } from "lucide-react";

const CHECKIN_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours
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

export function MoodCheckIn({ onMoodUpdated }: MoodCheckInProps) {
  const [showCheckin, setShowCheckin] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const dayCtx = useDayContext();
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
          const serverDate = new Date((data.valor as any).timestamp || 0).getTime();
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

      if (lastCheckin === 0 || Date.now() - lastCheckin >= CHECKIN_INTERVAL_MS) {
        setShowCheckin(true);
      }
    };

    checkIfDue();
    const interval = setInterval(checkIfDue, 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

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

  const handleSelect = async (valor: number) => {
    setSelected(valor);
    await persistCheckinTimestamp();

    const today = new Date().toISOString().split("T")[0];
    const hora = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

    try {
      await supabase.from("registros_humor").upsert(
        { data: today, valor, notas: `Check-in ${hora}` },
        { onConflict: "data" }
      );
      logActivity("mood_checkin", { valor, hora, automatico: true });
      onMoodUpdated?.(valor);
    } catch (e) {
      console.error("Mood check-in error:", e);
    }

    setTimeout(() => {
      setShowCheckin(false);
      setSelected(null);
    }, 1500);
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
      <div className="flex justify-between">
        {moodOptions.map((m) => {
          const Icon = m.icon;
          const isSelected = selected === m.val;
          return (
            <button
              key={m.val}
              onClick={() => handleSelect(m.val)}
              disabled={selected !== null}
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
      {selected !== null && (
        <div className="flex items-center justify-center gap-1 mt-2 animate-fade-in">
          <CheckCircle2 className="w-3 h-3 text-primary" />
          <p className="text-[10px] text-primary font-mono">Registrado. Tarefas ajustadas.</p>
        </div>
      )}
    </div>
  );
}
