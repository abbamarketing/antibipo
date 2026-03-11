import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ActivityLogPage() {
  const navigate = useNavigate();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["activity_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const actionLabels: Record<string, string> = {
    energia_selecionada: "Energia",
    tarefa_capturada: "Tarefa criada",
    tarefa_concluida: "Tarefa concluída",
    tarefa_empurrada: "Tarefa empurrada",
    tarefa_delegada: "Tarefa delegada",
    medicamento_tomado: "Remédio tomado",
    medicamento_adicionado: "Remédio adicionado",
    humor_registrado: "Humor",
    sono_dormir: "Sono — dormiu",
    sono_acordar: "Sono — acordou",
    modulo_alterado: "Módulo alterado",
    casa_tarefa_concluida: "Casa — tarefa",
    casa_comodo_concluido: "Casa — cômodo",
    captura_rapida: "Captura rápida",
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        <header className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h1 className="font-mono text-lg font-bold tracking-tight">LOG DE ATIVIDADE</h1>
          </div>
        </header>

        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground font-mono py-12">
            Carregando...
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-card rounded-lg border p-8 text-center">
            <Activity className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => {
              const detalhes = log.detalhes as Record<string, unknown> | null;
              return (
                <div key={log.id} className="bg-card rounded-lg border p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary tracking-wider">
                        {actionLabels[log.acao] || log.acao}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                        {formatTime(log.criado_em)}
                      </span>
                    </div>
                    {detalhes && (
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {Object.entries(detalhes)
                          .filter(([k]) => k !== "hora")
                          .map(([k, v]) => (
                            <span key={k} className="text-[11px] text-muted-foreground">
                              <span className="text-muted-foreground/60">{k}:</span>{" "}
                              {String(v)}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
