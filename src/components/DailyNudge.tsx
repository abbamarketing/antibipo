import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    <p className="font-mono text-[11px] leading-relaxed text-foreground/80">
      {data.message}
    </p>
  );
}
