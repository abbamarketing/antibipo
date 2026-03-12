// Activity logger — records all user actions for AI context/memory
import { supabase } from "@/integrations/supabase/client";

export type ActivityAction =
  | "energia_selecionada"
  | "tarefa_capturada"
  | "tarefa_concluida"
  | "tarefa_empurrada"
  | "tarefa_delegada"
  | "medicamento_tomado"
  | "medicamento_adicionado"
  | "humor_registrado"
  | "sono_dormir"
  | "sono_acordar"
  | "modulo_alterado"
  | "casa_tarefa_concluida"
  | "casa_comodo_concluido"
  | "captura_rapida"
  | "tarefa_casa_concluida"
  | "item_compra_adicionado"
  | "diario_registrado"
  | "escovacao"
  | "onboarding_concluido"
  | "peso_registrado"
  | "exercicio_registrado"
  | "refeicao_registrada"
  | "tracker_concluido"
  | "tracker_criado"
  | "mood_checkin"
  | "analise_dia"
  | "tarefa_movida"
  | "subtarefa_concluida"
  | "tarefa_estruturada_criada";

const CONSOLIDATION_THRESHOLD = 100;

export async function logActivity(
  acao: ActivityAction,
  detalhes?: Record<string, unknown>,
  contexto?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("Activity log skipped: no user");
      return;
    }

    const { error } = await supabase.from("activity_log" as any).insert([{
      acao,
      detalhes: (detalhes || {}) as any,
      contexto: contexto || null,
      user_id: user.id,
    }] as any);

    if (error) {
      console.error("Activity log insert failed:", error);
      return;
    }

    // Check if we've hit the consolidation threshold
    checkAndConsolidate(user.id);
  } catch (e) {
    console.error("Activity log failed:", e);
  }
}

async function checkAndConsolidate(userId: string) {
  try {
    const { count, error } = await supabase
      .from("activity_log" as any)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error || !count) return;

    if (count >= CONSOLIDATION_THRESHOLD) {
      console.log(`Activity log hit ${count} entries, triggering consolidation...`);
      
      // Call edge function to consolidate
      const { error: fnError } = await supabase.functions.invoke("consolidate-logs", {
        body: { user_id: userId },
      });

      if (fnError) {
        console.error("Consolidation failed:", fnError);
      }
    }
  } catch (e) {
    console.error("Consolidation check failed:", e);
  }
}
