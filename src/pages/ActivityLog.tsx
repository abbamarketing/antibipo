import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Activity, Download, Database, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTotalLogCount, exportAllLogs } from "@/lib/activity-log";
import { useState } from "react";
import { toast } from "sonner";

export default function ActivityLogPage() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

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

  const { data: stats } = useQuery({
    queryKey: ["activity_log_stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { active: 0, consolidated: 0, total: 0 };
      return getTotalLogCount(user.id);
    },
  });

  const canDownload = (stats?.total || 0) >= 1000;

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const allLogs = await exportAllLogs(user.id);
      const blob = new Blob([JSON.stringify(allLogs, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${allLogs.length} logs exportados com sucesso`);
    } catch {
      toast.error("Erro ao exportar logs");
    } finally {
      setExporting(false);
    }
  };

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
        <header className="flex items-center gap-3 mb-4">
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

        {/* Stats bar */}
        {stats && (
          <div className="bg-card rounded-lg border p-3 mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">Ativos:</span>
                <span className="font-bold">{stats.active}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Consolidados:</span>
                <span className="font-bold">{stats.consolidated}</span>
              </div>
              <div className="text-muted-foreground">
                Total: <span className="font-bold text-foreground">{stats.total}</span>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={!canDownload || exporting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                canDownload
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              }`}
              title={canDownload ? "Exportar todos os logs" : `Download disponível em ${1000 - (stats?.total || 0)} logs`}
            >
              <Download className="w-3 h-3" />
              {exporting ? "..." : canDownload ? "EXPORTAR" : `${stats.total}/1000`}
            </button>
          </div>
        )}

        {/* AI context indicator */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-start gap-2">
          <Eye className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
            A IA monitora os <span className="text-primary font-bold">últimos 100 logs</span> para manter contexto atualizado. 
            A cada 200 logs, os mais antigos são consolidados em lotes de 100 (mantendo os 100 recentes).
          </p>
        </div>

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
