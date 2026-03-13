import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFlowStore } from "@/lib/store";
import { logActivity } from "@/lib/activity-log";
import { brasiliaTimeString, brasiliaTime } from "@/lib/brasilia";
import { format } from "date-fns";
import { X, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { TemplateSelector } from "@/components/atomic/TemplateSelector";
import { DynamicFields } from "@/components/atomic/DynamicFields";
import { DatePickerField, RecurrenceToggle, UrgenciaSelector, ModuloSelector } from "@/components/atomic/FormControls";
import { SubtaskSection } from "@/components/atomic/SubtaskSection";
import { TaskPreview } from "@/components/atomic/TaskPreview";
import {
  type TemplateId, type FieldValues,
  detectModuleFromKeywords, buildTitle, getSubtaskOptions,
} from "@/components/atomic/task-form-constants";

interface StructuredTaskFormProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function StructuredTaskForm({ open, onClose, onCreated }: StructuredTaskFormProps) {
  const { state } = useFlowStore();
  const queryClient = useQueryClient();

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

  const titulo = buildTitle(template, fields);

  useEffect(() => {
    if (!titulo || titulo.length < 4) return;
    if (template === "domestico" || template === "saude") return;
    const detected = detectModuleFromKeywords(titulo);
    if (detected && detected !== modulo && !smartSuggested) {
      setModulo(detected);
      setSmartSuggested(true);
    }
  }, [titulo, template]);

  const isValid = template && titulo.length > 3;
  const subtaskOptions = useMemo(() => getSubtaskOptions(template), [template]);

  const reset = () => {
    setTemplate(null); setFields({}); setDataEntrega(undefined);
    setUrgencia(2); setModulo("trabalho"); setSubtarefas([]);
    setSuccess(false); setRecorrente(false); setFrequencia("semanal");
    setShowNewClient(false); setNewClientName(""); setSmartSuggested(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-card rounded-t-2xl border-t border-x shadow-lg max-h-[90vh] overflow-y-auto overscroll-contain">
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
                    className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-mono text-xs tracking-wider disabled:opacity-40 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[52px]"
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
