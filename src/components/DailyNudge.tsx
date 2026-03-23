import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFlowStore } from "@/lib/store";
import { useDayContext } from "@/hooks/use-day-context";
import { trackAIProvider } from "@/lib/ai-stats";
import { logActivity } from "@/lib/activity-log";
import { brasiliaTimeString } from "@/lib/brasilia";
import { Mic, MicOff, Loader2, AlertTriangle, TrendingUp } from "lucide-react";

/* ── Context-aware nudge alerts ── */
function useContextAlerts(): string[] {
  const dayCtx = useDayContext();
  const alerts: string[] = [];

  // Sleep alert: less than 6 hours
  if (dayCtx.sleepHours !== null && dayCtx.sleepHours < 6) {
    alerts.push("Sono curto (< 6h) — reduza o ritmo hoje.");
  }

  // DayScore trending up — fetch last 3 days from activity log
  const { data: recentScores } = useQuery({
    queryKey: ["day-score-trend"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_log")
        .select("detalhes, criado_em")
        .eq("acao", "analise_dia")
        .order("criado_em", { ascending: false })
        .limit(3);
      return (data || [])
        .map((r) => {
          const d = r.detalhes as Record<string, unknown> | null;
          return typeof d?.dayScore === "number" ? d.dayScore : null;
        })
        .filter((v): v is number => v !== null);
    },
    staleTime: 30 * 60 * 1000,
  });

  if (recentScores && recentScores.length >= 3) {
    const [newest, mid, oldest] = recentScores;
    if (newest > mid && mid > oldest) {
      alerts.push("DayScore subindo há 3 dias — mantenha a rotina estável, evite novos projetos hoje.");
    }
  }

  return alerts;
}

/* ── Voice Quick Capture (Web Speech API) ── */
function VoiceCapture() {
  const { addTask } = useFlowStore();
  const dayCtx = useDayContext();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setTranscript(result);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTranscript("");
  }, [isSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const saveAsTask = useCallback(async () => {
    if (!transcript.trim()) return;
    setSaving(true);
    try {
      await addTask({
        titulo: transcript.trim(),
        modulo: "trabalho",
        urgencia: dayCtx.energy === "basico" ? 1 : 2,
        status: "backlog",
        impacto: 2,
        tempo_min: 15,
        tipo: "operacional",
        dono: "eu",
        estado_ideal: "qualquer",
        recorrente: false,
      }, {
        mood: dayCtx.moodLabel,
        energy: dayCtx.energy || undefined,
        alertLevel: dayCtx.alertLevel,
        dayScore: dayCtx.dayScore,
      });
      logActivity("captura_rapida", { titulo: transcript.trim(), via: "voz", hora: brasiliaTimeString() });
      setTranscript("");
    } finally {
      setSaving(false);
    }
  }, [transcript, addTask, dayCtx]);

  // Auto-save when recognition ends and there's text
  useEffect(() => {
    if (!listening && transcript.trim()) {
      // Small delay so user can see the transcript
      const t = setTimeout(() => saveAsTask(), 800);
      return () => clearTimeout(t);
    }
  }, [listening, transcript, saveAsTask]);

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={listening ? stopListening : startListening}
        disabled={saving}
        className={`p-1.5 rounded-lg transition-all duration-200 active:scale-90 ${
          listening
            ? "bg-destructive/15 text-destructive animate-pulse"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
        }`}
        title={listening ? "Parar gravação" : "Capturar tarefa por voz"}
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : listening ? (
          <MicOff className="w-3.5 h-3.5" />
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
      </button>
      {(listening || transcript) && (
        <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px] animate-fade-in">
          {listening ? (transcript || "Ouvindo...") : saving ? "Salvando..." : transcript}
        </span>
      )}
    </div>
  );
}

/* ── Main DailyNudge Component ── */
export function DailyNudge() {
  const contextAlerts = useContextAlerts();

  const dayCtx = useDayContext();

  const { data } = useQuery({
    queryKey: ["daily-nudge"],
    queryFn: async () => {
      const orch = dayCtx.orchestration;
      const { data, error } = await supabase.functions.invoke("daily-nudge", {
        body: {
          orchestration_context: orch ? {
            nudge_tone: orch.nudge_tone,
            nudge_focus: orch.nudge_focus,
            nudge_factual_base: orch.nudge_factual_base,
            meds_as_anchor: orch.meds_as_anchor,
            depressive_precursor: orch.depressive_precursor,
            manic_precursor: orch.manic_precursor,
          } : null,
        },
      });
      if (error) throw error;
      if (data?.ai_provider) trackAIProvider(data.ai_provider);
      return data as { message: string };
    },
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const hasAlerts = contextAlerts.length > 0;
  const hasNudge = !!data?.message;

  if (!hasAlerts && !hasNudge) {
    return <VoiceCapture />;
  }

  return (
    <div className="space-y-1.5">
      {/* Context alerts */}
      {contextAlerts.map((alert, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl bg-secondary/60 px-3 py-2 animate-fade-in">
          {alert.includes("DayScore") ? (
            <TrendingUp className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          )}
          <p className="font-mono text-[11px] leading-relaxed text-foreground/80">{alert}</p>
        </div>
      ))}

      {/* AI nudge + voice capture */}
      <div className="flex items-center justify-between gap-2">
        {hasNudge && (
          <p className="font-mono text-[11px] leading-relaxed text-foreground/80 flex-1 line-clamp-2 md:line-clamp-none">
            {data.message}
          </p>
        )}
        <VoiceCapture />
      </div>
    </div>
  );
}
