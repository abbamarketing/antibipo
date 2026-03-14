import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFlowStore } from "@/lib/store";
import { useCasaStore } from "@/lib/casa-store";
import { useDayContext } from "@/hooks/use-day-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { brasiliaISO } from "@/lib/brasilia";
import {
  Briefcase, Home, Heart, Target, Wallet, CalendarDays,
  ChevronRight, CheckCircle2,
} from "lucide-react";

interface ModuleSnippet {
  key: string;
  label: string;
  icon: typeof Briefcase;
  task: string | null;
  meta?: string;
  path: string;
  color: string;
}

export function QuickOverview() {
  const { state } = useFlowStore();
  const casa = useCasaStore();
  const dayCtx = useDayContext();
  const navigate = useNavigate();
  const todayStr = brasiliaISO();

  // Top task per module from store
  const topTaskByModule = useMemo(() => {
    const result: Record<string, string | null> = { trabalho: null, casa: null, saude: null };
    const activeTasks = state.tasks.filter(
      (t) => !t.parent_task_id && t.status !== "feito" && t.status !== "descartado"
    );
    for (const mod of ["trabalho", "casa", "saude"] as const) {
      const modTasks = activeTasks
        .filter((t) => t.modulo === mod)
        .sort((a, b) => b.urgencia - a.urgencia);
      result[mod] = modTasks[0]?.titulo || null;
    }
    // Casa from casa store if no task
    if (!result.casa) {
      const devidas = casa.getTarefasDevidas();
      if (devidas.length > 0) result.casa = `${devidas[0].task.tarefa} — ${devidas[0].task.comodo}`;
    }
    return result;
  }, [state.tasks, casa.tarefas, casa.registros]);

  // Top meta
  const { data: topMeta } = useQuery({
    queryKey: ["quick-overview-meta"],
    queryFn: async () => {
      const { data } = await supabase
        .from("metas_pessoais")
        .select("titulo, progresso")
        .eq("status", "ativa")
        .order("data_alvo", { ascending: true })
        .limit(1);
      return data?.[0] || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Today's next event
  const { data: nextEvent } = useQuery({
    queryKey: ["quick-overview-event", todayStr],
    queryFn: async () => {
      const { data } = await supabase
        .from("reunioes")
        .select("titulo, hora_inicio")
        .eq("data", todayStr)
        .order("hora_inicio", { ascending: true })
        .limit(1);
      return data?.[0] || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Financial summary (current month balance)
  const now = new Date();
  const { data: finSummary } = useQuery({
    queryKey: ["quick-overview-fin", now.getFullYear(), now.getMonth() + 1],
    queryFn: async () => {
      const { data } = await supabase
        .from("fc_lancamentos")
        .select("entrada, saida")
        .eq("ano", now.getFullYear())
        .eq("mes", now.getMonth() + 1);
      if (!data || data.length === 0) return null;
      const totalIn = data.reduce((s, r) => s + (r.entrada || 0), 0);
      const totalOut = data.reduce((s, r) => s + (r.saida || 0), 0);
      return { balance: totalIn - totalOut, totalIn, totalOut };
    },
    staleTime: 5 * 60 * 1000,
  });

  const snippetMap: Record<string, ModuleSnippet> = {
    trabalho: {
      key: "trabalho", label: "Trabalho", icon: Briefcase,
      task: topTaskByModule.trabalho, path: "/?mod=trabalho",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    casa: {
      key: "casa", label: "Casa", icon: Home,
      task: topTaskByModule.casa, path: "/?mod=casa",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    saude: {
      key: "saude", label: "Saúde", icon: Heart,
      task: topTaskByModule.saude, path: "/?mod=saude",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
    metas: {
      key: "metas", label: "Metas", icon: Target,
      task: topMeta ? `${topMeta.titulo} (${topMeta.progresso}%)` : null,
      path: "/?mod=metas",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    financeiro: {
      key: "financeiro", label: "Finanças", icon: Wallet,
      task: finSummary
        ? `Saldo: R$ ${finSummary.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : null,
      path: "/financeiro",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    calendario: {
      key: "calendario", label: "Calendário", icon: CalendarDays,
      task: nextEvent ? `${nextEvent.hora_inicio} — ${nextEvent.titulo}` : null,
      path: "/calendario",
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
  };

  const hiddenModules = dayCtx.orchestration?.modules_to_hide ?? [];
  const orderedKeys = (dayCtx.moduleOrder ?? ["saude", "trabalho", "casa", "financeiro", "metas", "calendario"])
    .filter((k) => !hiddenModules.includes(k) && snippetMap[k]);

  // Add any keys not in moduleOrder but present in snippetMap (safety fallback)
  Object.keys(snippetMap).forEach((k) => {
    if (!orderedKeys.includes(k) && !hiddenModules.includes(k)) orderedKeys.push(k);
  });

  const snippets = orderedKeys.map((k) => snippetMap[k]);
  return (
    <div className="space-y-2">
      <h3 className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase px-1">
        Visão rápida
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {snippets.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => navigate(s.path)}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/20 hover:bg-card/80 active:scale-[0.98] transition-all duration-200 text-left min-h-[56px] group"
            >
              <div className={`p-2 rounded-xl ${s.color} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] text-muted-foreground/60 tracking-wider uppercase">
                  {s.label}
                </p>
                {s.task ? (
                  <p className="text-sm font-body truncate mt-0.5">{s.task}</p>
                ) : (
                  <p className="text-xs font-body text-muted-foreground/40 mt-0.5">
                    Nenhum item pendente
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
