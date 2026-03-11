import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfileStore } from "@/lib/profile-store";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, LogOut, Bell, User, Shield, ScrollText, BookOpen, Key, Eye, EyeOff } from "lucide-react";

function AIKeySettings() {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("configuracoes" as any)
        .select("valor")
        .eq("user_id", user.id)
        .eq("chave", "ai_api_key")
        .maybeSingle();
      if (data) {
        const key = (data as any).valor?.key || "";
        setSavedKey(key);
        setApiKey(key);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const trimmed = apiKey.trim();
    await supabase.from("configuracoes" as any).upsert({
      user_id: user.id,
      chave: "ai_api_key",
      valor: { key: trimmed, provider: "custom", updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "user_id,chave" });

    setSavedKey(trimmed);
    setSaving(false);
  };

  const handleRemove = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("configuracoes" as any).delete().eq("user_id", user.id).eq("chave", "ai_api_key");
    setApiKey("");
    setSavedKey(null);
  };

  const maskedKey = savedKey ? `${savedKey.slice(0, 8)}...${savedKey.slice(-4)}` : null;

  return (
    <section className="bg-card rounded-lg border p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Key className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-mono text-xs font-semibold tracking-wider">CHAVE DE IA</h2>
      </div>

      <p className="font-mono text-[10px] text-muted-foreground/70 mb-3 leading-relaxed">
        Configure sua API key para funcionalidades de IA (classificação de tarefas, nudges, análises).
        A chave é armazenada de forma segura no seu perfil.
      </p>

      {savedKey && !showKey ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-secondary/50 rounded-md px-3 py-2">
            <span className="font-mono text-xs text-foreground/80">{maskedKey}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowKey(true)} className="p-1 hover:bg-secondary rounded transition-colors">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowKey(true)} className="font-mono text-[10px] text-primary hover:text-primary/80 transition-colors">
              Editar
            </button>
            <button onClick={handleRemove} className="font-mono text-[10px] text-destructive hover:text-destructive/80 transition-colors">
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-... ou AIza..."
              className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
              maxLength={256}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded transition-colors"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !apiKey.trim()}
              className="font-mono text-[10px] bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            {savedKey && (
              <button
                onClick={() => { setShowKey(false); setApiKey(savedKey); }}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default function Configuracoes() {
  const navigate = useNavigate();
  const { profile } = useProfileStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resumos, setResumos] = useState<any[]>([]);
  const [logCount, setLogCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: configs } = await supabase
        .from("configuracoes" as any)
        .select("*")
        .eq("user_id", user.id)
        .like("chave", "resumo_logs_%")
        .order("created_at", { ascending: false })
        .limit(10);
      if (configs) setResumos(configs as any[]);
      const { count } = await supabase
        .from("activity_log" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setLogCount(count ?? 0);
    })();
  }, []);

  const handleResetAccount = async () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.rpc("reset_user_data" as any, { p_user_id: user.id });
    if (error) { console.error("Reset failed:", error); return; }
    localStorage.clear();
    setConfirmReset(false);
    window.location.href = "/";
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
        <header className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-mono text-sm font-bold tracking-wider">CONFIGURACOES</h1>
        </header>

        {/* Profile */}
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

        {/* Onboarding */}
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

        {/* AI API Key */}
        <AIKeySettings />

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
                Apaga TODOS os dados e reinicia do zero
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

        <p className="text-center font-mono text-[9px] text-muted-foreground/30 mt-8">AntiBipolaridade v2.0</p>
      </div>
    </div>
  );
}
