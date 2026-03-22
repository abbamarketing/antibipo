import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";
import type { Database, Json } from "@/integrations/supabase/types";

export interface CustomTracker {
  id: string;
  user_id: string;
  titulo: string;
  tipo: string;
  modulo: string;
  secao: string;
  config: Record<string, any>;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackerRegistro {
  id: string;
  tracker_id: string;
  user_id: string;
  data: string;
  dados: Record<string, any>;
  created_at: string;
}

export function useTrackerStore() {
  const qc = useQueryClient();

  const { data: trackers = [] } = useQuery({
    queryKey: ["custom_trackers"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("custom_trackers")
        .select("*")
        .eq("user_id", user.id)
        .eq("ativo", true)
        .order("created_at");
      if (error) throw error;
      return (data || []) as unknown as CustomTracker[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: registros = [] } = useQuery({
    queryKey: ["tracker_registros"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const since = new Date();
      since.setDate(since.getDate() - 60);
      const { data, error } = await supabase
        .from("tracker_registros")
        .select("*")
        .eq("user_id", user.id)
        .gte("data", since.toISOString().split("T")[0])
        .order("data", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TrackerRegistro[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const createMut = useMutation({
    mutationFn: async (tracker: Omit<CustomTracker, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("custom_trackers").insert({
        ...tracker,
        config: tracker.config as Json,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom_trackers"] }),
  });

  const completeMut = useMutation({
    mutationFn: async ({ tracker_id, user_id, dados }: { tracker_id: string; user_id: string; dados?: Record<string, unknown> }) => {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("tracker_registros").insert({
        tracker_id,
        user_id,
        data: today,
        dados: (dados || {}) as Json,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tracker_registros"] }),
  });

  const updateTrackerMut = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<CustomTracker> }) => {
      const { config, ...rest } = changes;
      const { error } = await supabase.from("custom_trackers").update({
        ...rest,
        ...(config !== undefined ? { config: config as Json } : {}),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom_trackers"] }),
  });

  const getRegistrosForTracker = useCallback(
    (trackerId: string) => registros.filter((r) => r.tracker_id === trackerId),
    [registros]
  );

  const getLastCompletion = useCallback(
    (trackerId: string): string | undefined => {
      const records = registros.filter((r) => r.tracker_id === trackerId);
      return records.length > 0 ? records[0].data : undefined;
    },
    [registros]
  );

  const getTodayRegistros = useCallback(
    (trackerId: string): TrackerRegistro[] => {
      const today = new Date().toISOString().split("T")[0];
      return registros.filter((r) => r.tracker_id === trackerId && r.data === today);
    },
    [registros]
  );

  const getTrackersByModulo = useCallback(
    (modulo: string) => trackers.filter((t) => t.modulo === modulo),
    [trackers]
  );

  return {
    trackers,
    registros,
    createTracker: createMut.mutate,
    completeTracker: completeMut.mutate,
    updateTracker: updateTrackerMut.mutate,
    getRegistrosForTracker,
    getLastCompletion,
    getTodayRegistros,
    getTrackersByModulo,
  };
}
