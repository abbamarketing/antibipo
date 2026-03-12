import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-log";
import { Angry, Frown, Meh, Smile, Laugh, X, Bell } from "lucide-react";

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

  useEffect(() => {
    const checkIfDue = () => {
      const last = localStorage.getItem(STORAGE_KEY);
      if (!last) {
        setShowCheckin(true);
        return;
      }
      const elapsed = Date.now() - parseInt(last, 10);
      if (elapsed >= CHECKIN_INTERVAL_MS) {
        setShowCheckin(true);
      }
    };

    checkIfDue();
    const interval = setInterval(checkIfDue, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, []);

  const handleSelect = async (valor: number) => {
    setSelected(valor);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());

    const today = new Date().toISOString().split("T")[0];
    const hora = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

    try {
      // Upsert mood
      await supabase.from("registros_humor").upsert(
        { data: today, valor, notas: `Check-in ${hora}` },
        { onConflict: "data" }
      );
      logActivity("mood_checkin", { valor, hora, automatico: true });
      onMoodUpdated?.(valor);
    } catch (e) {
      console.error("Mood check-in error:", e);
    }

    // Auto-dismiss after 1.5s
    setTimeout(() => {
      setShowCheckin(false);
      setSelected(null);
    }, 1500);
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setShowCheckin(false);
  };

  if (!showCheckin) return null;

  return (
    <div className="bg-card rounded-lg border border-primary/20 p-4 mb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-xs font-bold tracking-wider">CHECK-IN EMOCIONAL</span>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground font-body mb-3">
        Como você está se sentindo agora?
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
              className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all ${
                isSelected
                  ? "bg-primary/10 ring-1 ring-primary scale-110"
                  : selected !== null
                  ? "opacity-30"
                  : "hover:bg-secondary"
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
