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
  });

  const completarTarefaMut = useMutation({
    mutationFn: async (t: { tarefa_casa_id: string; comodo: string; tarefa: string; notas?: string }) => {
      const { error } = await supabase
        .from("registros_limpeza" as any)
        .insert({ ...t, feito_em: new Date().toISOString() } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["registros_limpeza"] }),
  });

  const addTarefaMut = useMutation({
    mutationFn: async (t: { comodo: string; tarefa: string; frequencia: string; tempo_min: number }) => {
      const { error } = await supabase
        .from("tarefas_casa" as any)
        .insert(t as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas_casa"] }),
  });

  const addItemCompraMut = useMutation({
    mutationFn: async (item: { item: string; quantidade?: string; categoria?: string }) => {
      const { error } = await supabase
        .from("lista_compras" as any)
        .insert(item as any);
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
  const getTarefasDevidas = useCallback(
    () => {
      const now = new Date();
      const result: { task: TarefaCasa; urgencia: number; daysSince: number }[] = [];
      tarefas
        .filter((t) => t.ativo !== false)
        .forEach((t) => {
          const lastDone = registros.find((r) => r.tarefa_casa_id === t.id);
          const lastDate = lastDone ? new Date(lastDone.feito_em) : null;
          const daysSince = lastDate ? Math.floor((now.getTime() - lastDate.getTime()) / 86400000) : 999;
          const freqDays = t.frequencia === "diario" ? 1 : t.frequencia === "semanal" ? 7 : t.frequencia === "quinzenal" ? 15 : 30;
          if (daysSince >= freqDays) {
            result.push({ task: t, urgencia: daysSince > freqDays * 1.5 ? 3 : 2, daysSince });
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
