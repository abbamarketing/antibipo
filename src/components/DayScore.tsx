/**
 * DayScore — Circular gauge with cross-module summary.
 */
import { useDayContext, type DayAlert, type DayMood } from "@/hooks/use-day-context";
import {
  Activity, Pill, Moon, Dumbbell, CheckCircle2,
  AlertTriangle, AlertCircle, Sun, Sparkles, ChevronDown, ChevronRight,
  Angry, Frown, Meh, Smile, Laugh,
} from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const ALERT_STYLES: Record<DayAlert, { bg: string; text: string; icon: typeof AlertTriangle; label: string; gaugeColor: string }> = {
  crise: { bg: "bg-destructive/10", text: "text-destructive", icon: AlertCircle, label: "CRISE", gaugeColor: "hsl(var(--destructive))" },
  atencao: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", icon: AlertTriangle, label: "ATENÇÃO", gaugeColor: "#f59e0b" },
  estavel: { bg: "bg-primary/5", text: "text-primary", icon: Sun, label: "ESTÁVEL", gaugeColor: "hsl(var(--primary))" },
  otimo: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", icon: Sparkles, label: "ÓTIMO", gaugeColor: "#22c55e" },
};

const MOOD_ICONS: Record<DayMood, { icon: typeof Meh; color: string }> = {
  muito_baixo: { icon: Angry, color: "text-destructive" },
  baixo: { icon: Frown, color: "text-orange-400" },
  neutro: { icon: Meh, color: "text-muted-foreground" },
  bom: { icon: Smile, color: "text-primary" },
  muito_bom: { icon: Laugh, color: "text-green-500" },
};

function CircularGauge({ score, alertLevel, moodLabel, size = 120 }: { score: number; alertLevel: DayAlert; moodLabel: DayMood; size?: number }) {
  const style = ALERT_STYLES[alertLevel];
  const moodCfg = MOOD_ICONS[moodLabel];
  const MoodIcon = moodCfg.icon;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const progress = (score / 100) * arcLength;
  const dashOffset = arcLength - progress;
  const rotation = 135;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--border) / 0.4)"
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={style.gaugeColor}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-mono text-3xl font-bold ${style.text}`}>{score}</span>
      </div>
    </div>
  );
}

export function DayScore() {
  const ctx = useDayContext();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const alertStyle = ALERT_STYLES[ctx.alertLevel];
  const moodCfg = MOOD_ICONS[ctx.moodLabel];
  const MoodIcon = moodCfg.icon;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Alert bar */}
      <div className={`rounded-lg p-3 ${alertStyle.bg}`}>
        <div className="flex items-center gap-2">
          {(() => { const I = alertStyle.icon; return <I className={`w-4 h-4 shrink-0 ${alertStyle.text}`} />; })()}
          <p className={`text-xs font-body ${alertStyle.text}`}>{ctx.alertMessage}</p>
        </div>
      </div>

      {/* Gauge + modules summary */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full rounded-xl p-4 text-left transition-all duration-200 hover:bg-secondary/20 active:scale-[0.99]"
      >
        {isMobile ? (
          /* ── Mobile: stacked layout ── */
          <div className="space-y-4">
            {/* Row 1: Gauge centered + tasks done */}
            <div className="flex items-center justify-center gap-6">
              <CircularGauge score={ctx.dayScore} alertLevel={ctx.alertLevel} moodLabel={ctx.moodLabel} size={100} />
              <div className="flex flex-col items-center gap-1">
                <CheckCircle2 className={`w-5 h-5 ${ctx.tasksCompletedToday > 0 ? "text-primary" : "text-muted-foreground/30"}`} />
                <span className="text-lg font-mono font-bold">{ctx.tasksCompletedToday}</span>
                <span className="text-[10px] font-mono text-muted-foreground/60">feitas</span>
              </div>
            </div>

            {/* Row 2: Module indicators — 2x2 grid */}
            <div className="grid grid-cols-2 gap-2">
              <ModuleIndicator
                icon={<MoodIcon className={`w-4 h-4 ${moodCfg.color}`} />}
                label="Humor"
                value={ctx.moodLabel === "neutro" ? "—" : ctx.moodLabel.replace("_", " ")}
              />
              <ModuleIndicator
                icon={<Pill className={`w-4 h-4 ${ctx.medsAdherence >= 100 ? "text-green-500" : ctx.medsAdherence > 0 ? "text-amber-500" : "text-muted-foreground"}`} />}
                label="Remédios"
                value={`${ctx.medsTaken}/${ctx.medsTotal}`}
              />
              <ModuleIndicator
                icon={<Moon className={`w-4 h-4 ${ctx.sleepQuality === 3 ? "text-green-500" : ctx.sleepQuality === 2 ? "text-amber-500" : ctx.sleepQuality === 1 ? "text-destructive" : "text-muted-foreground/30"}`} />}
                label="Sono"
                value={ctx.sleepHours ? `${ctx.sleepHours.toFixed(0)}h` : "—"}
              />
              <ModuleIndicator
                icon={<Dumbbell className={`w-4 h-4 ${ctx.exerciseDone ? "text-green-500" : "text-muted-foreground/30"}`} />}
                label="Exercício"
                value={ctx.exerciseDone ? `${ctx.exerciseMinutes}m` : "—"}
              />
            </div>

            {/* Expand hint */}
            <div className="flex items-center justify-center">
              {expanded
                ? <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
                : <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              }
            </div>
          </div>
        ) : (
          /* ── Desktop: horizontal layout ── */
          <div className="flex items-center gap-4">
            <CircularGauge score={ctx.dayScore} alertLevel={ctx.alertLevel} moodLabel={ctx.moodLabel} />

            <div className="flex-1 grid grid-cols-2 gap-2">
              <ModuleIndicator
                icon={<MoodIcon className={`w-4 h-4 ${moodCfg.color}`} />}
                label="Humor"
                value={ctx.moodLabel === "neutro" ? "—" : ctx.moodLabel.replace("_", " ")}
              />
              <ModuleIndicator
                icon={<Pill className={`w-4 h-4 ${ctx.medsAdherence >= 100 ? "text-green-500" : ctx.medsAdherence > 0 ? "text-amber-500" : "text-muted-foreground"}`} />}
                label="Remédios"
                value={`${ctx.medsTaken}/${ctx.medsTotal}`}
              />
              <ModuleIndicator
                icon={<Moon className={`w-4 h-4 ${ctx.sleepQuality === 3 ? "text-green-500" : ctx.sleepQuality === 2 ? "text-amber-500" : ctx.sleepQuality === 1 ? "text-destructive" : "text-muted-foreground/30"}`} />}
                label="Sono"
                value={ctx.sleepHours ? `${ctx.sleepHours.toFixed(0)}h` : "—"}
              />
              <ModuleIndicator
                icon={<Dumbbell className={`w-4 h-4 ${ctx.exerciseDone ? "text-green-500" : "text-muted-foreground/30"}`} />}
                label="Exercício"
                value={ctx.exerciseDone ? `${ctx.exerciseMinutes}m` : "—"}
              />
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-col items-center">
                <CheckCircle2 className={`w-4 h-4 ${ctx.tasksCompletedToday > 0 ? "text-primary" : "text-muted-foreground/30"}`} />
                <span className="text-xs font-mono font-bold mt-0.5">{ctx.tasksCompletedToday}</span>
                <span className="text-[10px] font-mono text-muted-foreground/60">feitas</span>
              </div>
              {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground/40" /> : <ChevronRight className="w-4 h-4 text-muted-foreground/40" />}
            </div>
          </div>
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-2 pl-1 animate-fade-in">
          {ctx.suggestedActions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">Sugestões</span>
              {ctx.suggestedActions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 bg-secondary/30 rounded-lg px-3 py-2">
                  <Activity className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <span className="text-xs font-body text-foreground/70">{s}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1">
            <MiniStat label="Pendentes" value={ctx.tasksPending} />
            <MiniStat label="Atrasadas" value={ctx.tasksOverdue} alert={ctx.tasksOverdue > 0} />
            <MiniStat label="Limite hoje" value={ctx.taskLimit} />
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleIndicator({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-secondary/30 rounded-lg px-3 py-2.5 min-h-[44px]">
      {icon}
      <div className="min-w-0">
        <p className="text-[10px] font-mono text-muted-foreground/60 uppercase leading-none">{label}</p>
        <p className="text-xs font-mono font-medium truncate capitalize mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="bg-secondary/20 rounded-lg p-2.5 text-center">
      <p className={`font-mono text-sm font-bold ${alert ? "text-destructive" : "text-foreground"}`}>{value}</p>
      <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">{label}</p>
    </div>
  );
}
