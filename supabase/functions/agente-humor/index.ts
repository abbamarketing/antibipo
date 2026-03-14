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

    const { user_id, trigger } = await req.json();
    if (user_id && user_id !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Forbidden: user_id mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveUserId = authenticatedUserId;
    const hoje = new Date().toISOString().split("T")[0];
    const sessentaDiasAtras = new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0];

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: humor } = await adminClient
      .from("registros_humor")
      .select("*")
      .eq("user_id", effectiveUserId)
      .gte("data", sessentaDiasAtras)
      .order("data", { ascending: false });

    const moodValues7d = (humor?.slice(0, 7) ?? []).map((r: any) => r.valor ?? 0);
    const moodValues30d = (humor?.slice(0, 30) ?? []).map((r: any) => r.valor ?? 0);

    const avg7d = moodValues7d.length ? moodValues7d.reduce((s: number, v: number) => s + v, 0) / moodValues7d.length : 0;
    const avg30d = moodValues30d.length ? moodValues30d.reduce((s: number, v: number) => s + v, 0) / moodValues30d.length : 0;
    const trend = avg7d - avg30d;

    const velocity = moodValues7d.length >= 2
      ? moodValues7d.slice(0, -1).reduce((sum: number, v: number, i: number) => sum + Math.abs(v - moodValues7d[i + 1]), 0) / (moodValues7d.length - 1)
      : 0;

    const ceiling7d = moodValues7d.length ? Math.max(...moodValues7d) : null;
    const floor7d = moodValues7d.length ? Math.min(...moodValues7d) : null;

    const manicSign = trend > 0.5 && velocity > 0.8 && (ceiling7d ?? 0) >= 1 ? Math.min(trend * velocity, 1.0) : 0;
    const depressiveSign = trend < -0.5 && (floor7d ?? 0) <= -1 ? Math.min(Math.abs(trend) * 0.8, 1.0) : 0;

    const patterns: string[] = [];
    if (manicSign > 0.5) patterns.push(`Humor subindo rapidamente (velocity ${velocity.toFixed(2)}/dia) — possível sinal maníaco`);
    if (depressiveSign > 0.5) patterns.push(`Humor em queda consistente (trend ${trend.toFixed(2)}) — possível sinal depressivo`);
    if (velocity > 1.0) patterns.push("Alta volatilidade de humor nos últimos 7 dias");

    const status = (manicSign > 0.7 || depressiveSign > 0.7) ? "crisis" : patterns.length > 0 ? "warning" : "stable";

    await adminClient.from("agentes_relatorios").upsert(
      {
        user_id: effectiveUserId,
        agent: "humor",
        tipo: "humor",
        periodo: hoje,
        status,
        signals: { avg7d, avg30d, trend, velocity, ceiling7d, floor7d, manicSign, depressiveSign },
        patterns,
        episode_risk: { manicSign, depressiveSign },
      },
      { onConflict: "user_id,agent,periodo" }
    );

    // Fire-and-forget
    adminClient.functions
      .invoke("agente-orquestradora", { body: { user_id: effectiveUserId, triggeringAgent: "humor" } })
      .catch((e: any) => console.error("Orchestrator call failed:", e));

    return new Response(JSON.stringify({ status, patterns, manicSign, depressiveSign }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agente-humor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
