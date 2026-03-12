/**
 * DayScore — Integrated cross-module summary.
 * Uses only Lucide icons — no emojis per design system.
 */
import { useDayContext, type DayAlert, type DayMood } from "@/hooks/use-day-context";
import {
  Activity, Pill, Moon, Dumbbell, CheckCircle2,
  AlertTriangle, AlertCircle, Sun, Sparkles, ChevronDown, ChevronRight,
  Angry, Frown, Meh, Smile, Laugh, Clock,
} from "lucide-react";
import { useState } from "react";

const ALERT_STYLES: Record<DayAlert, { bg: string; text: string; icon: typeof AlertTriangle }> = {
  crise: { bg: "bg-destructive/10 border-destructive/30", text: "text-destructive", icon: AlertCircle },
  atencao: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-600 dark:text-amber-400", icon: AlertTriangle },
  estavel: { bg: "bg-primary/5 border-primary/20", text: "text-primary", icon: Sun },
  otimo: { bg: "bg-green-500/10 border-green-500/30", text: "text-green-600 dark:text-green-400", icon: Sparkles },
};

const MOOD_ICONS: Record<DayMood, { icon: typeof Meh; color: string }> = {
  muito_baixo: { icon: Angry, color: "text-destructive" },
  baixo: { icon: Frown, color: "text-orange-400" },
  neutro: { icon: Meh, color: "text-muted-foreground" },
  bom: { icon: Smile, color: "text-primary" },
  muito_bom: { icon: Laugh, color: "text-green-500" },
};

const SCORE_COLOR = (score: number) => {
  if (score < 30) return "text-destructive";
  if (score < 50) return "text-amber-500";
  if (score < 75) return "text-primary";
  return "text-green-500";
};

const SCORE_BG = (score: number) => {
  if (score < 30) return "bg-destructive";
  if (score < 50) return "bg-amber-500";
  if (score < 75) return "bg-primary";
  return "bg-green-500";
};

export function DayScore() {
  const ctx = useDayContext();
  const [expanded, setExpanded] = useState(false);
  const alertStyle = ALERT_STYLES[ctx.alertLevel];
  const AlertIcon = alertStyle.icon;
  const moodCfg = MOOD_ICONS[ctx.moodLabel];
  const MoodIcon = moodCfg.icon;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Alert bar */}
      <div className={`rounded-lg border p-3 ${alertStyle.bg}`}>
        <div className="flex items-center gap-2">
          <AlertIcon className={`w-4 h-4 shrink-0 ${alertStyle.text}`} />
          <p className={`text-xs font-body ${alertStyle.text}`}>{ctx.alertMessage}</p>
        </div>
      </div>

      {/* Score + modules summary */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-card rounded-lg border p-4 text-left transition-all hover:border-primary/30 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`text-2xl font-mono font-bold ${SCORE_COLOR(ctx.dayScore)}`}>
                {ctx.dayScore}
              </div>
              <div className="text-[8px] font-mono text-muted-foreground text-center">SCORE</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
              {/* Mood */}
              <div className="flex flex-col items-center min-w-[28px]">
                <MoodIcon className={`w-4 h-4 ${moodCfg.color}`} />
                <span className="text-[7px] font-mono text-muted-foreground mt-0.5">HUMOR</span>
              </div>
              {/* Meds */}
              <div className="flex flex-col items-center min-w-[28px]">
                <Pill className={`w-4 h-4 ${ctx.medsAdherence >= 100 ? "text-green-500" : ctx.medsAdherence > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
                <span className="text-[7px] font-mono text-muted-foreground mt-0.5">
                  {ctx.medsTaken}/{ctx.medsTotal}
                </span>
              </div>
              {/* Sleep */}
              <div className="flex flex-col items-center min-w-[28px]">
                <Moon className={`w-4 h-4 ${ctx.sleepQuality === 3 ? "text-green-500" : ctx.sleepQuality === 2 ? "text-amber-500" : ctx.sleepQuality === 1 ? "text-destructive" : "text-muted-foreground/30"}`} />
                <span className="text-[7px] font-mono text-muted-foreground mt-0.5">
                  {ctx.sleepHours ? `${ctx.sleepHours.toFixed(0)}h` : "—"}
                </span>
              </div>
              {/* Exercise */}
              <div className="flex flex-col items-center min-w-[28px]">
                <Dumbbell className={`w-4 h-4 ${ctx.exerciseDone ? "text-green-500" : "text-muted-foreground/30"}`} />
                <span className="text-[7px] font-mono text-muted-foreground mt-0.5">
                  {ctx.exerciseDone ? `${ctx.exerciseMinutes}m` : "—"}
                </span>
              </div>
              {/* Tasks */}
              <div className="flex flex-col items-center min-w-[28px]">
                <CheckCircle2 className={`w-4 h-4 ${ctx.tasksCompletedToday > 0 ? "text-primary" : "text-muted-foreground/30"}`} />
                <span className="text-[7px] font-mono text-muted-foreground mt-0.5">
                  {ctx.tasksCompletedToday}
                </span>
              </div>
            </div>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full bg-secondary rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${SCORE_BG(ctx.dayScore)}`}
            style={{ width: `${ctx.dayScore}%` }}
          />
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-2 pl-1 animate-fade-in">
          {ctx.suggestedActions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Sugestões</span>
              {ctx.suggestedActions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 bg-secondary/50 rounded-md px-3 py-2">
                  <Activity className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <span className="text-xs font-body text-foreground/80">{s}</span>
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

function MiniStat({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="bg-card rounded-md border p-2 text-center">
      <p className={`font-mono text-sm font-bold ${alert ? "text-destructive" : "text-foreground"}`}>{value}</p>
      <p className="text-[8px] font-mono text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
