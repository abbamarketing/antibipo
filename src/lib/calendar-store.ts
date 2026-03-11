import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Reuniao = {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string | null;
  data: string;
  hora_inicio: string;
  hora_fim: string | null;
  local: string | null;
  participantes: string[] | null;
  tipo: string;
  lembrete_min: number | null;
  cor: string;
  created_at: string;
};

export function useCalendarStore(ano: number, mes: number) {
  const qc = useQueryClient();

  const startDate = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const endDate = mes === 12
    ? `${ano + 1}-01-01`
    : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;

  const { data: reunioes = [], isLoading } = useQuery<Reuniao[]>({
    queryKey: ["reunioes", ano, mes],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("reunioes" as any)
        .select("*")
        .eq("user_id", user.id)
        .gte("data", startDate)
        .lt("data", endDate)
        .order("data")
        .order("hora_inicio");
      if (error) throw error;
      return (data || []) as unknown as Reuniao[];
    },
  });

  const { data: todayMeetings = [] } = useQuery<Reuniao[]>({
    queryKey: ["reunioes_hoje"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("reunioes" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("data", today)
        .order("hora_inicio");
      if (error) throw error;
      return (data || []) as unknown as Reuniao[];
    },
  });

  const addReuniao = useMutation({
    mutationFn: async (r: Omit<Reuniao, "id" | "user_id" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("reunioes" as any)
        .insert({ ...r, user_id: user.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reunioes"] });
      qc.invalidateQueries({ queryKey: ["reunioes_hoje"] });
    },
  });

  const updateReuniao = useMutation({
    mutationFn: async ({ id, ...changes }: { id: string } & Partial<Reuniao>) => {
      const { error } = await supabase
        .from("reunioes" as any)
        .update(changes as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reunioes"] });
      qc.invalidateQueries({ queryKey: ["reunioes_hoje"] });
    },
  });

  const deleteReuniao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reunioes" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reunioes"] });
      qc.invalidateQueries({ queryKey: ["reunioes_hoje"] });
    },
  });

  const reunioesPorDia = (dia: number) => {
    const dateStr = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return reunioes.filter((r) => r.data === dateStr);
  };

  const diasComReuniao = new Set(reunioes.map((r) => parseInt(r.data.split("-")[2])));

  return {
    reunioes,
    todayMeetings,
    isLoading,
    reunioesPorDia,
    diasComReuniao,
    addReuniao: addReuniao.mutate,
    updateReuniao: updateReuniao.mutate,
    deleteReuniao: deleteReuniao.mutate,
  };
}
