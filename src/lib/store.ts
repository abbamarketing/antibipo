// FLOW v2 — Local state management
import { useState, useEffect, useCallback } from "react";

export type EnergyState = "foco_total" | "modo_leve" | "basico";
export type Modulo = "trabalho" | "casa" | "saude";
export type TaskType = "estrategico" | "operacional" | "delegavel" | "administrativo" | "domestico";
export type TaskStatus = "backlog" | "hoje" | "em_andamento" | "aguardando" | "feito" | "descartado";
export type TaskOwner = "eu" | "socio_medico" | "editor";
export type Urgency = 1 | 2 | 3; // 1=talvez, 2=esta semana, 3=hoje

export interface Task {
  id: string;
  titulo: string;
  modulo: Modulo;
  tipo: TaskType;
  estado_ideal: EnergyState | "qualquer";
  urgencia: Urgency;
  impacto: 1 | 2 | 3;
  tempo_min: number;
  dono: TaskOwner;
  cliente_id?: string;
  status: TaskStatus;
  criado_em: string;
  feito_em?: string;
}

export interface Medicamento {
  id: string;
  nome: string;
  dose: string;
  horarios: string[];
  instrucoes?: string;
  estoque: number;
}

export interface RegistroMedicamento {
  id: string;
  medicamento_id: string;
  data: string;
  horario_previsto: string;
  horario_tomado?: string;
  tomado: boolean;
}

export interface RegistroSono {
  id: string;
  data: string;
  horario_dormir?: string;
  horario_acordar?: string;
  duracao_min?: number;
  qualidade?: 1 | 2 | 3; // 1=pesado, 2=normal, 3=leve
}

export interface RegistroHumor {
  id: string;
  data: string;
  valor: number; // -2 a +2
  notas?: string;
}

export interface SessaoEnergia {
  id: string;
  data: string;
  estado: EnergyState;
  hora_inicio: string;
}

export interface FlowState {
  tasks: Task[];
  medicamentos: Medicamento[];
  registros_medicamento: RegistroMedicamento[];
  registros_sono: RegistroSono[];
  registros_humor: RegistroHumor[];
  sessoes_energia: SessaoEnergia[];
  current_energy: EnergyState | null;
  current_modulo: Modulo;
}

const STORAGE_KEY = "flow_v2_state";

const defaultState: FlowState = {
  tasks: [],
  medicamentos: [],
  registros_medicamento: [],
  registros_sono: [],
  registros_humor: [],
  sessoes_energia: [],
  current_energy: null,
  current_modulo: "trabalho",
};

function loadState(): FlowState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultState, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaultState;
}

function saveState(state: FlowState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function useFlowStore() {
  const [state, setState] = useState<FlowState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const update = useCallback((updater: (s: FlowState) => FlowState) => {
    setState((prev) => updater(prev));
  }, []);

  const setEnergy = useCallback((energy: EnergyState) => {
    update((s) => ({
      ...s,
      current_energy: energy,
      sessoes_energia: [
        ...s.sessoes_energia,
        { id: uuid(), data: today(), estado: energy, hora_inicio: new Date().toISOString() },
      ],
    }));
  }, [update]);

  const setModulo = useCallback((modulo: Modulo) => {
    update((s) => ({ ...s, current_modulo: modulo }));
  }, [update]);

  const addTask = useCallback((task: Omit<Task, "id" | "criado_em" | "status">) => {
    update((s) => ({
      ...s,
      tasks: [...s.tasks, { ...task, id: uuid(), criado_em: new Date().toISOString(), status: "backlog" }],
    }));
  }, [update]);

  const updateTask = useCallback((id: string, changes: Partial<Task>) => {
    update((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    }));
  }, [update]);

  const completeTask = useCallback((id: string) => {
    updateTask(id, { status: "feito", feito_em: new Date().toISOString() });
  }, [updateTask]);

  const addMedicamento = useCallback((med: Omit<Medicamento, "id">) => {
    update((s) => ({
      ...s,
      medicamentos: [...s.medicamentos, { ...med, id: uuid() }],
    }));
  }, [update]);

  const registrarMedicamento = useCallback((medicamento_id: string, horario_previsto: string) => {
    update((s) => ({
      ...s,
      registros_medicamento: [
        ...s.registros_medicamento,
        {
          id: uuid(),
          medicamento_id,
          data: today(),
          horario_previsto,
          horario_tomado: new Date().toISOString(),
          tomado: true,
        },
      ],
    }));
  }, [update]);

  const registrarHumor = useCallback((valor: number, notas?: string) => {
    update((s) => {
      const todayStr = today();
      const existing = s.registros_humor.findIndex((r) => r.data === todayStr);
      const registro: RegistroHumor = { id: uuid(), data: todayStr, valor, notas };
      if (existing >= 0) {
        const updated = [...s.registros_humor];
        updated[existing] = registro;
        return { ...s, registros_humor: updated };
      }
      return { ...s, registros_humor: [...s.registros_humor, registro] };
    });
  }, [update]);

  const registrarSono = useCallback((type: "dormir" | "acordar", qualidade?: 1 | 2 | 3) => {
    update((s) => {
      const todayStr = today();
      const existing = s.registros_sono.find((r) => r.data === todayStr);
      if (type === "dormir") {
        if (existing) {
          return {
            ...s,
            registros_sono: s.registros_sono.map((r) =>
              r.data === todayStr ? { ...r, horario_dormir: new Date().toISOString() } : r
            ),
          };
        }
        return {
          ...s,
          registros_sono: [...s.registros_sono, { id: uuid(), data: todayStr, horario_dormir: new Date().toISOString() }],
        };
      } else {
        const now = new Date();
        if (existing) {
          const duracao = existing.horario_dormir
            ? Math.round((now.getTime() - new Date(existing.horario_dormir).getTime()) / 60000)
            : undefined;
          return {
            ...s,
            registros_sono: s.registros_sono.map((r) =>
              r.data === todayStr
                ? { ...r, horario_acordar: now.toISOString(), duracao_min: duracao, qualidade }
                : r
            ),
          };
        }
        return {
          ...s,
          registros_sono: [
            ...s.registros_sono,
            { id: uuid(), data: todayStr, horario_acordar: now.toISOString(), qualidade },
          ],
        };
      }
    });
  }, [update]);

  // Check if medication was taken today
  const isMedTakenToday = useCallback((medicamento_id: string, horario: string) => {
    return state.registros_medicamento.some(
      (r) => r.medicamento_id === medicamento_id && r.data === today() && r.horario_previsto === horario && r.tomado
    );
  }, [state.registros_medicamento]);

  const pendingMeds = useCallback(() => {
    const todayStr = today();
    const currentHour = new Date().getHours();
    return state.medicamentos.flatMap((med) =>
      med.horarios
        .filter((h) => {
          const hour = parseInt(h.split(":")[0]);
          return hour <= currentHour && !state.registros_medicamento.some(
            (r) => r.medicamento_id === med.id && r.data === todayStr && r.horario_previsto === h && r.tomado
          );
        })
        .map((h) => ({ medicamento: med, horario: h }))
    );
  }, [state.medicamentos, state.registros_medicamento]);

  // Get tasks filtered by energy state for a module
  const getFilteredTasks = useCallback((modulo: Modulo, energy: EnergyState) => {
    const activeTasks = state.tasks.filter(
      (t) => t.modulo === modulo && t.status !== "feito" && t.status !== "descartado"
    );

    const matchesEnergy = (t: Task) =>
      t.estado_ideal === "qualquer" || t.estado_ideal === energy;

    const filtered = activeTasks.filter(matchesEnergy);

    // Sort by urgency desc, then impacto desc
    filtered.sort((a, b) => b.urgencia - a.urgencia || b.impacto - a.impacto);

    // Limit based on energy
    const limit = energy === "foco_total" ? 3 : 1;
    return filtered.slice(0, limit);
  }, [state.tasks]);

  const todayHumor = state.registros_humor.find((r) => r.data === today());

  return {
    state,
    setEnergy,
    setModulo,
    addTask,
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
