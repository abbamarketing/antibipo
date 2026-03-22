import type { EnergyState } from "@/lib/store";

export const ENERGY_DESCRIPTIONS: Record<EnergyState, string> = {
  foco_total: "Foco total — tarefas estratégicas e de alto impacto",
  modo_leve: "Modo leve — ritmo moderado, tarefas operacionais",
  basico: "Só o básico — foque no essencial: remédio, água, descanso",
};
