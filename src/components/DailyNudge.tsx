import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

export function DailyNudge() {
  const { data } = useQuery({
    queryKey: ["daily-nudge"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("daily-nudge");
      if (error) throw error;
      return data as { message: string };
    },
    staleTime: 60 * 60 * 1000, // 1h cache
    retry: 1,
  });

  if (!data?.message) return null;

  return (
    <div className="flex items-start gap-2">
      <Sparkles className="w-3 h-3 text-primary mt-0.5 shrink-0" />
      <p className="font-mono text-[11px] leading-relaxed text-foreground/80">
        {data.message}
      </p>
    </div>
  );
}
