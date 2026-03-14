// AI provider usage tracking — hybrid persistence (localStorage + Supabase)
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "ai_provider_stats";

interface AIStats {
  lovable_ai: number;
  none: number;
}

function getLocalStats(): AIStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lovable_ai: 0, none: 0 };
}

function saveLocal(stats: AIStats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

async function persistToSupabase(stats: AIStats) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("configuracoes").upsert(
      { user_id: user.id, chave: "ai_stats", valor: stats as any },
      { onConflict: "user_id,chave" }
    );
  } catch (e) {
    console.warn("AI stats persist failed:", e);
  }
}

/** Load stats: Supabase first, localStorage fallback */
export async function getAIStats(): Promise<AIStats> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("configuracoes")
        .select("valor")
        .eq("user_id", user.id)
        .eq("chave", "ai_stats")
        .maybeSingle();
      if (data?.valor) {
        const remote = data.valor as unknown as AIStats;
        const local = getLocalStats();
        // Use whichever has more total usage (merge strategy)
        const remoteTotal = (remote.lovable_ai || 0) + (remote.none || 0);
        const localTotal = (local.lovable_ai || 0) + (local.none || 0);
        const best = remoteTotal >= localTotal ? remote : local;
        saveLocal(best);
        return best;
      }
    }
  } catch {}
  return getLocalStats();
}

/** Sync version for components that can't await */
export function getAIStatsSync(): AIStats {
  return getLocalStats();
}

export function trackAIProvider(provider: string) {
  const stats = getLocalStats();
  if (provider === "lovable_ai") stats.lovable_ai++;
  else stats.none++;
  saveLocal(stats);
  persistToSupabase(stats);
}

export async function resetAIStats() {
  localStorage.removeItem(STORAGE_KEY);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("configuracoes")
        .delete()
        .eq("user_id", user.id)
        .eq("chave", "ai_stats");
    }
  } catch {}
}
