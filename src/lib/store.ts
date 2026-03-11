// FLOW v2 — Supabase-backed store with React Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useState } from "react";
import type { Database } from "@/integrations/supabase/types";

// Re-export types from DB enums
export type EnergyState = Database["public"]["Enums"]["energy_state"];
export type Modulo = Database["public"]["Enums"]["task_modulo"];
export type TaskType = Database["public"]["Enums"]["task_tipo"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskOwner = Database["public"]["Enums"]["task_owner"];
export type EstadoIdeal = Database["public"]["Enums"]["estado_ideal_type"];
export type Urgency = 1 | 2 | 3;

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Medicamento = Database["public"]["Tables"]["medicamentos"]["Row"];
export type RegistroMedicamento = Database["public"]["Tables"]["registros_medicamento"]["Row"];
export type RegistroSono = Database["public"]["Tables"]["registros_sono"]["Row"];
export type RegistroHumor = Database["public"]["Tables"]["registros_humor"]["Row"];
export type SessaoEnergia = Database["public"]["Tables"]["sessoes_energia"]["Row"];

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function useFlowStore() {
  const qc = useQueryClient();
  const [currentEnergy, setCurrentEnergyLocal] = useState<EnergyState | null>(null);
  const [currentModulo, setCurrentModulo] = useState<Modulo>("trabalho");
  const [energyChecked, setEnergyChecked] = useState(false);

  // Check last energy session on mount
  const { data: lastEnergySession } = useQuery({
    queryKey: ["last_energy_session"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessoes_energia")
        .select("*")
        .eq("data", today())
        .order("hora_inicio", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 0,
  });

  // Auto-restore energy if last session was less than 4h ago
  if (lastEnergySession && !energyChecked) {
    const sessionTime = new Date(lastEnergySession.hora_inicio).getTime();
    const fourHoursMs = 4 * 60 * 60 * 1000;
    if (Date.now() - sessionTime < fourHoursMs) {
      setCurrentEnergyLocal(lastEnergySession.estado);
    }
    setEnergyChecked(true);
  } else if (!lastEnergySession && !energyChecked && lastEnergySession !== undefined) {
    setEnergyChecked(true);
  }

  // ===== QUERIES =====
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("criado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: medicamentos = [] } = useQuery({
    queryKey: ["medicamentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("medicamentos").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: registrosMed = [] } = useQuery({
    queryKey: ["registros_medicamento", today()],
    queryFn: async () => {
      const { data, error } = await supabase.from("registros_medicamento").select("*").eq("data", today());
      if (error) throw error;
      return data;
    },
  });

  const { data: registrosHumor = [] } = useQuery({
    queryKey: ["registros_humor"],
    queryFn: async () => {
      const { data, error } = await supabase.from("registros_humor").select("*").order("data", { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
  });

  const { data: registrosSono = [] } = useQuery({
    queryKey: ["registros_sono"],
    queryFn: async () => {
      const { data, error } = await supabase.from("registros_sono").select("*").order("data", { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").eq("status", "ativo").order("nome");
      if (error) throw error;
      return data;
    },
  });

  // ===== MUTATIONS =====
  const addTaskMut = useMutation({
    mutationFn: async (task: Database["public"]["Tables"]["tasks"]["Insert"]) => {
      const { data, error } = await supabase.from("tasks").insert(task).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const updateTaskMut = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Database["public"]["Tables"]["tasks"]["Update"] }) => {
      const { error } = await supabase.from("tasks").update(changes).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const addMedMut = useMutation({
    mutationFn: async (med: Database["public"]["Tables"]["medicamentos"]["Insert"]) => {
      const { error } = await supabase.from("medicamentos").insert(med);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicamentos"] }),
  });

  const takeMedMut = useMutation({
    mutationFn: async ({ medicamento_id, horario_previsto }: { medicamento_id: string; horario_previsto: string }) => {
      const { error } = await supabase.from("registros_medicamento").insert({
        medicamento_id,
        horario_previsto,
        horario_tomado: new Date().toISOString(),
        tomado: true,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["registros_medicamento"] }),
  });

  const moodMut = useMutation({
    mutationFn: async ({ valor, notas }: { valor: number; notas?: string }) => {
      const { error } = await supabase.from("registros_humor").upsert(
        { data: today(), valor, notas },
        { onConflict: "data" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["registros_humor"] }),
  });

  const sleepMut = useMutation({
    mutationFn: async ({ type, qualidade }: { type: "dormir" | "acordar"; qualidade?: 1 | 2 | 3 }) => {
      const todayStr = today();
      const { data: existing } = await supabase.from("registros_sono").select("*").eq("data", todayStr).maybeSingle();

      if (type === "dormir") {
        if (existing) {
          await supabase.from("registros_sono").update({ horario_dormir: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await supabase.from("registros_sono").insert({ data: todayStr, horario_dormir: new Date().toISOString() });
        }
      } else {
        const now = new Date();
        if (existing) {
          const duracao = existing.horario_dormir
            ? Math.round((now.getTime() - new Date(existing.horario_dormir).getTime()) / 60000)
            : undefined;
          await supabase.from("registros_sono").update({
            horario_acordar: now.toISOString(),
            duracao_min: duracao,
            qualidade,
          }).eq("id", existing.id);
        } else {
          await supabase.from("registros_sono").insert({
            data: todayStr,
            horario_acordar: now.toISOString(),
            qualidade,
          });
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["registros_sono"] }),
  });

  const energyMut = useMutation({
    mutationFn: async (estado: EnergyState) => {
      await supabase.from("sessoes_energia").insert({ estado, data: today() });
    },
  });

  // ===== DERIVED =====
  const setEnergy = useCallback((energy: EnergyState) => {
    setCurrentEnergyLocal(energy);
    energyMut.mutate(energy);
  }, [energyMut]);

  const setModulo = useCallback((modulo: Modulo) => {
    setCurrentModulo(modulo);
  }, []);

  const addTask = useCallback(
    (task: Omit<Database["public"]["Tables"]["tasks"]["Insert"], "id" | "criado_em">) => {
      addTaskMut.mutate(task);
    },
    [addTaskMut]
  );

  const completeTask = useCallback(
    (id: string) => {
      updateTaskMut.mutate({ id, changes: { status: "feito", feito_em: new Date().toISOString() } });
    },
    [updateTaskMut]
  );

  const updateTask = useCallback(
    (id: string, changes: Database["public"]["Tables"]["tasks"]["Update"]) => {
      updateTaskMut.mutate({ id, changes });
    },
    [updateTaskMut]
  );

  const addMedicamento = useCallback(
    (med: Omit<Database["public"]["Tables"]["medicamentos"]["Insert"], "id">) => {
      addMedMut.mutate(med);
    },
    [addMedMut]
  );

  const registrarMedicamento = useCallback(
    (medicamento_id: string, horario_previsto: string) => {
      takeMedMut.mutate({ medicamento_id, horario_previsto });
    },
    [takeMedMut]
  );

  const registrarHumor = useCallback(
    (valor: number, notas?: string) => {
      moodMut.mutate({ valor, notas });
    },
    [moodMut]
  );

  const registrarSono = useCallback(
    (type: "dormir" | "acordar", qualidade?: 1 | 2 | 3) => {
      sleepMut.mutate({ type, qualidade });
    },
    [sleepMut]
  );

  const isMedTakenToday = useCallback(
    (medicamento_id: string, horario: string) => {
      return registrosMed.some(
        (r) => r.medicamento_id === medicamento_id && r.horario_previsto === horario && r.tomado
      );
    },
    [registrosMed]
  );

  const pendingMeds = useCallback(() => {
    const currentHour = new Date().getHours();
    return medicamentos.flatMap((med) =>
      med.horarios
        .filter((h) => {
          const hour = parseInt(h.split(":")[0]);
          return hour <= currentHour && !registrosMed.some(
            (r) => r.medicamento_id === med.id && r.horario_previsto === h && r.tomado
          );
        })
        .map((h) => ({ medicamento: med, horario: h }))
    );
  }, [medicamentos, registrosMed]);

  const getFilteredTasks = useCallback(
    (modulo: Modulo, energy: EnergyState) => {
      const active = tasks.filter(
        (t) => t.modulo === modulo && t.status !== "feito" && t.status !== "descartado"
      );
      const matching = active.filter(
        (t) => t.estado_ideal === "qualquer" || t.estado_ideal === energy
      );
      matching.sort((a, b) => b.urgencia - a.urgencia || b.impacto - a.impacto);
      const limit = energy === "foco_total" ? 3 : 1;
      return matching.slice(0, limit);
    },
    [tasks]
  );

  const todayHumor = registrosHumor.find((r) => r.data === today());

  // AI classify function
  const classifyTask = useCallback(async (taskId: string, titulo: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("classify-task", {
        body: { titulo },
      });
      if (error) throw error;
      if (data?.classification) {
        updateTaskMut.mutate({ id: taskId, changes: data.classification });
      }
    } catch (e) {
      console.error("AI classification failed:", e);
    }
  }, [updateTaskMut]);

  // Add task with AI classification
  const addTaskWithAI = useCallback(
    async (task: Omit<Database["public"]["Tables"]["tasks"]["Insert"], "id" | "criado_em">) => {
      const { data, error } = await supabase.from("tasks").insert(task).select().single();
      if (error) throw error;
      if (data) {
        qc.invalidateQueries({ queryKey: ["tasks"] });
        // Classify in background
        classifyTask(data.id, data.titulo);
      }
    },
    [qc, classifyTask]
  );

  return {
    state: {
      tasks,
      medicamentos,
      registros_medicamento: registrosMed,
      registros_humor: registrosHumor,
      registros_sono: registrosSono,
      current_energy: currentEnergy,
      current_modulo: currentModulo,
    },
    setEnergy,
    setModulo,
    addTask: addTaskWithAI,
    updateTask,
    completeTask,
    addMedicamento,
    registrarMedicamento,
    registrarHumor,
    registrarSono,
    isMedTakenToday,
    pendingMeds,
    getFilteredTasks,
    todayHumor,
  };
}
