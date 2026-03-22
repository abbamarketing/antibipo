import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useProfileStore } from "@/lib/profile-store";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, LogOut, Bell, User, Shield, ScrollText, BookOpen, Key, Eye, EyeOff, Activity, SlidersHorizontal, Download, Sun, Moon, Monitor, Pill, Heart, AlertTriangle } from "lucide-react";
import { getThemeMode, setThemeMode, type ThemeMode } from "@/lib/time-theme";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  requestPermission,
  getPermissionStatus,
  getNotificationPreferences,
  setNotificationPreferences,
  saveNotificationPrefsToSupabase,
  loadNotificationPrefsFromSupabase,
  subscribeToPush,
  type NotificationPreferences,
} from "@/lib/push-subscription";

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
        .from("configuracoes")
        .select("valor")
        .eq("user_id", user.id)
        .eq("chave", "ai_api_key")
        .maybeSingle();
      if (data) {
        const valor = data.valor as Record<string, string> | null;
        const key = valor?.key || "";
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
    await supabase.from("configuracoes").upsert({
      user_id: user.id,
      chave: "ai_api_key",
      valor: { key: trimmed, provider: "custom", updated_at: new Date().toISOString() } as unknown as Json,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,chave" });

    setSavedKey(trimmed);
    setSaving(false);
  };

  const handleRemove = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("configuracoes").delete().eq("user_id", user.id).eq("chave", "ai_api_key");
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

function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>(getPermissionStatus());
  const [prefs, setPrefs] = useState<NotificationPreferences>(getNotificationPreferences());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotificationPrefsFromSupabase().then((p) => {
      setPrefs(p);
      setLoading(false);
    });
  }, []);

  const handleRequestPermission = async () => {
    const perm = await requestPermission();
    setPermission(perm);
    if (perm === "granted") {
      subscribeToPush();
      new Notification("AntiBipolaridade", { body: "Notificacoes ativadas com sucesso.", icon: "/pwa-192.png" });
    }
  };

  const updatePref = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setNotificationPreferences(updated);
    saveNotificationPrefsToSupabase(updated);
  };

  const permissionLabel = permission === "granted" ? "Ativadas" : permission === "denied" ? "Bloqueadas" : "Nao solicitadas";
  const permissionColor = permission === "granted" ? "text-primary" : permission === "denied" ? "text-destructive" : "text-muted-foreground";

  return (
    <section className="bg-card rounded-lg border p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-mono text-xs font-semibold tracking-wider">NOTIFICACOES</h2>
      </div>

      {/* Permission status */}
      <div className="flex items-center justify-between py-2 border-b border-border/50">
        <span className="font-mono text-xs text-muted-foreground">Status</span>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-xs font-medium ${permissionColor}`}>{permissionLabel}</span>
          {permission !== "granted" && permission !== "denied" && (
            <button
              onClick={handleRequestPermission}
              className="font-mono text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-md hover:bg-primary/90 transition-colors"
            >
              Permitir
            </button>
          )}
          {permission === "denied" && (
            <span className="font-mono text-[10px] text-muted-foreground/60">
              (desbloqueie nas config. do navegador)
            </span>
          )}
        </div>
      </div>

      {/* Toggles (only shown if permission granted) */}
      {permission === "granted" && !loading && (
        <>
          <div className="py-3 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">Lembretes de medicacao</span>
            </div>
            <Switch
              checked={prefs.med_reminders}
              onCheckedChange={(v) => updatePref("med_reminders", v)}
            />
          </div>

          <div className="py-3 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">Check-in de humor</span>
            </div>
            <Switch
              checked={prefs.mood_checkin}
              onCheckedChange={(v) => updatePref("mood_checkin", v)}
            />
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">Alertas de crise</span>
            </div>
            <Switch
              checked={prefs.crisis_alerts}
              onCheckedChange={(v) => updatePref("crisis_alerts", v)}
            />
          </div>
        </>
      )}

      {permission !== "granted" && (
        <p className="font-mono text-[10px] text-muted-foreground/70 mt-2 leading-relaxed">
          Ative as notificacoes para receber lembretes de medicacao, check-ins de humor e alertas de crise.
        </p>
      )}
    </section>
  );
}

const DEFAULTS_AGENTES = {
  med_gap_threshold: 2,
  sleep_quality_threshold: 2,
  mood_volatility_threshold: 3.0,
  notify_on_warning: true,
  notify_on_crisis: true,
};

function AlertCalibrationSection() {
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["agentes_config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return DEFAULTS_AGENTES;
      const { data } = await supabase
        .from("agentes_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data ? { ...DEFAULTS_AGENTES, ...data } : DEFAULTS_AGENTES;
    },
  });

  const save = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("agentes_config").upsert(
        {
          user_id: user.id,
          ...values,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agentes_config"] }),
  });

  const c = config ?? DEFAULTS_AGENTES;

  const update = (field: string, value: any) => {
    save.mutate({ ...c, [field]: value });
  };

  return (
    <section className="bg-card rounded-lg border p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-mono text-xs font-semibold tracking-wider">CALIBRAÇÃO DE ALERTAS</h2>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground/70 mb-4 leading-relaxed">
        Ajuste os thresholds dos agentes ao seu baseline pessoal.
      </p>

      {/* Med gap threshold */}
      <div className="py-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-muted-foreground">Gap de medicação para alerta</span>
          <span className="font-mono text-xs font-medium">{c.med_gap_threshold} dia{(c.med_gap_threshold ?? 2) !== 1 ? "s" : ""}</span>
        </div>
        <Slider
          value={[c.med_gap_threshold ?? 2]}
          min={1}
          max={5}
          step={1}
          onValueCommit={(v) => update("med_gap_threshold", v[0])}
          className="w-full"
        />
      </div>

      {/* Sleep quality threshold */}
      <div className="py-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">Qualidade mínima de sono</span>
          <Select
            value={String(c.sleep_quality_threshold ?? 2)}
            onValueChange={(v) => update("sleep_quality_threshold", Number(v))}
          >
            <SelectTrigger className="w-28 h-7 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Ruim</SelectItem>
              <SelectItem value="2">Regular</SelectItem>
              <SelectItem value="3">Boa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notify on warning */}
      <div className="py-3 border-b border-border/50 flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">Notificar em alerta</span>
        <Switch
          checked={c.notify_on_warning ?? true}
          onCheckedChange={(v) => update("notify_on_warning", v)}
        />
      </div>

      {/* Notify on crisis */}
      <div className="py-3 flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">Notificar em crise</span>
        <Switch
          checked={c.notify_on_crisis ?? true}
          onCheckedChange={(v) => update("notify_on_crisis", v)}
        />
      </div>
    </section>
  );
}

export default function Configuracoes() {
  const navigate = useNavigate();
  const { profile } = useProfileStore();
  const [resetting, setResetting] = useState(false);
  const [resumos, setResumos] = useState<any[]>([]);
  const [logCount, setLogCount] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getThemeMode());

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setThemeMode(mode);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: configs } = await supabase
        .from("configuracoes")
        .select("*")
        .eq("user_id", user.id)
        .like("chave", "resumo_logs_%")
        .order("created_at", { ascending: false })
        .limit(10);
      if (configs) setResumos(configs);
      const { count } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setLogCount(count ?? 0);
    })();
  }, []);

  const handleResetAccount = async () => {
    if (resetting) return;

    const confirmed = window.confirm("Isso vai apagar TODOS os dados da conta e reiniciar do zero. Deseja continuar?");
    if (!confirmed) return;

    setResetting(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Sessão expirada. Faça login novamente para resetar sua conta.");
      }

      const primary = await supabase.rpc("reset_user_data", { p_user_id: user.id });
      if (primary.error) {
        const fallback = await supabase.rpc("reset_my_data");
        if (fallback.error) {
          const details = [primary.error.message, primary.error.details, fallback.error.message, fallback.error.details]
            .filter(Boolean)
            .join(" | ");
          throw new Error(details || "Falha no reset da conta");
        }
      }

      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch (error: any) {
      console.error("Reset failed:", error);
      const parsedMessage = typeof error === "string"
        ? error
        : error?.message || "Não foi possível resetar agora. Tente novamente em alguns segundos.";
      alert(`Não foi possível resetar: ${parsedMessage}`);
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleExportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nao autenticado");
      const uid = user.id;

      const [humor, sono, meds, medRegs, tasks, peso, exercicios, refeicoes, metas, profiles] = await Promise.all([
        supabase.from("registros_humor").select("*").eq("user_id", uid),
        supabase.from("registros_sono").select("*").eq("user_id", uid),
        supabase.from("medicamentos").select("*").eq("user_id", uid),
        supabase.from("registros_medicamento").select("*").eq("user_id", uid),
        supabase.from("tasks").select("*").eq("user_id", uid),
        supabase.from("registros_peso").select("*").eq("user_id", uid),
        supabase.from("bm_exercicios").select("*").eq("user_id", uid),
        supabase.from("bm_refeicoes").select("*").eq("user_id", uid),
        supabase.from("bm_metas").select("*").eq("user_id", uid),
        supabase.from("profiles").select("*").eq("user_id", uid),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: uid,
        profile: profiles.data ?? [],
        registros_humor: humor.data ?? [],
        registros_sono: sono.data ?? [],
        medicamentos: meds.data ?? [],
        registros_medicamento: medRegs.data ?? [],
        tasks: tasks.data ?? [],
        registros_peso: peso.data ?? [],
        exercicios: exercicios.data ?? [],
        refeicoes: refeicoes.data ?? [],
        metas: metas.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lifebit-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Export failed:", error);
      alert("Falha ao exportar dados: " + (error?.message || "Tente novamente"));
    } finally {
      setExporting(false);
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
        </section>

        {/* Tema */}
        <section className="bg-card rounded-lg border p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-mono text-xs font-semibold tracking-wider">TEMA</h2>
          </div>
          <div className="flex gap-2">
            {([
              { mode: "auto" as ThemeMode, label: "Auto", Icon: Monitor },
              { mode: "light" as ThemeMode, label: "Claro", Icon: Sun },
              { mode: "dark" as ThemeMode, label: "Escuro", Icon: Moon },
            ]).map(({ mode, label, Icon }) => (
              <button
                key={mode}
                onClick={() => handleThemeChange(mode)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md font-mono text-xs transition-all ${
                  themeMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <p className="font-mono text-[10px] text-muted-foreground/70 mt-2 leading-relaxed">
            Auto alterna automaticamente com base no horario (escuro apos 19h).
          </p>
        </section>

        {/* Onboarding */}
        <section className="bg-card rounded-lg border p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-mono text-xs font-semibold tracking-wider">ONBOARDING</h2>
          </div>
          {(["saude", "casa", "financeiro"] as const).map((m) => {
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
                const valor = r.valor as Record<string, unknown> | null;
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

        {/* Notification Settings */}
        <NotificationSettings />

        {/* Alert Calibration */}
        <AlertCalibrationSection />

        {/* AI API Key */}
        <AIKeySettings />

        {/* Activity Log */}
        <section className="mb-4">
          <button
            onClick={() => navigate("/log")}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-lg border hover:bg-secondary/50 transition-colors"
          >
            <Activity className="w-4 h-4 text-primary" />
            <div className="text-left">
              <p className="font-mono text-xs font-medium">Log de Atividade</p>
              <p className="font-mono text-[10px] text-muted-foreground">Histórico completo de ações e eventos</p>
            </div>
          </button>
        </section>

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

        {/* Data Export */}
        <section className="mb-4">
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-lg border hover:bg-secondary/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 text-primary" />
            <div className="text-left">
              <p className="font-mono text-xs font-medium">
                {exporting ? "Exportando..." : "Exportar dados"}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">Baixa todos os seus dados em formato JSON</p>
            </div>
          </button>
        </section>

        {/* Actions */}
        <section className="space-y-2">
          <button
            onClick={handleResetAccount}
            disabled={resetting}
            className="w-full flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-secondary/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
            <div className="text-left">
              <p className="font-mono text-xs font-medium">
                {resetting ? "Resetando conta..." : "Resetar conta"}
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
