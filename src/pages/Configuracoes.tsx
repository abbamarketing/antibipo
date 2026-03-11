import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfileStore } from "@/lib/profile-store";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, LogOut, Bell, User, Trash2, Shield } from "lucide-react";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfileStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        new Notification("FLOW", { body: "Notificacoes ativadas com sucesso.", icon: "/pwa-192.png" });
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
        <p className="text-center font-mono text-[9px] text-muted-foreground/30 mt-8">FLOW v2.0</p>
      </div>
    </div>
  );
}
