import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type MetaPessoal = {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string | null;
  prazo: "curto" | "medio" | "longo";
  data_inicio: string;
  data_alvo: string;
  progresso: number;
  status: "ativa" | "concluida" | "pausada" | "abandonada";
  notas_progresso: { data: string; texto: string; progresso: number }[];
  created_at: string;
  updated_at: string;
};

export type ReportSemanal = {
  id: string;
  user_id: string;
  semana_inicio: string;
  semana_fim: string;
  reflexao: string | null;
  nota_semana: number | null;
  destaques: string[] | null;
  dificuldades: string[] | null;
  metas_update: { meta_id: string; progresso: number; nota: string }[];
  metricas: Record<string, any>;
  created_at: string;
};

const prazoLabel: Record<string, string> = {
  curto: "1 mês",
  medio: "6 meses",
  longo: "1 ano",
};

export { prazoLabel };

export function useMetasStore() {
  const qc = useQueryClient();

  const { data: metas = [], isLoading } = useQuery<MetaPessoal[]>({
    queryKey: ["metas_pessoais"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("metas_pessoais")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MetaPessoal[];
    },
  });

  const { data: reports = [] } = useQuery<ReportSemanal[]>({
    queryKey: ["reports_semanais"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("reports_semanais")
        .select("*")
        .eq("user_id", user.id)
        .order("semana_inicio", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data || []) as unknown as ReportSemanal[];
    },
  });

  const addMetaMut = useMutation({
    mutationFn: async (meta: { titulo: string; descricao?: string; prazo: "curto" | "medio" | "longo"; data_alvo: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("metas_pessoais")
        .insert({ ...meta, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metas_pessoais"] }),
  });

  const updateMetaMut = useMutation({
    mutationFn: async ({ id, ...changes }: { id: string } & Partial<MetaPessoal>) => {
      const { error } = await supabase
        .from("metas_pessoais")
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metas_pessoais"] }),
  });

  const addProgressNoteMut = useMutation({
    mutationFn: async ({ id, texto, progresso }: { id: string; texto: string; progresso: number }) => {
      const meta = metas.find((m) => m.id === id);
      if (!meta) throw new Error("Meta not found");
      const notes = [...(meta.notas_progresso || []), { data: new Date().toISOString().split("T")[0], texto, progresso }];
      const { error } = await supabase
        .from("metas_pessoais")
        .update({ notas_progresso: notes as unknown as Json, progresso, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metas_pessoais"] }),
  });

  const saveReportMut = useMutation({
    mutationFn: async (report: Omit<ReportSemanal, "id" | "created_at">) => {
      const { error } = await supabase
        .from("reports_semanais")
        .upsert({
          ...report,
          notas_progresso: undefined,
          metas_update: report.metas_update as unknown as Json,
          metricas: report.metricas as unknown as Json,
          destaques: report.destaques ?? null,
          dificuldades: report.dificuldades ?? null,
        }, { onConflict: "user_id,semana_inicio" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports_semanais"] }),
  });

  const metasAtivas = metas.filter((m) => m.status === "ativa");
  const metasCurto = metasAtivas.filter((m) => m.prazo === "curto");
  const metasMedio = metasAtivas.filter((m) => m.prazo === "medio");
  const metasLongo = metasAtivas.filter((m) => m.prazo === "longo");

  const hasAllTimeframes = metasCurto.length > 0 && metasMedio.length > 0 && metasLongo.length > 0;

  return {
    metas,
    metasAtivas,
    metasCurto,
    metasMedio,
    metasLongo,
    hasAllTimeframes,
    reports,
    isLoading,
    addMeta: addMetaMut.mutate,
    updateMeta: updateMetaMut.mutate,
    addProgressNote: addProgressNoteMut.mutate,
    saveReport: saveReportMut.mutate,
  };
}
