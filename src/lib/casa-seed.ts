// Auto-generates default household tasks based on profile data
import { supabase } from "@/integrations/supabase/client";

type SeedTask = {
  comodo: string;
  tarefa: string;
  frequencia: string;
  tempo_min: number;
};

const TAREFAS_BASE: SeedTask[] = [
  // Cozinha
  { comodo: "Cozinha", tarefa: "Lavar louça", frequencia: "diario", tempo_min: 15 },
  { comodo: "Cozinha", tarefa: "Limpar fogão", frequencia: "semanal", tempo_min: 10 },
  { comodo: "Cozinha", tarefa: "Limpar geladeira", frequencia: "quinzenal", tempo_min: 20 },
  { comodo: "Cozinha", tarefa: "Limpar microondas", frequencia: "semanal", tempo_min: 5 },
  { comodo: "Cozinha", tarefa: "Passar pano no chão", frequencia: "semanal", tempo_min: 10 },

  // Sala
  { comodo: "Sala", tarefa: "Aspirar/varrer", frequencia: "semanal", tempo_min: 15 },
  { comodo: "Sala", tarefa: "Tirar pó dos móveis", frequencia: "semanal", tempo_min: 10 },
  { comodo: "Sala", tarefa: "Organizar almofadas e cobertores", frequencia: "diario", tempo_min: 5 },

  // Banheiro
  { comodo: "Banheiro", tarefa: "Limpar vaso sanitário", frequencia: "semanal", tempo_min: 10 },
  { comodo: "Banheiro", tarefa: "Limpar box", frequencia: "semanal", tempo_min: 10 },
  { comodo: "Banheiro", tarefa: "Limpar pia e espelho", frequencia: "semanal", tempo_min: 5 },
  { comodo: "Banheiro", tarefa: "Trocar toalhas", frequencia: "semanal", tempo_min: 5 },

  // Quarto
  { comodo: "Quarto", tarefa: "Arrumar a cama", frequencia: "diario", tempo_min: 5 },
  { comodo: "Quarto", tarefa: "Trocar roupa de cama", frequencia: "quinzenal", tempo_min: 15 },
  { comodo: "Quarto", tarefa: "Organizar guarda-roupa", frequencia: "mensal", tempo_min: 30 },

  // Lavanderia
  { comodo: "Lavanderia", tarefa: "Lavar roupa", frequencia: "semanal", tempo_min: 15 },
  { comodo: "Lavanderia", tarefa: "Estender/recolher roupa", frequencia: "semanal", tempo_min: 10 },
  { comodo: "Lavanderia", tarefa: "Passar roupa", frequencia: "semanal", tempo_min: 30 },

  // Área geral
  { comodo: "Geral", tarefa: "Tirar lixo", frequencia: "diario", tempo_min: 5 },
  { comodo: "Geral", tarefa: "Limpar janelas", frequencia: "mensal", tempo_min: 20 },
];

const TAREFAS_PETS: SeedTask[] = [
  { comodo: "Geral", tarefa: "Limpar área dos pets", frequencia: "diario", tempo_min: 10 },
  { comodo: "Geral", tarefa: "Trocar água dos pets", frequencia: "diario", tempo_min: 3 },
  { comodo: "Geral", tarefa: "Aspirar pelos", frequencia: "semanal", tempo_min: 15 },
];

export async function seedTarefasCasa(profile: {
  casa_comodos?: number | null;
  casa_pets?: boolean | null;
  casa_frequencia_ideal?: string | null;
}) {
  // Check if already has tasks
  const { count } = await supabase
    .from("tarefas_casa" as any)
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    console.log("Casa tasks already seeded, skipping");
    return;
  }

  let tarefas = [...TAREFAS_BASE];

  // Add pet tasks
  if (profile.casa_pets) {
    tarefas = [...tarefas, ...TAREFAS_PETS];
  }

  // Adjust frequency based on preference
  if (profile.casa_frequencia_ideal === "diaria") {
    // Upgrade some weekly tasks to daily
    tarefas = tarefas.map((t) =>
      t.frequencia === "semanal" && t.tempo_min <= 10
        ? { ...t, frequencia: "diario" }
        : t
    );
  } else if (profile.casa_frequencia_ideal === "quando_da") {
    // Downgrade daily to semanal, semanal to quinzenal
    tarefas = tarefas.map((t) => {
      if (t.tarefa === "Arrumar a cama" || t.tarefa === "Tirar lixo") return t; // keep essential dailies
      if (t.frequencia === "diario") return { ...t, frequencia: "semanal" };
      if (t.frequencia === "semanal") return { ...t, frequencia: "quinzenal" };
      return t;
    });
  }

  // If few rooms, reduce tasks
  const numComodos = profile.casa_comodos || 5;
  if (numComodos <= 3) {
    // Remove lavanderia as separate room, keep essentials
    tarefas = tarefas.filter(
      (t) => t.comodo !== "Lavanderia" || t.tarefa === "Lavar roupa"
    );
  }

  const { error } = await supabase
    .from("tarefas_casa" as any)
    .insert(tarefas.map((t) => ({ ...t, ativo: true })) as any);

  if (error) {
    console.error("Failed to seed casa tasks:", error);
  } else {
    console.log(`Seeded ${tarefas.length} casa tasks`);
  }
}
