import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

export type Refeicao = {
  id: string;
  data: string;
  refeicao: string;
  qualidade: number;
  descricao: string | null;
  categorias: string[] | null;
  pulou: boolean | null;
  created_at: string | null;
};

export type Exercicio = {
  id: string;
  data: string;
  tipo: string;
  duracao_min: number;
  intensidade: number;
  como_ficou: number | null;
  notas: string | null;
  created_at: string | null;
};

export type BmMetas = {
  id: string;
  dias_exercicio_meta: number | null;
  duracao_meta_min: number | null;
  refeicoes_meta_pct: number | null;
  ativo: boolean | null;
};

export type LogEstado = {
  id: string;
  data: string;
  humor: number | null;
  sono_horas: number | null;
  sono_qualidade: number | null;
  remedio_tomado: boolean | null;
  estado_energia: string | null;
  refeicoes_total: number | null;
  refeicoes_saudaveis: number | null;
  refeicoes_puladas: number | null;
  exercicio_feito: boolean | null;
  exercicio_min: number | null;
  exercicio_intensidade: number | null;
  ia_score_bem_estar: number | null;
  ia_sinais: string[] | null;
  ia_alerta: string | null;
  created_at: string | null;
};

export type AnaliseSemanal = {
  id: string;
  semana_inicio: string;
  semana_fim: string;
  classificacao: string | null;
  score_medio: number | null;
  humor_medio: number | null;
  sono_medio: number | null;
  exercicios_semana: number | null;
  adesao_alimentar_pct: number | null;
  ia_resumo: string | null;
  ia_insights: unknown | null;
  ia_alerta_nivel: string | null;
  created_at: string | null;
};

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().split("T")[0],
    end: sun.toISOString().split("T")[0],
  };
}

export function useBemEstarStore() {
  const qc = useQueryClient();

  // === QUERIES ===
  const { data: refeicoes = [] } = useQuery<Refeicao[]>({
    queryKey: ["bm_refeicoes", today()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bm_refeicoes" as any)
        .select("*")
        .eq("data", today())
        .order("created_at");
      if (error) throw error;
      return (data || []) as unknown as Refeicao[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: exerciciosHoje = [] } = useQuery<Exercicio[]>({
    queryKey: ["bm_exercicios", today()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bm_exercicios" as any)
        .select("*")
        .eq("data", today())
        .order("created_at");
      if (error) throw error;
      return (data || []) as unknown as Exercicio[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: exerciciosSemana = [] } = useQuery<Exercicio[]>({
    queryKey: ["bm_exercicios_semana"],
    queryFn: async () => {
      const { start, end } = getWeekRange(new Date());
      const { data, error } = await supabase
        .from("bm_exercicios" as any)
        .select("*")
        .gte("data", start)
        .lte("data", end)
        .order("data");
      if (error) throw error;
      return (data || []) as unknown as Exercicio[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: metas } = useQuery<BmMetas | null>({
    queryKey: ["bm_metas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bm_metas" as any)
        .select("*")
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as BmMetas | null;
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: analises = [] } = useQuery<AnaliseSemanal[]>({
    queryKey: ["bm_analise_semanal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bm_analise_semanal" as any)
        .select("*")
        .order("semana_inicio", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data || []) as unknown as AnaliseSemanal[];
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // === MUTATIONS ===
  const addRefeicaoMut = useMutation({
    mutationFn: async (r: {
      refeicao: string;
      qualidade: number;
      descricao?: string;
      categorias?: string[];
      pulou?: boolean;
    }) => {
      const { error } = await supabase.from("bm_refeicoes" as any).upsert(
        { data: today(), ...r } as any,
        { onConflict: "data,refeicao" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bm_refeicoes"] }),
  });

  const addExercicioMut = useMutation({
    mutationFn: async (e: {
      tipo: string;
      duracao_min: number;
      intensidade: number;
      como_ficou?: number;
      notas?: string;
    }) => {
      const { error } = await supabase
        .from("bm_exercicios" as any)
        .insert({ data: today(), ...e } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bm_exercicios"] });
    },
  });

  const updateMetasMut = useMutation({
    mutationFn: async (m: {
      dias_exercicio_meta?: number;
      duracao_meta_min?: number;
      refeicoes_meta_pct?: number;
    }) => {
      if (metas?.id) {
        const { error } = await supabase
          .from("bm_metas" as any)
          .update(m as any)
          .eq("id", metas.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bm_metas" as any)
          .insert({ ...m, ativo: true } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bm_metas"] }),
  });

  // === HELPERS ===
  const getRefeicaoStatus = useCallback(
    (tipo: string) => refeicoes.find((r) => r.refeicao === tipo),
    [refeicoes]
  );

  const exerciciosDaSemana = useCallback(() => {
    const dias = new Set(exerciciosSemana.map((e) => e.data));
    return dias.size;
  }, [exerciciosSemana]);

  const metaExercicio = metas?.dias_exercicio_meta ?? 3;
  const metaDuracao = metas?.duracao_meta_min ?? 30;

  return {
    refeicoes,
    exerciciosHoje,
    exerciciosSemana,
    metas,
    analises,
    addRefeicao: addRefeicaoMut.mutate,
    addExercicio: addExercicioMut.mutate,
    updateMetas: updateMetasMut.mutate,
    getRefeicaoStatus,
    exerciciosDaSemana,
    metaExercicio,
    metaDuracao,
  };
}
