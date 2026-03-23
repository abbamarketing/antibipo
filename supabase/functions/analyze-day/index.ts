import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // 1. Verify JWT — create user-scoped client
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authenticatedUserId = claimsData.claims.sub as string;

    // 2. Compare user_id from body with authenticated user
    const { user_id, date } = await req.json();
    if (user_id && user_id !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Forbidden: user_id mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveUserId = authenticatedUserId;
    const targetDate = date || new Date().toISOString().split("T")[0];

    // 3. All queries use user-scoped client with explicit user_id filter (RLS + defense in depth)
    const [
      { data: tasks },
      { data: logs },
      { data: humor },
      { data: sono },
      { data: trackerRegs },
    ] = await Promise.all([
      userClient
        .from("tasks")
        .select("titulo, status, modulo, urgencia, feito_em, criado_em")
        .eq("user_id", effectiveUserId)
        .or(`feito_em.gte.${targetDate}T00:00:00,and(status.neq.feito,status.neq.descartado)`),
      userClient
        .from("activity_log")
        .select("acao, detalhes, criado_em")
        .eq("user_id", effectiveUserId)
        .gte("criado_em", `${targetDate}T00:00:00`)
        .lte("criado_em", `${targetDate}T23:59:59`)
        .order("criado_em"),
      userClient
        .from("registros_humor")
        .select("valor, notas")
        .eq("user_id", effectiveUserId)
        .eq("data", targetDate)
        .maybeSingle(),
      userClient
        .from("registros_sono")
        .select("duracao_min, qualidade")
        .eq("user_id", effectiveUserId)
        .eq("data", targetDate)
        .maybeSingle(),
      userClient
        .from("tracker_registros")
        .select("tracker_id, dados")
        .eq("user_id", effectiveUserId)
        .eq("data", targetDate),
    ]);

    const completed = (tasks || []).filter((t: any) => t.status === "feito" && t.feito_em?.startsWith(targetDate));
    const notCompleted = (tasks || []).filter((t: any) => t.status !== "feito" && t.status !== "descartado");

    const summary = {
      data: targetDate,
      tarefas_concluidas: completed.length,
      tarefas_pendentes: notCompleted.length,
      humor: humor?.valor,
      sono_qualidade: sono?.qualidade,
      sono_duracao: sono?.duracao_min,
      trackers_feitos: (trackerRegs || []).length,
      acoes_no_dia: (logs || []).length,
      tarefas_concluidas_lista: completed.map((t: any) => t.titulo),
      tarefas_pendentes_lista: notCompleted.slice(0, 10).map((t: any) => ({ titulo: t.titulo, modulo: t.modulo, urgencia: t.urgencia })),
    };

    // Track missing data explicitly
    const dadosAusentes: string[] = [];
    if (summary.humor === undefined) dadosAusentes.push("humor");
    if (summary.sono_qualidade === undefined) dadosAusentes.push("sono");
    // Check if user has meds but none were taken
    const { data: userMeds } = await userClient
      .from("medicamentos")
      .select("id")
      .eq("user_id", effectiveUserId)
      .limit(1);
    const hasMeds = (userMeds?.length || 0) > 0;
    const { data: todayMedRecords } = await userClient
      .from("registros_medicamento")
      .select("id")
      .eq("user_id", effectiveUserId)
      .eq("data", targetDate)
      .limit(1);
    if (hasMeds && (!todayMedRecords || todayMedRecords.length === 0)) dadosAusentes.push("medicacao");

    // Force alert level when critical data is missing
    const forceVermelho = summary.humor === undefined && summary.sono_qualidade === undefined;

    // Generate AI analysis if API key available
    let analise = null;
    let ai_provider = "none";
    if (LOVABLE_API_KEY) {
      const humorStr = summary.humor !== undefined
        ? String(summary.humor)
        : "humor: NAO REGISTRADO (dado clinico relevante)";
      const sonoStr = summary.sono_qualidade
        ? `qualidade ${summary.sono_qualidade}/3, ${summary.sono_duracao ? Math.round(summary.sono_duracao / 60) + "h" : ""}`
        : "sono: NAO REGISTRADO (possivel privacao ou esquecimento)";
      const medStr = dadosAusentes.includes("medicacao")
        ? "medicacao: NAO REGISTRADO (risco de nao-adesao)"
        : "registrada";

      const prompt = `Analise o dia do usuario com transtorno bipolar e gere um resumo breve (max 3 frases) sobre produtividade, bem-estar e sugestoes para o dia seguinte.

IMPORTANTE: dados ausentes sao tao relevantes quanto dados presentes. Se algum registro critico (humor, sono, medicacao) estiver ausente, inclua isso na analise e sugira captura imediata.

Dados do dia ${targetDate}:
- Tarefas concluidas: ${summary.tarefas_concluidas} (${summary.tarefas_concluidas_lista.join(", ") || "nenhuma"})
- Tarefas pendentes: ${summary.tarefas_pendentes}
- Humor: ${humorStr}
- Sono: ${sonoStr}
- Medicacao: ${medStr}
- Dados ausentes: ${dadosAusentes.length > 0 ? dadosAusentes.join(", ") : "nenhum"}
- Trackers completados: ${summary.trackers_feitos}
- Acoes registradas: ${summary.acoes_no_dia}

Responda em JSON: {"resumo": "...", "sugestoes": ["..."], "alerta": "verde|amarelo|vermelho"}`;

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "Voce analisa dados de saude mental e produtividade de um usuario com transtorno bipolar. Dados ausentes sao sinais clinicos relevantes. Responda APENAS em JSON valido." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (response.ok) {
          ai_provider = "lovable_ai";
          const result = await response.json();
          const content = result.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analise = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.error("AI analysis failed:", e);
      }
    }

    // Override alert to vermelho if both humor and sono are missing
    if (forceVermelho && analise) {
      analise.alerta = "vermelho";
    }

    // 4. Service role client ONLY for privileged upsert to log_consolidado
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    await adminClient.from("log_consolidado").upsert({
      tipo: "diario",
      periodo_inicio: targetDate,
      periodo_fim: targetDate,
      user_id: effectiveUserId,
      resumo: analise?.resumo || `${summary.tarefas_concluidas} tarefas concluidas, ${summary.tarefas_pendentes} pendentes.`,
      metricas: { ...summary, dados_ausentes: dadosAusentes },
      detalhes: analise ? [analise] : [],
    }, { onConflict: "tipo,periodo_inicio,periodo_fim" });

    return new Response(JSON.stringify({ summary, analise, ai_provider }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-day error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
