// AI provider usage tracking — stores counts in localStorage

const STORAGE_KEY = "ai_provider_stats";

interface AIStats {
  gemini_direct: number;
  lovable_ai: number;
  none: number;
}

export function getAIStats(): AIStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { gemini_direct: 0, lovable_ai: 0, none: 0 };
}

export function trackAIProvider(provider: string) {
  const stats = getAIStats();
  if (provider === "gemini_direct") stats.gemini_direct++;
  else if (provider === "lovable_ai") stats.lovable_ai++;
  else stats.none++;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function resetAIStats() {
  localStorage.removeItem(STORAGE_KEY);
}
