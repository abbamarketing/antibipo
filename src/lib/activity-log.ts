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
  | "escovacao";

export async function logActivity(
  acao: ActivityAction,
  detalhes?: Record<string, unknown>,
  contexto?: string
) {
  try {
    await supabase.from("activity_log").insert([{
      acao,
      detalhes: (detalhes || {}) as any,
      contexto: contexto || null,
    }]);
  } catch (e) {
    console.error("Activity log failed:", e);
  }
}
