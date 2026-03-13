import { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFlowStore } from "@/lib/store";
import { logActivity } from "@/lib/activity-log";
import { brasiliaTimeString } from "@/lib/brasilia";
import { format } from "date-fns";
import { X, Plus, Loader2, CheckCircle2, Zap, ArrowRight, Briefcase, Home, Heart } from "lucide-react";
import { toast } from "sonner";

import { TemplateSelector } from "@/components/atomic/TemplateSelector";
import { DynamicFields } from "@/components/atomic/DynamicFields";
import { DatePickerField, RecurrenceToggle, UrgenciaSelector, ModuloSelector } from "@/components/atomic/FormControls";
import { SubtaskSection } from "@/components/atomic/SubtaskSection";
import { TaskPreview } from "@/components/atomic/TaskPreview";
import {
  type TemplateId, type FieldValues,
  detectModuleFromKeywords, buildTitle, getSubtaskOptions,
  parseQuickBar,
} from "@/components/atomic/task-form-constants";

interface StructuredTaskFormProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const moduloIcons = { trabalho: Briefcase, casa: Home, saude: Heart };

export function StructuredTaskForm({ open, onClose, onCreated }: StructuredTaskFormProps) {
  const { state } = useFlowStore();
  const queryClient = useQueryClient();
  const quickInputRef = useRef<HTMLInputElement>(null);

  const [quickText, setQuickText] = useState("");
  const [quickParsed, setQuickParsed] = useState<ReturnType<typeof parseQuickBar> | null>(null);
  const [template, setTemplate] = useState<TemplateId | null>(null);
  const [fields, setFields] = useState<FieldValues>({});
  const [dataEntrega, setDataEntrega] = useState<Date | undefined>();
  const [urgencia, setUrgencia] = useState(2);
  const [modulo, setModulo] = useState<"trabalho" | "casa" | "saude">("trabalho");
  const [subtarefas, setSubtarefas] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recorrente, setRecorrente] = useState(false);
  const [frequencia, setFrequencia] = useState("semanal");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [savingClient, setSavingClient] = useState(false);
  const [smartSuggested, setSmartSuggested] = useState(false);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase.from("clientes").select("id, nome").eq("status", "ativo").order("nome").then(({ data }) => {
      if (data) setClientes(data);
    });
    // Focus quick bar on open
    setTimeout(() => quickInputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const energy = state.current_energy;
    if (energy === "basico" || energy === "modo_leve") setUrgencia(1);
    else setUrgencia(2);
  }, [open, state.current_energy]);

  useEffect(() => {
    if (template === "domestico") setModulo("casa");
    else if (template === "saude") setModulo("saude");
    else if (template) setModulo("trabalho");
  }, [template]);

  const titulo = template ? buildTitle(template, fields) : "";

  useEffect(() => {
    if (!titulo || titulo.length < 4) return;
    if (template === "domestico" || template === "saude") return;
    const detected = detectModuleFromKeywords(titulo);
    if (detected && detected !== modulo && !smartSuggested) {
      setModulo(detected);
      setSmartSuggested(true);
    }
  }, [titulo, template]);

  // Parse quick bar text in real-time
  useEffect(() => {
    if (quickText.trim().length < 2) {
      setQuickParsed(null);
      return;
    }
    setQuickParsed(parseQuickBar(quickText));
  }, [quickText]);

  const isValid = template ? titulo.length > 3 : (quickParsed?.titulo?.length ?? 0) > 3;
  const subtaskOptions = useMemo(() => getSubtaskOptions(template), [template]);

  const reset = () => {
    setTemplate(null); setFields({}); setDataEntrega(undefined);
    setUrgencia(2); setModulo("trabalho"); setSubtarefas([]);
    setSuccess(false); setRecorrente(false); setFrequencia("semanal");
    setShowNewClient(false); setNewClientName(""); setSmartSuggested(false);
    setQuickText(""); setQuickParsed(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleAddClient = async () => {
    if (!newClientName.trim() || savingClient) return;
    setSavingClient(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("clientes").insert({
        nome: newClientName.trim(), tipo: "pj", status: "ativo", user_id: user.id,
      }).select("id, nome").single();
      if (error) throw error;
      if (data) {
        setClientes((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
        queryClient.setQueryData(["clientes"], (current: any[] = []) =>
          [...current.filter((c) => c.id !== data.id), data].sort((a, b) => a.nome.localeCompare(b.nome))
        );
        setFields({ ...fields, cliente: data.nome, cliente_id: data.id });
        toast.success("Cliente adicionado");
      }
    } catch { toast.error("Erro ao adicionar cliente"); }
    finally { setSavingClient(false); setShowNewClient(false); setNewClientName(""); }
  };

  const handleQuickSubmit = async () => {
    if (!quickParsed || quickParsed.titulo.length < 4 || saving) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const finalModulo = quickParsed.modulo || modulo;
      const finalUrgencia = quickParsed.urgencia || urgencia;

      const { error } = await supabase.from("tasks").insert({
        titulo: quickParsed.titulo,
        modulo: finalModulo as any,
        urgencia: finalUrgencia,
        tipo: (finalModulo === "casa" ? "domestico" : finalModulo === "saude" ? "operacional" : "operacional") as any,
        dono: "eu" as any, tempo_min: 30, estado_ideal: "qualquer" as any,
        impacto: finalUrgencia >= 3 ? 3 : 2, status: "backlog" as any,
        user_id: user.id,
      } as any);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      logActivity("tarefa_quick_criada", {
        titulo: quickParsed.titulo, modulo: finalModulo, urgencia: finalUrgencia,
        hora: brasiliaTimeString(),
      });

      setSuccess(true);
      toast.success("Tarefa criada!");
      onCreated?.();
      setTimeout(() => reset(), 1200);
    } catch (err) {
      console.error("Quick task error:", err);
      toast.error("Erro ao criar tarefa");
    } finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: mainTask, error } = await supabase.from("tasks").insert({
        titulo, modulo: modulo as any, urgencia,
        tipo: (template === "domestico" ? "domestico" : template === "reuniao" ? "administrativo" : "operacional") as any,
        dono: "eu" as any, tempo_min: 30, estado_ideal: "qualquer" as any,
        impacto: urgencia >= 3 ? 3 : 2, status: "backlog" as any,
        cliente_id: fields.cliente_id || null,
        data_limite: dataEntrega ? format(dataEntrega, "yyyy-MM-dd") : null,
        recorrente, frequencia_recorrencia: recorrente ? frequencia : null,
        user_id: user.id,
      } as any).select().single();

      if (error) throw error;

      if (subtarefas.length > 0 && mainTask) {
        const subs = subtarefas.map((sub) => ({
          titulo: sub, modulo: modulo as any, urgencia: Math.max(1, urgencia - 1),
          tipo: "operacional" as any, dono: "eu" as any, tempo_min: 15,
          estado_ideal: "qualquer" as any, impacto: 1, status: "backlog" as any,
          parent_task_id: (mainTask as any).id, user_id: user.id,
        }));
        await supabase.from("tasks").insert(subs as any);
      }

      if (mainTask) {
        queryClient.setQueryData(["tasks"], (current: any[] = []) => {
          const withoutSame = current.filter((t) => t.id !== mainTask.id);
          return [mainTask, ...withoutSame];
        });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      try { await supabase.functions.invoke("classify-task", { body: { titulo } }); } catch {}

      logActivity("tarefa_estruturada_criada", {
        titulo, template, modulo, urgencia, recorrente,
        frequencia: recorrente ? frequencia : null,
        subtarefas: subtarefas.length,
        data_entrega: dataEntrega ? format(dataEntrega, "yyyy-MM-dd") : null,
        hora: brasiliaTimeString(),
      });

      setSuccess(true);
      toast.success("Tarefa criada!");
      onCreated?.();
      setTimeout(() => reset(), 1200);
    } catch (err) {
      console.error("Task creation error:", err);
      toast.error("Erro ao criar tarefa");
    } finally { setSaving(false); }
  };

  if (!open) return null;

  const ModIcon = quickParsed?.modulo ? moduloIcons[quickParsed.modulo] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-card rounded-t-3xl border-t border-x shadow-lg max-h-[90vh] overflow-y-auto overscroll-contain">
        <div className="sticky top-0 bg-card z-10 pt-2 pb-1 px-4">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-sm font-semibold tracking-wider">NOVA TAREFA</h3>
            <button onClick={handleClose} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 pt-2 space-y-4 pb-8">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 animate-fade-in">
              <CheckCircle2 className="w-8 h-8 text-primary" />
              <p className="font-mono text-sm text-primary">Tarefa criada!</p>
            </div>
          ) : (
            <>
              {/* ── Quick Bar ── */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    ref={quickInputRef}
                    type="text"
                    value={quickText}
                    onChange={(e) => setQuickText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && quickParsed && !template) handleQuickSubmit(); }}
                    placeholder="Captura rápida: 'Comprar remédio @saude !alta'"
                    className="w-full py-3.5 px-4 pr-12 rounded-2xl bg-secondary/60 border border-border/40 font-body text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  {quickParsed && quickParsed.titulo.length > 3 && !template && (
                    <button
                      onClick={handleQuickSubmit}
                      disabled={saving}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-90 transition-all"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Quick parse feedback pills */}
                {quickParsed && quickText.length > 2 && (
                  <div className="flex items-center gap-2 px-1 animate-fade-in">
                    {quickParsed.modulo && ModIcon && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[10px] tracking-wider">
                        <ModIcon className="w-3 h-3" />
                        {quickParsed.modulo.toUpperCase()}
                      </span>
                    )}
                    {quickParsed.urgencia && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] tracking-wider ${
                        quickParsed.urgencia === 3 ? "bg-destructive/10 text-destructive" :
                        quickParsed.urgencia === 1 ? "bg-secondary text-muted-foreground" :
                        "bg-accent/10 text-accent-foreground"
                      }`}>
                        <Zap className="w-3 h-3" />
                        {quickParsed.urgencia === 3 ? "ALTA" : quickParsed.urgencia === 1 ? "BAIXA" : "MÉDIA"}
                      </span>
                    )}
                    {!quickParsed.modulo && !quickParsed.urgencia && (
                      <span className="font-body text-[10px] text-muted-foreground/50">
                        use @saude @casa @trabalho · !alta !baixa
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 text-muted-foreground/40">
                <div className="flex-1 h-px bg-border/40" />
                <span className="font-mono text-[9px] tracking-widest">OU DETALHADO</span>
                <div className="flex-1 h-px bg-border/40" />
              </div>

              <TemplateSelector selected={template} onSelect={(id) => { setTemplate(id); setFields({}); setSubtarefas([]); }} />

              {template && (
                <div className="space-y-4 animate-fade-in">
                  <DynamicFields
                    template={template} fields={fields} setFields={setFields}
                    clientes={clientes}
                    showNewClient={showNewClient} setShowNewClient={setShowNewClient}
                    newClientName={newClientName} setNewClientName={setNewClientName}
                    onAddClient={handleAddClient} savingClient={savingClient}
                  />
                  <DatePickerField value={dataEntrega} onChange={setDataEntrega} />
                  <RecurrenceToggle recorrente={recorrente} setRecorrente={setRecorrente} frequencia={frequencia} setFrequencia={setFrequencia} />
                  <UrgenciaSelector value={urgencia} onChange={setUrgencia} showEnergyHint={!!state.current_energy && state.current_energy !== "foco_total"} />
                  <ModuloSelector value={modulo} onChange={setModulo} />
                  <SubtaskSection subtarefas={subtarefas} setSubtarefas={setSubtarefas} options={subtaskOptions} />
                  <TaskPreview titulo={titulo} modulo={modulo} urgencia={urgencia} recorrente={recorrente} frequencia={frequencia} dataEntrega={dataEntrega} subtarefasCount={subtarefas.length} />

                  <button
                    onClick={handleSubmit}
                    disabled={!isValid || saving}
                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-mono text-xs tracking-wider disabled:opacity-40 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[52px]"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {saving ? "CRIANDO..." : "CRIAR TAREFA"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
