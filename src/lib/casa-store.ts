import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

export type TarefaCasa = {
  id: string;
  comodo: string;
  tarefa: string;
  frequencia: string;
  tempo_min: number | null;
  ativo: boolean | null;
  created_at: string | null;
};

export type RegistroLimpeza = {
  id: string;
  tarefa_casa_id: string | null;
  comodo: string;
  tarefa: string;
  feito_em: string;
  notas: string | null;
};

export type ItemCompra = {
  id: string;
  item: string;
  quantidade: string | null;
  categoria: string | null;
  comprado: boolean | null;
  created_at: string | null;
};

export function useCasaStore() {
  const qc = useQueryClient();

  const { data: tarefas = [] } = useQuery<TarefaCasa[]>({
    queryKey: ["tarefas_casa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tarefas_casa" as any)
        .select("*")
        .eq("ativo", true)
        .order("comodo");
      if (error) throw error;
      return (data || []) as unknown as TarefaCasa[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: registros = [] } = useQuery<RegistroLimpeza[]>({
    queryKey: ["registros_limpeza"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registros_limpeza" as any)
        .select("*")
        .order("feito_em", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as RegistroLimpeza[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: listaCompras = [] } = useQuery<ItemCompra[]>({
    queryKey: ["lista_compras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lista_compras" as any)
        .select("*")
        .order("comprado")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ItemCompra[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const completarTarefaMut = useMutation({
    mutationFn: async (t: { tarefa_casa_id: string; comodo: string; tarefa: string; notas?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("registros_limpeza" as any)
        .insert({ ...t, feito_em: new Date().toISOString(), user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["registros_limpeza"] }),
  });

  const addTarefaMut = useMutation({
    mutationFn: async (t: { comodo: string; tarefa: string; frequencia: string; tempo_min: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("tarefas_casa" as any)
        .insert({ ...t, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas_casa"] }),
  });

  const addItemCompraMut = useMutation({
    mutationFn: async (item: { item: string; quantidade?: string; categoria?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("lista_compras" as any)
        .insert({ ...item, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lista_compras"] }),
  });

  const toggleCompradoMut = useMutation({
    mutationFn: async ({ id, comprado }: { id: string; comprado: boolean }) => {
      const { error } = await supabase
        .from("lista_compras" as any)
        .update({ comprado } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lista_compras"] }),
  });

  const removeItemCompraMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lista_compras" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lista_compras"] }),
  });

  const getUltimaLimpeza = useCallback(
    (tarefaCasaId: string) => {
      return registros.find((r) => r.tarefa_casa_id === tarefaCasaId);
    },
    [registros]
  );

  const comodos = [...new Set(tarefas.map((t) => t.comodo))];

  const tarefasPorComodo = useCallback(
    (comodo: string) => tarefas.filter((t) => t.comodo === comodo),
    [tarefas]
  );

  // Shared logic: get overdue casa tasks sorted by urgency
  // Tasks reset daily at 8:00 AM Brasília and never accumulate
  const getTarefasDevidas = useCallback(
    () => {
      const now = new Date();
      // Calculate "today's reset point" at 8:00 AM Brasília (UTC-3)
      const brasiliaOffset = -3 * 60; // minutes
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const brasiliaMs = utcMs + brasiliaOffset * 60000;
      const brasilia = new Date(brasiliaMs);

      // Today's 8 AM reset in Brasília
      const resetToday = new Date(brasilia);
      resetToday.setHours(8, 0, 0, 0);
      // If before 8 AM, the active reset is yesterday's 8 AM
      const activeReset = brasilia < resetToday
        ? new Date(resetToday.getTime() - 86400000)
        : resetToday;
      // Convert activeReset back to UTC for comparison
      const activeResetUTC = new Date(activeReset.getTime() - brasiliaOffset * 60000 - now.getTimezoneOffset() * 60000);

      const result: { task: TarefaCasa; urgencia: number; daysSince: number }[] = [];

      tarefas
        .filter((t) => t.ativo !== false)
        .forEach((t) => {
          const freqDays = t.frequencia === "diario" ? 1 : t.frequencia === "semanal" ? 7 : t.frequencia === "quinzenal" ? 15 : 30;
          const lastDone = registros.find((r) => r.tarefa_casa_id === t.id);

          // For daily tasks: due if not done since last 8 AM reset
          if (freqDays === 1) {
            if (!lastDone || new Date(lastDone.feito_em) < activeResetUTC) {
              // Urgency is always 2 for daily — no accumulation
              result.push({ task: t, urgencia: 2, daysSince: 1 });
            }
            return;
          }

          // Non-daily tasks: check days since last done or creation
          const referenceDate = lastDone
            ? new Date(lastDone.feito_em)
            : t.created_at
            ? new Date(t.created_at)
            : now;
          const daysSince = Math.floor((now.getTime() - referenceDate.getTime()) / 86400000);

          if (daysSince >= freqDays) {
            // Cap urgency at 3 — no infinite accumulation
            const urgencia = Math.min(daysSince > freqDays * 1.5 ? 3 : 2, 3);
            result.push({ task: t, urgencia, daysSince: Math.min(daysSince, freqDays * 2) });
          }
        });

      return result.sort((a, b) => b.urgencia - a.urgencia || b.daysSince - a.daysSince);
    },
    [tarefas, registros]
  );

  return {
    tarefas,
    registros,
    listaCompras,
    comodos,
    tarefasPorComodo,
    completarTarefa: completarTarefaMut.mutate,
    addTarefa: addTarefaMut.mutate,
    addItemCompra: addItemCompraMut.mutate,
    toggleComprado: toggleCompradoMut.mutate,
    removeItemCompra: removeItemCompraMut.mutate,
    getUltimaLimpeza,
    getTarefasDevidas,
  };
}
