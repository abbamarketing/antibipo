import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const AGENT_LABELS: Record<string, string> = {
  saude: "Saúde",
  humor: "Humor",
  metas: "Metas",
  financeiro: "Financeiro",
  calendario: "Calendário",
};

export default function AgentsDashboard() {
  const navigate = useNavigate();
  const hoje = new Date().toISOString().split("T")[0];

  const { data: relatorios } = useQuery({
    queryKey: ["agentes_relatorios", hoje],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("agentes_relatorios")
        .select("*")
        .eq("user_id", user.id)
        .eq("periodo", hoje)
        .order("agent");
      return data ?? [];
    },
  });

  const { data: orquestracao } = useQuery({
    queryKey: ["agentes_orquestracao", hoje],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("agentes_orquestracao")
        .select("*")
        .eq("user_id", user.id)
        .eq("periodo", hoje)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const statusColor: Record<string, "secondary" | "outline" | "destructive"> = {
    stable: "secondary",
    warning: "outline",
    crisis: "destructive",
  };

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-semibold">Painel de Agentes — {hoje}</h1>
      </div>

      {orquestracao && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm">Decisão da Orquestradora</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Score recalibrado:{" "}
              <strong>{orquestracao.day_score_recalibrated ?? "—"}</strong>
              {orquestracao.score_shift
                ? ` (${orquestracao.score_shift > 0 ? "+" : ""}${orquestracao.score_shift})`
                : ""}
            </p>
            {orquestracao.weight_adjustment_reason && (
              <p className="text-muted-foreground">
                {orquestracao.weight_adjustment_reason}
              </p>
            )}
            <p>Ordem de módulos: {orquestracao.module_order?.join(" → ")}</p>
            {orquestracao.depressive_precursor && (
              <Badge variant="destructive">
                Precursor depressivo:{" "}
                {Math.round((orquestracao.depressive_confidence ?? 0) * 100)}%
              </Badge>
            )}
            {orquestracao.manic_precursor && (
              <Badge variant="destructive">
                Precursor maníaco:{" "}
                {Math.round((orquestracao.manic_confidence ?? 0) * 100)}%
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {!orquestracao && !relatorios?.length && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nenhum relatório de agente disponível para hoje.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {relatorios
          ?.filter((r) => r.agent !== "orquestracao")
          .map((r) => (
            <Card key={r.agent}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  {AGENT_LABELS[r.agent] ?? r.agent}
                  <Badge
                    variant={statusColor[r.status] ?? "secondary"}
                  >
                    {r.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                {(r.patterns as string[] | null)?.length ? (
                  (r.patterns as string[]).map((p, i) => (
                    <p key={i} className="text-muted-foreground">
                      • {p}
                    </p>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    Sem padrões detectados hoje
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
