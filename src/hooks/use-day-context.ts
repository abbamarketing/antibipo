/**
 * useDayContext — Centralized hook that crosses mood, energy, sleep,
 * medication, tasks and exercise into a unified "day state" that all
 * components can consume. This is the connective tissue between modules.
 */
import { useMemo } from "react";
import { useFlowStore, today, type EnergyState } from "@/lib/store";
import { useBemEstarStore } from "@/lib/bem-estar-store";
import { useCasaStore } from "@/lib/casa-store";
import { useTrackerStore } from "@/lib/tracker-store";

export type DayMood = "muito_baixo" | "baixo" | "neutro" | "bom" | "muito_bom";
export type DayAlert = "crise" | "atencao" | "estavel" | "otimo";

export interface DayContext {
  // Raw values
  moodValue: number | null; // -2 to 2
  moodLabel: DayMood;
  energy: EnergyState | null;
  sleepQuality: number | null; // 1-3
  sleepHours: number | null;
  medsTaken: number;
  medsTotal: number;
  medsAdherence: number; // 0-100%
  exerciseDone: boolean;
  exerciseMinutes: number;

  // Cross-module computed
  dayScore: number; // 0-100 composite score
  alertLevel: DayAlert;
  alertMessage: string;
  taskLimit: number; // max tasks for "hoje" based on mood+energy
  casaLimit: number; // max casa tasks based on mood+energy
  suggestedActions: string[];
  contextMessage: string; // adaptive message for the user
  consecutiveDaysWithoutData: number;

  // Stats
  tasksCompletedToday: number;
  tasksPending: number;
  tasksOverdue: number;
}

function moodToLabel(val: number | null): DayMood {
  if (val === null) return "neutro";
  if (val <= -2) return "muito_baixo";
  if (val === -1) return "baixo";
  if (val === 0) return "neutro";
  if (val === 1) return "bom";
  return "muito_bom";
}

function computeDayScore(ctx: {
  moodValue: number | null;
  sleepQuality: number | null;
  medsAdherence: number;
  exerciseDone: boolean;
  tasksCompletedToday: number;
  energy: EnergyState | null;
  consecutiveDaysWithoutData: number;
}): number {
  let score = 50; // baseline

  // Mood contribution (±20)
  if (ctx.moodValue !== null) {
    score += ctx.moodValue * 10; // -20 to +20
  }

  // Sleep contribution (0-15)
  if (ctx.sleepQuality !== null) {
    score += (ctx.sleepQuality - 1) * 7.5; // 0, 7.5, 15
  }

  // Medication adherence (0-15)
  score += (ctx.medsAdherence / 100) * 15;

  // Exercise bonus (0-10)
  if (ctx.exerciseDone) score += 10;

  // Task momentum (0-10)
  score += Math.min(ctx.tasksCompletedToday * 2, 10);

  // Data absence penalty — silence is a signal in bipolar condition
  if (ctx.consecutiveDaysWithoutData >= 1 && ctx.moodValue === null && ctx.sleepQuality === null) {
    score -= 10;
  }
  if (ctx.consecutiveDaysWithoutData >= 3) {
    score -= 20;
  }
  if (ctx.consecutiveDaysWithoutData >= 5) {
    score -= 30;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeAlert(score: number, moodValue: number | null, medsAdherence: number, consecutiveDaysWithoutData: number): { level: DayAlert; message: string } {
  // Data gap overrides — silence is dangerous in bipolar condition
  if (consecutiveDaysWithoutData >= 5) {
    return { level: "crise", message: `Voce esta sumido ha ${consecutiveDaysWithoutData} dias. Tudo bem? Registre como se sente.` };
  }
  if (consecutiveDaysWithoutData >= 3) {
    return { level: "atencao", message: `Voce esta sumido ha ${consecutiveDaysWithoutData} dias. Tudo bem? Que tal registrar como se sente?` };
  }
  if (consecutiveDaysWithoutData >= 2) {
    return { level: "atencao", message: `${consecutiveDaysWithoutData} dias sem dados. Que tal registrar como voce esta?` };
  }

  if (moodValue !== null && moodValue <= -2 && medsAdherence < 50) {
    return { level: "crise", message: "Humor muito baixo e medicacao pendente. Priorize so o essencial." };
  }
  if (score < 30 || (moodValue !== null && moodValue <= -2)) {
    return { level: "crise", message: "Dia dificil. Foque no basico: remedio, agua, descanso." };
  }
  if (score < 50 || (moodValue !== null && moodValue === -1)) {
    return { level: "atencao", message: "Energia moderada. Faca o possivel sem se cobrar." };
  }
  if (score >= 75) {
    return { level: "otimo", message: "Dia forte! Bom momento para tarefas estrategicas." };
  }
  return { level: "estavel", message: "Siga no seu ritmo. Tudo fluindo." };
}

function computeTaskLimits(energy: EnergyState | null, moodValue: number | null): { taskLimit: number; casaLimit: number } {
  const energyLimits: Record<string, { tasks: number; casa: number }> = {
    foco_total: { tasks: 10, casa: 5 },
    modo_leve: { tasks: 6, casa: 3 },
    basico: { tasks: 3, casa: 2 },
  };

  const base = energy ? energyLimits[energy] : { tasks: 6, casa: 3 };

  if (moodValue !== null && moodValue <= -2) {
    return { taskLimit: Math.min(base.tasks, 2), casaLimit: 1 };
  }
  if (moodValue !== null && moodValue === -1) {
    return { taskLimit: Math.max(2, base.tasks - 2), casaLimit: Math.max(1, base.casa - 1) };
  }
  if (moodValue !== null && moodValue >= 2) {
    return { taskLimit: base.tasks + 2, casaLimit: base.casa + 1 };
  }

  return { taskLimit: base.tasks, casaLimit: base.casa };
}

function computeSuggestions(ctx: {
  moodValue: number | null;
  medsAdherence: number;
  exerciseDone: boolean;
  sleepQuality: number | null;
  tasksCompletedToday: number;
  energy: EnergyState | null;
}): string[] {
  const suggestions: string[] = [];

  if (ctx.medsAdherence < 100) {
    suggestions.push("Tomar medicacao pendente");
  }
  if (!ctx.exerciseDone && ctx.moodValue !== null && ctx.moodValue <= 0) {
    suggestions.push("Uma caminhada leve pode ajudar o humor");
  }
  if (ctx.sleepQuality !== null && ctx.sleepQuality <= 1 && ctx.energy === "foco_total") {
    suggestions.push("Sono ruim — considere modo leve hoje");
  }
  if (ctx.tasksCompletedToday >= 5) {
    suggestions.push("Boa produtividade! Que tal uma pausa?");
  }
  if (ctx.moodValue !== null && ctx.moodValue >= 2 && ctx.energy !== "foco_total") {
    suggestions.push("Humor alto — aproveite para aumentar a energia");
  }

  return suggestions;
}

/** Count consecutive days without ANY health data (humor, sono, or meds) going back from yesterday */
function countConsecutiveDaysWithoutData(
  registrosHumor: { data: string }[],
  registrosSono: { data: string }[],
  registrosMed: { data: string }[],
): number {
  const todayDate = new Date();
  let count = 0;

  for (let i = 1; i <= 7; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const hasHumor = registrosHumor.some((r) => r.data === dateStr);
    const hasSono = registrosSono.some((r) => r.data === dateStr);
    const hasMed = registrosMed.some((r) => r.data === dateStr);

    if (!hasHumor && !hasSono && !hasMed) {
      count++;
    } else {
      break; // consecutive streak broken
    }
  }

  return count;
}

export function useDayContext(): DayContext {
  const { state } = useFlowStore();
  const bemEstar = useBemEstarStore();
  const casa = useCasaStore();
  const trackers = useTrackerStore();

  return useMemo(() => {
    const todayStr = today();
    const energy = state.current_energy;

    // Mood
    const todayHumor = state.registros_humor.find((r) => r.data === todayStr);
    const moodValue = todayHumor?.valor ?? null;

    // Sleep
    const todaySleep = state.registros_sono.find((r) => r.data === todayStr);
    const sleepQuality = todaySleep?.qualidade ?? null;
    const sleepHours = todaySleep?.duracao_min ? todaySleep.duracao_min / 60 : null;

    // Meds — neutral (50) when no meds registered, not inflated 100
    const todayMedRecords = state.registros_medicamento.filter((r) => r.data === todayStr);
    const totalMedSlots = state.medicamentos.reduce((sum, m) => sum + m.horarios.length, 0);
    const medsTaken = todayMedRecords.filter((r) => r.tomado).length;
    const medsAdherence = totalMedSlots > 0 ? Math.round((medsTaken / totalMedSlots) * 100) : 50;

    // Exercise
    const exerciseDone = bemEstar.exerciciosHoje.length > 0;
    const exerciseMinutes = bemEstar.exerciciosHoje.reduce((sum, e) => sum + e.duracao_min, 0);

    // Tasks
    const tasksCompletedToday = state.tasks.filter(
      (t) => t.status === "feito" && t.feito_em?.startsWith(todayStr)
    ).length;
    const tasksPending = state.tasks.filter(
      (t) => t.status !== "feito" && t.status !== "descartado"
    ).length;
    const tasksOverdue = state.tasks.filter(
      (t) => t.data_limite && t.data_limite < todayStr && t.status !== "feito" && t.status !== "descartado"
    ).length;

    // Consecutive days without data
    const consecutiveDaysWithoutData = countConsecutiveDaysWithoutData(
      state.registros_humor,
      state.registros_sono,
      state.registros_medicamento,
    );

    // Computed
    const dayScore = computeDayScore({ moodValue, sleepQuality, medsAdherence, exerciseDone, tasksCompletedToday, energy, consecutiveDaysWithoutData });
    const { level: alertLevel, message: alertMessage } = computeAlert(dayScore, moodValue, medsAdherence, consecutiveDaysWithoutData);
    const { taskLimit, casaLimit } = computeTaskLimits(energy, moodValue);
    const suggestedActions = computeSuggestions({ moodValue, medsAdherence, exerciseDone, sleepQuality, tasksCompletedToday, energy });

    const contextMessage = alertMessage;

    return {
      moodValue,
      moodLabel: moodToLabel(moodValue),
      energy,
      sleepQuality,
      sleepHours,
      medsTaken,
      medsTotal: totalMedSlots,
      medsAdherence,
      exerciseDone,
      exerciseMinutes,
      dayScore,
      alertLevel,
      alertMessage,
      taskLimit,
      casaLimit,
      suggestedActions,
      contextMessage,
      consecutiveDaysWithoutData,
      tasksCompletedToday,
      tasksPending,
      tasksOverdue,
    };
  }, [
    state.current_energy,
    state.registros_humor,
    state.registros_sono,
    state.registros_medicamento,
    state.medicamentos,
    state.tasks,
    bemEstar.exerciciosHoje,
  ]);
}
