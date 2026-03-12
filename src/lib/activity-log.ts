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
  | "tarefa_estruturada_criada"
  | "tarefa_excluida";

// Consolidate every 200 logs, keeping the last 100 for AI context
const CONSOLIDATION_THRESHOLD = 200;

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
      console.log(`Activity log hit ${count} entries, triggering consolidation (keeping last 100)...`);
      
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

/** Get the last 100 logs for AI context */
export async function getRecentLogsForAI(userId?: string): Promise<any[]> {
  try {
    let query = supabase
      .from("activity_log" as any)
      .select("*")
      .order("criado_em", { ascending: false })
      .limit(100);
    
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("Failed to get recent logs for AI:", e);
    return [];
  }
}

/** Get total log count (active + consolidated) for download threshold */
export async function getTotalLogCount(userId: string): Promise<{ active: number; consolidated: number; total: number }> {
  try {
    const { count: activeCount } = await supabase
      .from("activity_log" as any)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { data: consolidated } = await supabase
      .from("log_consolidado")
      .select("metricas")
      .eq("tipo", "activity_batch");

    let consolidatedCount = 0;
    if (consolidated) {
      consolidated.forEach((c: any) => {
        consolidatedCount += (c.metricas as any)?.total_logs || 0;
      });
    }

    const active = activeCount || 0;
    return { active, consolidated: consolidatedCount, total: active + consolidatedCount };
  } catch {
    return { active: 0, consolidated: 0, total: 0 };
  }
}

/** Export all logs (active + consolidated details) as JSON */
export async function exportAllLogs(userId: string): Promise<any[]> {
  try {
    // Get active logs
    const { data: activeLogs } = await supabase
      .from("activity_log" as any)
      .select("*")
      .eq("user_id", userId)
      .order("criado_em", { ascending: true });

    // Get consolidated batches
    const { data: batches } = await supabase
      .from("log_consolidado")
      .select("*")
      .eq("tipo", "activity_batch")
      .order("periodo_inicio", { ascending: true });

    const allLogs: any[] = [];

    // Add consolidated logs from batches
    if (batches) {
      batches.forEach((batch: any) => {
        const details = batch.detalhes as any[];
        if (details) {
          allLogs.push(...details);
        }
      });
    }

    // Add active logs
    if (activeLogs) {
      allLogs.push(...activeLogs);
    }

    return allLogs;
  } catch (e) {
    console.error("Export logs failed:", e);
    return [];
  }
}
