import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { brasiliaISO } from "@/lib/brasilia";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Dot,
} from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";

function last7Days(): string[] {
  const days: string[] = [];
  const today = new Date(brasiliaISO() + "T12:00:00");
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

const WEEKDAY_SHORT: Record<number, string> = {
  0: "Dom", 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb",
};

interface DayData {
  day: string;
  date: string;
  humor: number | null;       // 0-100
  humorRaw: number | null;    // -2 to 2
  sono: number | null;        // 0-100
  sonoRaw: number | null;     // 1-3
  meds: number | null;        // 0-100
  medsTaken: number;
  medsTotal: number;
  exercicio: number | null;   // 0-100
  exercicioMin: number;
  tarefas: number;
  dayScore: number | null;    // 0-100
  humorMA: number | null;     // 3-day moving avg
  scoreMA: number | null;     // 3-day moving avg
  riskDay: boolean;           // low mood + no meds
}

function movingAverage(data: (number | null)[], window: number): (number | null)[] {
  return data.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1).filter((v): v is number => v !== null);
    return slice.length >= 2 ? slice.reduce((a, b) => a + b, 0) / slice.length : null;
  });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as DayData;
  if (!d) return null;

  const humorLabels = ["Muito baixo", "Baixo", "Neutro", "Bom", "Muito bom"];
  const sonoLabels = ["", "Ruim", "OK", "Bom"];

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-xs space-y-1.5 min-w-[160px]">
      <p className="font-mono font-semibold text-foreground">{d.day} — {d.date}</p>
      <div className="space-y-1 text-popover-foreground">
        <Row color="hsl(var(--primary))" label="Tarefas" value={`${d.tarefas} concluídas`} />
        <Row color="#f59e0b" label="Humor" value={d.humorRaw !== null ? humorLabels[d.humorRaw + 2] : "Sem registro"} />
        <Row color="#8b5cf6" label="Sono" value={d.sonoRaw !== null ? sonoLabels[d.sonoRaw] : "Sem registro"} />
        <Row color="#22c55e" label="Medicação" value={d.medsTotal > 0 ? `${d.medsTaken}/${d.medsTotal}` : "Sem meds"} />
        <Row color="#06b6d4" label="Exercício" value={d.exercicioMin > 0 ? `${d.exercicioMin} min` : "Nenhum"} />
        {d.dayScore !== null && <Row color="hsl(var(--foreground))" label="DayScore" value={`${d.dayScore}`} />}
      </div>
      {d.riskDay && (
        <div className="flex items-center gap-1 pt-1 border-t border-border/50 text-destructive">
          <AlertTriangle className="w-3 h-3" />
          <span className="font-mono text-[10px]">Humor baixo + sem medicação</span>
        </div>
      )}
    </div>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-mono font-medium">{value}</span>
    </div>
  );
}

function RiskDot(props: any) {
  const { cx, cy, payload } = props;
  if (!payload?.riskDay || cx == null || cy == null) return null;
  return (
    <svg>
      <circle cx={cx} cy={cy} r={6} fill="hsl(var(--destructive))" opacity={0.3} />
      <circle cx={cx} cy={cy} r={3} fill="hsl(var(--destructive))" stroke="hsl(var(--card))" strokeWidth={1.5} />
    </svg>
  );
}

export function WeeklyCorrelationChart() {
  const days = useMemo(last7Days, []);
  const from = days[0];
  const to = days[days.length - 1];

  const { data: humorData } = useQuery({
    queryKey: ["weekly-humor", from],
    queryFn: async () => {
      const { data } = await supabase
        .from("registros_humor").select("data, valor")
        .gte("data", from).lte("data", to);
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: taskData } = useQuery({
    queryKey: ["weekly-tasks-done", from],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks").select("feito_em")
        .eq("status", "feito")
        .gte("feito_em", from + "T00:00:00").lte("feito_em", to + "T23:59:59");
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: sonoData } = useQuery({
    queryKey: ["weekly-sono", from],
    queryFn: async () => {
      const { data } = await supabase
        .from("registros_sono").select("data, qualidade, duracao_min")
        .gte("data", from).lte("data", to);
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: medsData } = useQuery({
    queryKey: ["weekly-meds", from],
    queryFn: async () => {
      const { data } = await supabase
        .from("registros_medicamento").select("data, tomado")
        .gte("data", from).lte("data", to);
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: medsConfig } = useQuery({
    queryKey: ["meds-config"],
    queryFn: async () => {
      const { data } = await supabase.from("medicamentos").select("horarios");
      return data || [];
    },
    staleTime: 10 * 60_000,
  });

  const { data: exerciseData } = useQuery({
    queryKey: ["weekly-exercise", from],
    queryFn: async () => {
      const { data } = await supabase
        .from("bm_exercicios").select("data, duracao_min")
        .gte("data", from).lte("data", to);
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const chartData = useMemo(() => {
    const totalMedSlots = (medsConfig || []).reduce((s, m) => s + (m.horarios?.length || 0), 0);

    // First pass: collect raw values
    const rawDays = days.map((day) => {
      const d = new Date(day + "T12:00:00");
      const label = WEEKDAY_SHORT[d.getDay()];

      // Humor
      const dayHumor = humorData?.filter((h) => h.data === day) || [];
      const humorRaw = dayHumor.length > 0
        ? dayHumor.reduce((s, h) => s + h.valor, 0) / dayHumor.length
        : null;
      const humor = humorRaw !== null ? ((humorRaw + 2) / 4) * 100 : null;

      // Sono
      const daySono = sonoData?.find((s) => s.data === day);
      const sonoRaw = daySono?.qualidade ?? null;
      const sono = sonoRaw !== null ? ((sonoRaw - 1) / 2) * 100 : null;

      // Meds
      const dayMeds = medsData?.filter((m) => m.data === day) || [];
      const medsTaken = dayMeds.filter((m) => m.tomado).length;
      const meds = totalMedSlots > 0 ? Math.round((medsTaken / totalMedSlots) * 100) : null;

      // Exercise
      const dayExercise = exerciseData?.filter((e) => e.data === day) || [];
      const exercicioMin = dayExercise.reduce((s, e) => s + e.duracao_min, 0);

      // Tasks
      const tarefas = taskData?.filter((t) => t.feito_em?.startsWith(day)).length || 0;

      // Risk: low mood + no meds taken
      const riskDay = humorRaw !== null && humorRaw <= -1 && totalMedSlots > 0 && medsTaken === 0;

      return {
        day: label, date: day,
        humor, humorRaw: humorRaw !== null ? Math.round(humorRaw) : null,
        sono, sonoRaw,
        meds, medsTaken, medsTotal: totalMedSlots,
        exercicioMin, exercicio: 0 as number | null, // normalized later
        tarefas, dayScore: null as number | null,
        humorMA: null as number | null,
        scoreMA: null as number | null,
        riskDay,
      };
    });

    // Normalize exercise by max of week
    const maxExercise = Math.max(...rawDays.map((d) => d.exercicioMin), 1);
    rawDays.forEach((d) => {
      d.exercicio = d.exercicioMin > 0 ? Math.round((d.exercicioMin / maxExercise) * 100) : null;
    });

    // Compute simple DayScore per day
    rawDays.forEach((d) => {
      let score = 50;
      if (d.humorRaw !== null) score += d.humorRaw * 10;
      if (d.sonoRaw !== null) score += (d.sonoRaw - 1) * 7.5;
      if (d.meds !== null) score += (d.meds / 100) * 15;
      if (d.exercicioMin > 0) score += 10;
      score += Math.min(d.tarefas * 2, 10);
      d.dayScore = Math.max(0, Math.min(100, Math.round(score)));
    });

    // Moving averages
    const humorValues = rawDays.map((d) => d.humor);
    const scoreValues = rawDays.map((d) => d.dayScore);
    const humorMAs = movingAverage(humorValues, 3);
    const scoreMAs = movingAverage(scoreValues, 3);
    rawDays.forEach((d, i) => {
      d.humorMA = humorMAs[i];
      d.scoreMA = scoreMAs[i];
    });

    return rawDays;
  }, [days, humorData, taskData, sonoData, medsData, medsConfig, exerciseData]);

  const hasData = chartData.some((d) =>
    d.humor !== null || d.tarefas > 0 || d.sono !== null || d.meds !== null || d.exercicioMin > 0
  );

  if (!hasData) return null;

  const hasRiskDays = chartData.some((d) => d.riskDay);

  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-mono text-xs font-semibold tracking-wide">SINAIS DE BEM-ESTAR — 7 DIAS</h3>
      </div>

      <div className="h-[220px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="pct"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              yAxisId="tasks"
              orientation="right"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Bars: tasks */}
            <Bar
              yAxisId="tasks"
              dataKey="tarefas"
              fill="hsl(var(--primary))"
              radius={[3, 3, 0, 0]}
              opacity={0.5}
              barSize={16}
            />

            {/* Lines: all signals normalized to 0-100 */}
            <Line
              yAxisId="pct" dataKey="humor" name="Humor"
              stroke="#f59e0b" strokeWidth={2}
              dot={<RiskDot />}
              connectNulls
            />
            <Line
              yAxisId="pct" dataKey="sono" name="Sono"
              stroke="#8b5cf6" strokeWidth={1.5}
              dot={{ r: 2, fill: "#8b5cf6" }}
              connectNulls
              strokeDasharray="4 2"
            />
            <Line
              yAxisId="pct" dataKey="meds" name="Medicação"
              stroke="#22c55e" strokeWidth={1.5}
              dot={{ r: 2, fill: "#22c55e" }}
              connectNulls
            />
            <Line
              yAxisId="pct" dataKey="exercicio" name="Exercício"
              stroke="#06b6d4" strokeWidth={1.5}
              dot={{ r: 2, fill: "#06b6d4" }}
              connectNulls
              strokeDasharray="2 2"
            />

            {/* Trend lines: 3-day moving average */}
            <Line
              yAxisId="pct" dataKey="humorMA" name="Tendência Humor"
              stroke="#f59e0b" strokeWidth={1} strokeDasharray="6 3"
              dot={false} connectNulls opacity={0.5}
            />
            <Line
              yAxisId="pct" dataKey="scoreMA" name="Tendência Score"
              stroke="hsl(var(--foreground))" strokeWidth={1} strokeDasharray="6 3"
              dot={false} connectNulls opacity={0.4}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground font-mono">
        <LegendItem color="hsl(var(--primary))" label="Tarefas" type="bar" />
        <LegendItem color="#f59e0b" label="Humor" />
        <LegendItem color="#8b5cf6" label="Sono" dashed />
        <LegendItem color="#22c55e" label="Meds" />
        <LegendItem color="#06b6d4" label="Exercício" dashed />
        {hasRiskDays && (
          <span className="flex items-center gap-1 text-destructive">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            Risco
          </span>
        )}
      </div>
    </div>
  );
}

function LegendItem({ color, label, type = "line", dashed = false }: { color: string; label: string; type?: "line" | "bar"; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1">
      {type === "bar" ? (
        <span className="w-2.5 h-2.5 rounded-sm opacity-60" style={{ backgroundColor: color }} />
      ) : (
        <span
          className="w-4 h-0.5 rounded"
          style={{
            backgroundColor: color,
            ...(dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 3px, transparent 3px, transparent 6px)`, backgroundColor: "transparent" } : {}),
          }}
        />
      )}
      {label}
    </span>
  );
}
