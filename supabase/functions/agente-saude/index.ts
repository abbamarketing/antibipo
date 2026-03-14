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

    // 2. Validate user_id from body
    const { user_id, trigger } = await req.json();
    if (user_id && user_id !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Forbidden: user_id mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveUserId = authenticatedUserId;
    const hoje = new Date().toISOString().split("T")[0];
    const trintaDiasAtras = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

    // 3. Fetch data using service role (bypasses RLS for cross-table reads)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const [{ data: meds }, { data: sono }, { data: humor }, { data: medicamentos }] =
      await Promise.all([
        adminClient
          .from("registros_medicamento")
          .select("*")
          .eq("user_id", effectiveUserId)
          .gte("data", trintaDiasAtras),
        adminClient
          .from("registros_sono")
          .select("*")
          .eq("user_id", effectiveUserId)
          .gte("data", trintaDiasAtras)
          .order("data", { ascending: false }),
        adminClient
          .from("registros_humor")
          .select("*")
          .eq("user_id", effectiveUserId)
          .gte("data", trintaDiasAtras)
          .order("data", { ascending: false }),
        adminClient
          .from("medicamentos")
          .select("*")
          .eq("user_id", effectiveUserId),
      ]);

    // 4. Calculate signals
    const totalSlots = medicamentos?.length ? medicamentos.length * 30 : 0;
    const totalTaken = meds?.filter((m: any) => m.tomado)?.length ?? 0;
    const adherencePct = totalSlots > 0 ? Math.round((totalTaken / totalSlots) * 100) : null;

    const recentSleep = sono?.slice(0, 7) ?? [];
    const avgSleepQuality = recentSleep.length
      ? recentSleep.reduce((s: number, r: any) => s + (r.qualidade ?? 2), 0) / recentSleep.length
      : null;
    const ruimNightsLast7 = recentSleep.filter((r: any) => (r.qualidade ?? 2) < 2).length;

    const recentMood = humor?.slice(0, 7) ?? [];
    const moodValues = recentMood.map((r: any) => r.valor ?? 0);
    const moodFloor = moodValues.length ? Math.min(...moodValues) : null;
    const consecutiveLowMood = (() => {
      let count = 0;
      for (const v of moodValues) {
        if (v <= -1) count++;
        else break;
      }
      return count;
    })();

    const medGapDays = (() => {
      if (!meds?.length) return 0;
      const sorted = [...meds].sort((a: any, b: any) => b.data.localeCompare(a.data));
      const lastMed = new Date(sorted[0].data);
      return Math.floor((Date.now() - lastMed.getTime()) / 86400000);
    })();

    // 5. Detect patterns
    const patterns: string[] = [];
    if (adherencePct !== null && adherencePct < 80)
      patterns.push(`Adesão à medicação: ${adherencePct}% (abaixo de 80%)`);
    if (ruimNightsLast7 >= 3)
      patterns.push(`${ruimNightsLast7} noites de sono ruim nos últimos 7 dias`);
    if (consecutiveLowMood >= 3)
      patterns.push(`${consecutiveLowMood} dias consecutivos com humor negativo`);
    if (medGapDays >= 2)
      patterns.push(`Gap de ${medGapDays} dias sem registrar medicação`);

    const status = patterns.length >= 2 ? "crisis" : patterns.length === 1 ? "warning" : "stable";

    // 6. Upsert report
    await adminClient.from("agentes_relatorios").upsert(
      {
        user_id: effectiveUserId,
        agent: "saude",
        tipo: "saude",
        periodo: hoje,
        status,
        signals: { adherencePct, avgSleepQuality, ruimNightsLast7, moodFloor, consecutiveLowMood, medGapDays },
        patterns,
        context: { trigger, windowDays: 30 },
      },
      { onConflict: "user_id,agent,periodo" }
    );

    // 7. Fire-and-forget call to orchestrator (don't await)
    adminClient.functions
      .invoke("agente-orquestradora", {
        body: { user_id: effectiveUserId, triggeringAgent: "saude" },
      })
      .catch((e: any) => console.error("Orchestrator call failed:", e));

    return new Response(JSON.stringify({ status, patterns }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agente-saude error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
