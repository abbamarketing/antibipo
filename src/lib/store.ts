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
  const [currentModulo, setCurrentModulo] = useState<Modulo>("trabalho");

  // Energy state — derived from React Query (single source of truth, globally reactive)
  const { data: energySession } = useQuery({
    queryKey: ["current_energy"],
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

  // Derive current energy: valid if session < 4h old
  const currentEnergy: EnergyState | null = (() => {
    if (!energySession) return null;
    const sessionTime = new Date(energySession.hora_inicio).getTime();
    const fourHoursMs = 4 * 60 * 60 * 1000;
    if (Date.now() - sessionTime < fourHoursMs) {
      return energySession.estado;
    }
    return null;
  })();

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

  const makeTempId = (prefix: string) => `tmp_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // ===== MUTATIONS =====
  const addTaskMut = useMutation({
    mutationFn: async (task: Database["public"]["Tables"]["tasks"]["Insert"]) => {
      const { data, error } = await supabase.from("tasks").insert(task).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async (task) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = qc.getQueryData<Task[]>(["tasks"]) || [];

      const optimisticTask: Task = {
        id: makeTempId("task"),
        criado_em: new Date().toISOString(),
        cliente_id: task.cliente_id ?? null,
        data_limite: task.data_limite ?? null,
        depende_de: task.depende_de ?? null,
        dono: task.dono ?? "eu",
        estado_ideal: task.estado_ideal ?? "qualquer",
        feito_em: null,
        frequencia_recorrencia: task.frequencia_recorrencia ?? null,
        impacto: task.impacto ?? 2,
        modulo: task.modulo ?? "trabalho",
        notas: task.notas ?? null,
        parent_task_id: task.parent_task_id ?? null,
        recorrente: task.recorrente ?? false,
        status: task.status ?? "hoje",
        tempo_min: task.tempo_min ?? 30,
        tipo: task.tipo ?? "operacional",
        titulo: task.titulo,
        urgencia: task.urgencia ?? 2,
      };

      qc.setQueryData<Task[]>(["tasks"], [optimisticTask, ...previousTasks]);
      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        qc.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSuccess: (serverTask) => {
      qc.setQueryData<Task[]>(["tasks"], (current = []) => {
        const withoutTemp = current.filter((t) => !t.id.startsWith("tmp_task_"));
        return [serverTask, ...withoutTemp];
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const updateTaskMut = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Database["public"]["Tables"]["tasks"]["Update"] }) => {
      const { error } = await supabase.from("tasks").update(changes).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, changes }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = qc.getQueryData<Task[]>(["tasks"]) || [];
      qc.setQueryData<Task[]>(["tasks"], (current = []) =>
        current.map((task) => (task.id === id ? { ...task, ...changes } : task))
      );
      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        qc.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const addMedMut = useMutation({
    mutationFn: async (med: Database["public"]["Tables"]["medicamentos"]["Insert"]) => {
      const { error } = await supabase.from("medicamentos").insert(med);
      if (error) throw error;
    },
    onMutate: async (med) => {
      await qc.cancelQueries({ queryKey: ["medicamentos"] });
      const previousMeds = qc.getQueryData<Medicamento[]>(["medicamentos"]) || [];
      const optimisticMed: Medicamento = {
        id: makeTempId("med"),
        criado_em: new Date().toISOString(),
        dose: med.dose ?? "",
        estoque: med.estoque ?? 0,
        horarios: med.horarios ?? [],
        instrucoes: med.instrucoes ?? null,
        nome: med.nome,
      };
      qc.setQueryData<Medicamento[]>(["medicamentos"], [optimisticMed, ...previousMeds]);
      return { previousMeds };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousMeds) {
        qc.setQueryData(["medicamentos"], context.previousMeds);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["medicamentos"] }),
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
    onMutate: async ({ medicamento_id, horario_previsto }) => {
      const todayStr = today();
      await qc.cancelQueries({ queryKey: ["registros_medicamento", todayStr] });
      const previousRegistros = qc.getQueryData<RegistroMedicamento[]>(["registros_medicamento", todayStr]) || [];
      const optimisticRegistro: RegistroMedicamento = {
        id: makeTempId("medreg"),
        data: todayStr,
        horario_previsto,
        horario_tomado: new Date().toISOString(),
        medicamento_id,
        tomado: true,
      };
      qc.setQueryData<RegistroMedicamento[]>(["registros_medicamento", todayStr], [optimisticRegistro, ...previousRegistros]);
      return { previousRegistros, todayStr };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousRegistros && context?.todayStr) {
        qc.setQueryData(["registros_medicamento", context.todayStr], context.previousRegistros);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["registros_medicamento"] }),
  });

  const moodMut = useMutation({
    mutationFn: async ({ valor, notas }: { valor: number; notas?: string }) => {
      const { error } = await supabase.from("registros_humor").upsert(
        { data: today(), valor, notas },
        { onConflict: "data" }
      );
      if (error) throw error;
    },
    onMutate: async ({ valor, notas }) => {
      await qc.cancelQueries({ queryKey: ["registros_humor"] });
      const previousHumor = qc.getQueryData<RegistroHumor[]>(["registros_humor"]) || [];
      const todayStr = today();
      const optimisticHumor: RegistroHumor = {
        id: previousHumor.find((h) => h.data === todayStr)?.id || makeTempId("humor"),
        data: todayStr,
        valor,
        notas: notas ?? null,
      };
      qc.setQueryData<RegistroHumor[]>(["registros_humor"], [
        optimisticHumor,
        ...previousHumor.filter((h) => h.data !== todayStr),
      ]);
      return { previousHumor };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousHumor) {
        qc.setQueryData(["registros_humor"], context.previousHumor);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["registros_humor"] }),
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
    onMutate: async ({ type, qualidade }) => {
      await qc.cancelQueries({ queryKey: ["registros_sono"] });
      const previousSono = qc.getQueryData<RegistroSono[]>(["registros_sono"]) || [];
      const nowIso = new Date().toISOString();
      const todayStr = today();

      qc.setQueryData<RegistroSono[]>(["registros_sono"], (current = []) => {
        const existing = current.find((r) => r.data === todayStr);

        if (existing) {
          if (type === "dormir") {
            return current.map((r) =>
              r.id === existing.id ? { ...r, horario_dormir: nowIso } : r
            );
          }

          const duracao = existing.horario_dormir
            ? Math.round((new Date(nowIso).getTime() - new Date(existing.horario_dormir).getTime()) / 60000)
            : existing.duracao_min;

          return current.map((r) =>
            r.id === existing.id
              ? { ...r, horario_acordar: nowIso, duracao_min: duracao, qualidade: qualidade ?? r.qualidade }
              : r
          );
        }

        const optimisticRegistro: RegistroSono = {
          id: makeTempId("sono"),
          data: todayStr,
          duracao_min: null,
          horario_acordar: type === "acordar" ? nowIso : null,
          horario_dormir: type === "dormir" ? nowIso : null,
          qualidade: type === "acordar" ? (qualidade ?? null) : null,
        };

        return [optimisticRegistro, ...current];
      });

      return { previousSono };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSono) {
        qc.setQueryData(["registros_sono"], context.previousSono);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["registros_sono"] }),
  });

  const energyMut = useMutation({
    mutationFn: async (estado: EnergyState) => {
      await supabase.from("sessoes_energia").insert({ estado, data: today() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["current_energy"] }),
  });

  // ===== DERIVED =====
  const setEnergy = useCallback((energy: EnergyState) => {
    // Optimistically update the cache for instant reactivity
    qc.setQueryData(["current_energy"], { estado: energy, hora_inicio: new Date().toISOString(), data: today() });
    energyMut.mutate(energy);
  }, [energyMut, qc]);

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
        (t: any) => t.modulo === modulo && t.status !== "feito" && t.status !== "descartado" && !t.parent_task_id
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
      if (data?.ai_provider) {
        const { trackAIProvider } = await import("@/lib/ai-stats");
        trackAIProvider(data.ai_provider);
      }
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
