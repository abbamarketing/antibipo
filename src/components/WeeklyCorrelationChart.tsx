import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { brasiliaISO } from "@/lib/brasilia";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { TrendingUp } from "lucide-react";

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

export function WeeklyCorrelationChart() {
  const days = useMemo(last7Days, []);
  const from = days[0];
  const to = days[days.length - 1];

  const { data: humorData } = useQuery({
    queryKey: ["weekly-humor", from],
    queryFn: async () => {
      const { data } = await supabase
        .from("registros_humor")
        .select("data, valor")
        .gte("data", from)
        .lte("data", to);
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: taskData } = useQuery({
    queryKey: ["weekly-tasks-done", from],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("feito_em")
        .eq("status", "feito")
        .gte("feito_em", from + "T00:00:00")
        .lte("feito_em", to + "T23:59:59");
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const chartData = useMemo(() => {
    return days.map((day) => {
      const d = new Date(day + "T12:00:00");
      const label = WEEKDAY_SHORT[d.getDay()];

      // Average humor for the day (scale -2 to 2, normalize to 0-4)
      const dayHumor = humorData?.filter((h) => h.data === day) || [];
      const humorAvg = dayHumor.length > 0
        ? dayHumor.reduce((s, h) => s + h.valor, 0) / dayHumor.length
        : null;
      const humorNorm = humorAvg !== null ? humorAvg + 2 : null; // shift to 0-4

      // Count completed tasks
      const doneTasks = taskData?.filter((t) => t.feito_em?.startsWith(day)).length || 0;

      return { day: label, humor: humorNorm, tarefas: doneTasks };
    });
  }, [days, humorData, taskData]);

  const hasData = chartData.some((d) => d.humor !== null || d.tarefas > 0);

  if (!hasData) return null;

  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-mono text-xs font-semibold tracking-wide">HUMOR × TAREFAS — 7 DIAS</h3>
      </div>

      <div className="h-[180px] -ml-2">
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
              yAxisId="tasks"
              orientation="left"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="humor"
              orientation="right"
              domain={[0, 4]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => ["😢", "😕", "😐", "🙂", "😄"][v] || ""}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                fontSize: 12,
                color: "hsl(var(--popover-foreground))",
              }}
              formatter={(value: number, name: string) => {
                if (name === "humor") {
                  const labels = ["Muito ruim", "Ruim", "Neutro", "Bom", "Muito bom"];
                  return [labels[Math.round(value)] || value, "Humor"];
                }
                return [value, "Tarefas"];
              }}
            />
            <Bar
              yAxisId="tasks"
              dataKey="tarefas"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              opacity={0.7}
              barSize={20}
            />
            <Line
              yAxisId="humor"
              dataKey="humor"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--accent))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-mono">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary opacity-70" /> Tarefas
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 rounded bg-accent" /> Humor
        </span>
      </div>
    </div>
  );
}
