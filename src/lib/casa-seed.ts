// Auto-generates default household tasks based on profile data
import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";

type SeedTask = {
  comodo: string;
  tarefa: string;
  frequencia: string;
  tempo_min: number;
};

// Minimal base tasks — casa acts as a database, daily view pulls what's due
const TAREFAS_BASE: SeedTask[] = [
  { comodo: "Cozinha", tarefa: "Lavar louça", frequencia: "diario", tempo_min: 15 },
  { comodo: "Cozinha", tarefa: "Limpar fogão", frequencia: "semanal", tempo_min: 10 },
  { comodo: "Banheiro", tarefa: "Limpar vaso e pia", frequencia: "semanal", tempo_min: 10 },
  { comodo: "Quarto", tarefa: "Arrumar a cama", frequencia: "diario", tempo_min: 5 },
  { comodo: "Quarto", tarefa: "Trocar roupa de cama", frequencia: "quinzenal", tempo_min: 15 },
  { comodo: "Sala", tarefa: "Aspirar/varrer", frequencia: "semanal", tempo_min: 15 },
  { comodo: "Geral", tarefa: "Tirar lixo", frequencia: "diario", tempo_min: 5 },
  { comodo: "Lavanderia", tarefa: "Lavar roupa", frequencia: "semanal", tempo_min: 15 },
];

const TAREFAS_PETS: SeedTask[] = [
  { comodo: "Geral", tarefa: "Limpar área dos pets", frequencia: "diario", tempo_min: 10 },
];

export async function seedTarefasCasa(profile: {
  casa_comodos?: number | null;
  casa_pets?: boolean | null;
  casa_frequencia_ideal?: string | null;
}, queryClient?: QueryClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("No user for casa seed");
    return;
  }

  const { count } = await supabase
    .from("tarefas_casa" as any)
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    console.log("Casa tasks already seeded, skipping");
    return;
  }

  let tarefas = [...TAREFAS_BASE];

  if (profile.casa_pets) {
    tarefas = [...tarefas, ...TAREFAS_PETS];
  }

  // Adjust frequency based on preference
  if (profile.casa_frequencia_ideal === "quando_da") {
    tarefas = tarefas.map((t) => {
      if (t.tarefa === "Arrumar a cama" || t.tarefa === "Tirar lixo") return t;
      if (t.frequencia === "diario") return { ...t, frequencia: "semanal" };
      if (t.frequencia === "semanal") return { ...t, frequencia: "quinzenal" };
      return t;
    });
  }

  // If few rooms, simplify
  const numComodos = profile.casa_comodos || 5;
  if (numComodos <= 3) {
    tarefas = tarefas.filter((t) => t.comodo !== "Lavanderia");
  }

  const { error } = await supabase
    .from("tarefas_casa" as any)
    .insert(tarefas.map((t) => ({ ...t, ativo: true })) as any);

  if (error) {
    console.error("Failed to seed casa tasks:", error);
  } else {
    console.log(`Seeded ${tarefas.length} casa tasks`);
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ["tarefas_casa"] });
    }
  }
}
