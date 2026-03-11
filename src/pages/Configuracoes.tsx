import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfileStore } from "@/lib/profile-store";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, LogOut, Bell, User, Trash2, Shield, ScrollText, BookOpen, Brain } from "lucide-react";
import { getAIStats, resetAIStats } from "@/lib/ai-stats";

function AIProviderStats() {
  const stats = getAIStats();
  const total = stats.gemini_direct + stats.lovable_ai;
  const geminiPct = total > 0 ? Math.round((stats.gemini_direct / total) * 100) : 0;
  const lovablePct = total > 0 ? 100 - geminiPct : 0;

  return (
    <section className="bg-card rounded-lg border p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-mono text-xs font-semibold tracking-wider">USO DE IA</h2>
      </div>
      {total === 0 ? (
        <p className="font-mono text-[10px] text-muted-foreground/60 py-2">
          Nenhuma chamada de IA registrada nesta sessão.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="font-mono text-xs text-muted-foreground">Total de chamadas</span>
            <span className="font-mono text-xs font-bold">{total}</span>
          </div>

          {/* Gemini Direct bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-muted-foreground">Gemini (Google OAuth)</span>
              <span className="font-mono text-[10px] font-medium">{geminiPct}% ({stats.gemini_direct})</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${geminiPct}%` }} />
            </div>
          </div>

          {/* Lovable AI bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-muted-foreground">Lovable AI Gateway</span>
              <span className="font-mono text-[10px] font-medium">{lovablePct}% ({stats.lovable_ai})</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${lovablePct}%` }} />
            </div>
          </div>

          <p className="font-mono text-[9px] text-muted-foreground/50 pt-1">
            Gemini Direct = cota gratuita via Google OAuth • Lovable AI = gateway pago
          </p>
          <button
            onClick={() => { resetAIStats(); window.location.reload(); }}
            className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Resetar contadores
          </button>
        </div>
      )}
    </section>
  );
}

export default function Configuracoes() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfileStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resumos, setResumos] = useState<any[]>([]);
  const [logCount, setLogCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch consolidated summaries
      const { data: configs } = await supabase
        .from("configuracoes" as any)
        .select("*")
        .eq("user_id", user.id)
        .like("chave", "resumo_logs_%")
        .order("created_at", { ascending: false })
        .limit(10);
      if (configs) setResumos(configs as any[]);

      // Fetch current log count
      const { count } = await supabase
        .from("activity_log" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setLogCount(count ?? 0);
    })();
  }, []);

  const handleResetAccount = async () => {
    if (!confirmReset) { setConfirmReset(true); return; }

    // Reset all onboarding flags
    updateProfile({
      onboarding_saude: false,
      onboarding_trabalho: false,
      onboarding_casa: false,
      onboarding_financeiro: false,
      onboarding_saude_at: null,
      onboarding_trabalho_at: null,
      onboarding_casa_at: null,
      onboarding_financeiro_at: null,
      nome: null,
      peso_kg: null,
      altura_cm: null,
      data_nascimento: null,
      objetivo_saude: null,
      trabalho_tipo: null,
      trabalho_horas_dia: null,
      trabalho_desafio: null,
      trabalho_clientes_ativos: null,
      trabalho_equipe: null,
      casa_moradores: null,
      casa_comodos: null,
      casa_pets: null,
      casa_frequencia_ideal: null,
      casa_desafio: null,
      financeiro_faixa_renda: null,
      financeiro_objetivo: null,
      financeiro_controla_gastos: null,
      financeiro_principal_gasto: null,
      financeiro_reserva: null,
    } as any);

    setConfirmReset(false);
    navigate("/");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleRequestNotifications = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification("AntiBipolaridade", { body: "Notificacoes ativadas com sucesso.", icon: "/pwa-192.png" });
      }
    }
  };

  const infoRow = (label: string, value: string | null | undefined) => (
    <div className="flex items-center justify-between py-2">
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">{value || "—"}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <header className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-mono text-sm font-bold tracking-wider">CONFIGURACOES</h1>
        </header>

        {/* Profile info */}
        <section className="bg-card rounded-lg border p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-mono text-xs font-semibold tracking-wider">PERFIL</h2>
          </div>
          {infoRow("Nome", profile?.nome)}
          {infoRow("Nascimento", profile?.data_nascimento)}
          {infoRow("Peso", profile?.peso_kg ? `${profile.peso_kg} kg` : null)}
          {infoRow("Altura", profile?.altura_cm ? `${profile.altura_cm} cm` : null)}
          {infoRow("Objetivo saude", profile?.objetivo_saude)}
          {infoRow("Trabalho", profile?.trabalho_tipo)}
        </section>

        {/* Onboarding status */}
        <section className="bg-card rounded-lg border p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-mono text-xs font-semibold tracking-wider">ONBOARDING</h2>
          </div>
          {(["saude", "trabalho", "casa", "financeiro"] as const).map((m) => {
            const done = !!profile?.[`onboarding_${m}` as keyof typeof profile];
            const at = profile?.[`onboarding_${m}_at` as keyof typeof profile] as string | null;
            return (
              <div key={m} className="flex items-center justify-between py-1.5">
                <span className="font-mono text-xs text-muted-foreground capitalize">{m === "saude" ? "Saude" : m}</span>
                <div className="flex items-center gap-2">
                  {at && <span className="font-mono text-[9px] text-muted-foreground/50">{new Date(at).toLocaleDateString("pt-BR")}</span>}
                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${done ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {done ? "OK" : "Pendente"}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Log Summaries */}
        <section className="bg-card rounded-lg border p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-mono text-xs font-semibold tracking-wider">RESUMOS DE ATIVIDADE</h2>
          </div>
          <div className="flex items-center justify-between py-1.5 mb-2">
            <span className="font-mono text-xs text-muted-foreground">Logs pendentes</span>
            <span className="font-mono text-xs">{logCount ?? "..."}/100</span>
          </div>
          {resumos.length === 0 ? (
            <p className="font-mono text-[10px] text-muted-foreground/60 py-2">
              Nenhum resumo ainda. A cada 100 ações, um resumo é gerado automaticamente.
            </p>
          ) : (
            <div className="space-y-2">
              {resumos.map((r: any) => {
                const valor = r.valor as any;
                return (
                  <div key={r.id} className="bg-secondary/50 rounded-md p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="font-mono text-[9px] text-primary">
                        {valor?.total_acoes || 0} ações
                      </span>
                    </div>
                    <p className="font-body text-xs text-foreground/80 leading-relaxed">
                      {valor?.resumo || "Sem resumo"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* AI Provider Stats */}
        <AIProviderStats />

        {/* Documentation */}
        <section className="mb-4">
          <button
            onClick={() => navigate("/docs")}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-lg border hover:bg-secondary/50 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <div className="text-left">
              <p className="font-mono text-xs font-medium">Documentação Completa</p>
              <p className="font-mono text-[10px] text-muted-foreground">Guia do usuário, funcionalidades, lógica e tecnologias</p>
            </div>
          </button>
        </section>

        {/* Actions */}
        <section className="space-y-2">
          <button
            onClick={handleRequestNotifications}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-lg border hover:bg-secondary/50 transition-colors"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            <div className="text-left">
              <p className="font-mono text-xs font-medium">Ativar notificacoes</p>
              <p className="font-mono text-[10px] text-muted-foreground">Permite alertas de medicamentos, reunioes e lembretes</p>
            </div>
          </button>

          <button
            onClick={handleResetAccount}
            className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${
              confirmReset ? "bg-destructive/10 border-destructive/30" : "bg-card hover:bg-secondary/50"
            }`}
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
            <div className="text-left">
              <p className="font-mono text-xs font-medium">
                {confirmReset ? "Confirmar reset? Clique novamente" : "Resetar conta"}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                Reinicia onboarding e limpa dados do perfil
              </p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-lg border hover:bg-secondary/50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
            <div className="text-left">
              <p className="font-mono text-xs font-medium">Sair da conta</p>
              <p className="font-mono text-[10px] text-muted-foreground">Desconectar e voltar para login</p>
            </div>
          </button>
        </section>

        {/* Version */}
        <p className="text-center font-mono text-[9px] text-muted-foreground/30 mt-8">AntiBipolaridade v2.0</p>
      </div>
    </div>
  );
}
