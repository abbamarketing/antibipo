import { useMemo } from "react";
import { useFlowStore, today } from "@/lib/store";
import { useCasaStore } from "@/lib/casa-store";
import { useTrackerStore } from "@/lib/tracker-store";
import { BarChart3, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock } from "lucide-react";

interface ModuleDashboardProps {
  modulo?: string; // if omitted, show all
}

export function ModuleDashboard({ modulo }: ModuleDashboardProps) {
  const { state } = useFlowStore();
  const casa = useCasaStore();
  const { trackers, registros } = useTrackerStore();

  const stats = useMemo(() => {
    const todayStr = today();
    const last7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]);
    }

    // Tasks stats
    const relevantTasks = modulo
      ? state.tasks.filter((t) => t.modulo === modulo)
      : state.tasks;

    const completedToday = relevantTasks.filter(
      (t) => t.status === "feito" && t.feito_em?.startsWith(todayStr)
    ).length;

    const completedWeek = relevantTasks.filter(
      (t) => t.status === "feito" && t.feito_em && last7Days.some((d) => t.feito_em!.startsWith(d))
    ).length;

    const pending = relevantTasks.filter(
      (t) => t.status !== "feito" && t.status !== "descartado"
    ).length;

    const overdue = relevantTasks.filter(
      (t) => t.data_limite && t.data_limite < todayStr && t.status !== "feito" && t.status !== "descartado"
    ).length;

    // Tracker stats
    const relevantTrackers = modulo
      ? trackers.filter((t) => t.modulo === modulo)
      : trackers;

    const trackersCompleted = registros.filter(
      (r) => r.data === todayStr && relevantTrackers.some((t) => t.id === r.tracker_id)
    ).length;

    const trackersTotal = relevantTrackers.length;

    // Completion rate (last 7 days)
    const weekTasks = relevantTasks.filter(
      (t) => last7Days.some((d) => t.criado_em.startsWith(d))
    );
    const weekCompleted = weekTasks.filter((t) => t.status === "feito").length;
    const completionRate = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0;

    // Daily completion trend (simple: today vs yesterday)
    const yesterday = last7Days[1];
    const completedYesterday = relevantTasks.filter(
      (t) => t.status === "feito" && t.feito_em?.startsWith(yesterday)
    ).length;
    const trend = completedToday - completedYesterday;

    return {
      completedToday,
      completedWeek,
      pending,
      overdue,
      trackersCompleted,
      trackersTotal,
      completionRate,
      trend,
    };
  }, [state.tasks, trackers, registros, modulo]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
        <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Dashboard {modulo ? `· ${modulo}` : "· Geral"}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Feitas hoje"
          value={stats.completedToday}
          icon={<CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
          trend={stats.trend}
        />
        <StatCard
          label="Pendentes"
          value={stats.pending}
          icon={<Clock className="w-3.5 h-3.5 text-muted-foreground" />}
        />
        <StatCard
          label="Semana"
          value={stats.completedWeek}
          icon={<TrendingUp className="w-3.5 h-3.5 text-primary" />}
          suffix="feitas"
        />
        <StatCard
          label="Taxa"
          value={stats.completionRate}
          icon={<BarChart3 className="w-3.5 h-3.5 text-primary" />}
          suffix="%"
        />
      </div>

      {stats.overdue > 0 && (
        <div className="bg-destructive/10 rounded-lg p-3 flex items-center gap-2">
          <XCircle className="w-3.5 h-3.5 text-destructive" />
          <span className="text-xs font-mono text-destructive">
            {stats.overdue} tarefa{stats.overdue > 1 ? "s" : ""} atrasada{stats.overdue > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {stats.trackersTotal > 0 && (
        <div className="bg-card rounded-lg border p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Trackers hoje</span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {stats.trackersCompleted}/{stats.trackersTotal}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${stats.trackersTotal > 0 ? (stats.trackersCompleted / stats.trackersTotal) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
  suffix,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  suffix?: string;
}) {
  return (
    <div className="bg-card rounded-lg border p-3">
      <div className="flex items-center justify-between mb-1">
        {icon}
        {trend !== undefined && trend !== 0 && (
          <span className={`text-[9px] font-mono flex items-center gap-0.5 ${trend > 0 ? "text-primary" : "text-destructive"}`}>
            {trend > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {trend > 0 ? "+" : ""}{trend}
          </span>
        )}
      </div>
      <p className="font-mono text-lg font-bold">
        {value}{suffix && <span className="text-[10px] text-muted-foreground ml-0.5">{suffix}</span>}
      </p>
      <p className="text-[9px] font-mono text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
