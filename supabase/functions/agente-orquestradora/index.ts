import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authenticatedUserId = claimsData.claims.sub as string;

    const { user_id, triggeringAgent } = await req.json();
    if (user_id && user_id !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Forbidden: user_id mismatch" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveUserId = authenticatedUserId;
    const hoje = new Date().toISOString().split("T")[0];

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: relatorios } = await adminClient
      .from("agentes_relatorios").select("*").eq("user_id", effectiveUserId).eq("periodo", hoje)
      .in("agent", ["saude", "humor", "trabalho", "metas", "financeiro", "calendario"]);

    if (!relatorios || relatorios.length < 3) {
      return new Response(JSON.stringify({ skipped: true, reason: "Aguardando relatórios suficientes" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const byAgent: Record<string, any> = Object.fromEntries(relatorios.map((r: any) => [r.agent, r]));
    const saude = byAgent["saude"];
    const humor = byAgent["humor"];
    const trabalho = byAgent["trabalho"];
    const financeiro = byAgent["financeiro"];
    const calendario = byAgent["calendario"];

    const sonoRuim = (saude?.signals?.ruimNightsLast7 ?? 0) >= 3;
    const humorEmQueda = (humor?.signals?.trend ?? 0) < -0.5;
    const humorSubindo = (humor?.signals?.trend ?? 0) > 0.5;
    const medicacaoGap = (saude?.signals?.medGapDays ?? 0) >= 2;
    const spendingSpike = (financeiro?.signals?.spendMoodCorrelation ?? 0) >= 2;
    const tasksDrop = (trabalho?.signals?.completionDrop ?? 0) > 0.3;
    const isolamento = (calendario?.signals?.diasSemReuniao ?? 0) >= 7;

    let manicRisk = 0;
    if (humorSubindo) manicRisk += 0.3;
    if (sonoRuim && humorSubindo) manicRisk += 0.2;
    if (spendingSpike) manicRisk += 0.3;
    if ((humor?.signals?.velocity ?? 0) > 0.8) manicRisk += 0.2;

    let depressiveRisk = 0;
    if (humorEmQueda) depressiveRisk += 0.3;
    if (sonoRuim && humorEmQueda) depressiveRisk += 0.25;
    if (tasksDrop) depressiveRisk += 0.2;
    if (isolamento) depressiveRisk += 0.15;
    if (medicacaoGap) { depressiveRisk += 0.3; manicRisk += 0.1; }

    manicRisk = Math.min(manicRisk, 1.0);
    depressiveRisk = Math.min(depressiveRisk, 1.0);

    let weights: Record<string, number> = { humor: 0.20, sono: 0.15, medicamento: 0.25, exercicio: 0.10, tarefas: 0.20, energia: 0.10 };
    let weightReason = "Pesos padrão";

    if (depressiveRisk > 0.6) {
      weights = { humor: 0.25, sono: 0.20, medicamento: 0.30, exercicio: 0.10, tarefas: 0.05, energia: 0.10 };
      weightReason = "Padrão depressivo detectado — peso de medicação e sono elevados";
    } else if (manicRisk > 0.6) {
      weights = { humor: 0.20, sono: 0.20, medicamento: 0.30, exercicio: 0.10, tarefas: 0.10, energia: 0.10 };
      weightReason = "Padrão maníaco detectado — vigilância em sono e medicação";
    } else if (sonoRuim) {
      weights = { humor: 0.20, sono: 0.20, medicamento: 0.25, exercicio: 0.10, tarefas: 0.10, energia: 0.15 };
      weightReason = "Sono degradando — peso de sono elevado";
    }

    const moduleScores: Record<string, number> = {
      saude: saude?.status === "crisis" ? 3 : saude?.status === "warning" ? 2 : 0,
      trabalho: trabalho?.status === "crisis" ? 3 : trabalho?.status === "warning" ? 2 : 0,
      financeiro: financeiro?.status === "crisis" ? 3 : financeiro?.status === "warning" ? 1 : 0,
      calendario: calendario?.status === "crisis" ? 2 : calendario?.status === "warning" ? 1 : 0,
      metas: byAgent["metas"]?.status === "crisis" ? 2 : 0,
      casa: 0,
    };
    const moduleOrder = Object.entries(moduleScores).sort(([, a], [, b]) => b - a).map(([k]) => k);

    const alerts: object[] = [];
    if (manicRisk > 0.6) alerts.push({
      severity: "warning", title: "Padrão possível de episódio maníaco detectado",
      body: `Confiança: ${Math.round(manicRisk * 100)}%. Sono, humor e gastos combinados sugerem atenção.`,
      module_focus: "saude", recommended_action: "Verificar medicação",
    });
    if (depressiveRisk > 0.6) alerts.push({
      severity: "warning", title: "Padrão possível de episódio depressivo detectado",
      body: `Confiança: ${Math.round(depressiveRisk * 100)}%. Sono e humor combinados. Medicação é a âncora.`,
      module_focus: "saude", recommended_action: "Registrar medicação",
    });
    if (medicacaoGap) alerts.push({
      severity: "error", title: `${saude?.signals?.medGapDays} dias sem registrar medicação`,
      body: "Medicação é o tratamento central. Registrar agora.",
      module_focus: "saude", recommended_action: "Registrar agora",
    });

    await adminClient.from("agentes_orquestracao").upsert(
      {
        user_id: effectiveUserId, periodo: hoje,
        manic_precursor: manicRisk > 0.6,
        depressive_precursor: depressiveRisk > 0.6,
        manic_confidence: parseFloat(manicRisk.toFixed(2)),
        depressive_confidence: parseFloat(depressiveRisk.toFixed(2)),
        weights, weight_adjustment_reason: weightReason,
        module_order: moduleOrder,
        modules_to_show: moduleOrder.slice(0, 4),
        nudge_tone: depressiveRisk > 0.5 ? "acolhedor" : manicRisk > 0.5 ? "atencioso" : "neutro",
        nudge_focus: medicacaoGap ? "medicacao" : sonoRuim ? "sono" : humorEmQueda ? "humor" : "geral",
        nudge_factual_base: relatorios.flatMap((r: any) => r.patterns ?? []).slice(0, 3).join("; ") || null,
        meds_adherence_7d: saude?.signals?.adherencePct ?? null,
        meds_status: medicacaoGap ? "gap" : "ok",
        meds_as_anchor: medicacaoGap || depressiveRisk > 0.5,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,periodo" }
    );

    // Send push notification if crisis alerts exist and user opted in
    if (alerts.length > 0) {
      const { data: config } = await adminClient
        .from("agentes_config").select("notify_on_crisis").eq("user_id", effectiveUserId).single();
      if (config?.notify_on_crisis) {
        adminClient.functions
          .invoke("send-push", { body: { user_id: effectiveUserId, alert: alerts[0] } })
          .catch((e: any) => console.error("Push notification failed:", e));
      }
    }

    return new Response(JSON.stringify({ manicRisk, depressiveRisk, moduleOrder, alerts, triggeringAgent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agente-orquestradora error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
