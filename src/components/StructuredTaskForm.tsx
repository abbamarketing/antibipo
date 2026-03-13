import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFlowStore } from "@/lib/store";
import { logActivity } from "@/lib/activity-log";
import { brasiliaTimeString, brasiliaTime } from "@/lib/brasilia";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  X, Plus, CalendarIcon, Trash2, ChevronDown, Loader2, CheckCircle2,
  Repeat, UserPlus, Briefcase, Home, Heart, AlertTriangle,
  Clock, Zap, FileText, Users, Wrench, Stethoscope, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface StructuredTaskFormProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

// ─── Templates ──────────────────────────────────────────────
const TEMPLATES = [
  { id: "acao_cliente", label: "Ação / Cliente", icon: Briefcase, fields: ["acao", "cliente", "data_entrega"] },
  { id: "reuniao", label: "Reunião / Call", icon: Users, fields: ["assunto", "participante", "data_entrega"] },
  { id: "entrega", label: "Entregar projeto", icon: FileText, fields: ["projeto", "cliente", "data_entrega"] },
  { id: "tarefa_geral", label: "Tarefa operacional", icon: Wrench, fields: ["descricao", "data_entrega"] },
  { id: "domestico", label: "Tarefa doméstica", icon: Home, fields: ["tarefa_casa", "comodo", "data_entrega"] },
  { id: "saude", label: "Tarefa de saúde", icon: Stethoscope, fields: ["atividade", "data_entrega"] },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];

const ACOES = [
  "Integração", "Deploy", "Design", "Desenvolvimento", "Revisão",
  "Configuração", "Análise", "Documentação", "Teste", "Suporte",
  "Atualização", "Migração", "Correção", "Otimização", "Apresentação",
];

const ASSUNTOS = [
  "Alinhamento", "Planejamento", "Retrospectiva", "Review", "Daily",
  "Kickoff", "Follow-up", "Feedback", "Onboarding", "Treinamento",
];

const COMODOS = [
  "Cozinha", "Sala", "Quarto", "Banheiro", "Lavanderia",
  "Escritório", "Varanda", "Garagem", "Geral",
];

const TAREFAS_CASA = [
  "Lavar louça", "Aspirar", "Limpar", "Organizar", "Arrumar cama",
  "Tirar lixo", "Lavar roupa", "Passar roupa", "Cozinhar", "Compras",
];

const ATIVIDADES_SAUDE = [
  "Consulta médica", "Exame", "Tomar medicamento", "Exercício",
  "Fisioterapia", "Terapia", "Nutricionista", "Dentista", "Check-up",
];

const PROJETOS = [
  "App", "Site", "Sistema", "Integração", "Automação",
  "Dashboard", "Landing Page", "E-commerce", "API", "MVP",
];

const URGENCIA_OPTIONS = [
  { value: 1, label: "Baixa", icon: Clock, color: "bg-secondary text-muted-foreground", activeColor: "bg-secondary border-muted-foreground text-foreground" },
  { value: 2, label: "Média", icon: AlertTriangle, color: "bg-amber-500/15 text-amber-700 dark:text-amber-300", activeColor: "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300" },
  { value: 3, label: "Alta", icon: Zap, color: "bg-destructive/15 text-destructive", activeColor: "bg-destructive/15 border-destructive text-destructive" },
];

const MODULO_OPTIONS = [
  { value: "trabalho", label: "Trabalho", icon: Briefcase },
  { value: "casa", label: "Casa", icon: Home },
  { value: "saude", label: "Saúde", icon: Heart },
];

const RECURRENCE_OPTIONS = [
  { value: "diario", label: "Diário" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
];

type FieldValues = Record<string, string>;

// ─── Keyword-based module detection ─────────────────────────
const KEYWORD_MODULE_MAP: { keywords: string[]; module: "trabalho" | "casa" | "saude" }[] = [
  { keywords: ["cliente", "deploy", "código", "api", "design", "meeting", "reunião", "projeto", "sprint", "dev", "review", "apresentação", "relatório", "email", "contrato"], module: "trabalho" },
  { keywords: ["limpeza", "cozinha", "lavar", "aspirar", "organizar", "compras", "mercado", "louça", "roupa", "varrer", "lixo", "cama", "banheiro", "jardim"], module: "casa" },
  { keywords: ["médico", "remédio", "exercício", "terapia", "exame", "consulta", "dentista", "academia", "caminhada", "fisio", "nutricionista", "sono", "medicamento", "saúde"], module: "saude" },
];

function detectModuleFromKeywords(text: string): "trabalho" | "casa" | "saude" | null {
  const lower = text.toLowerCase();
  for (const entry of KEYWORD_MODULE_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) return entry.module;
  }
  return null;
}

export function StructuredTaskForm({ open, onClose, onCreated }: StructuredTaskFormProps) {
  const { state } = useFlowStore();
  const [template, setTemplate] = useState<TemplateId | null>(null);
  const [fields, setFields] = useState<FieldValues>({});
  const [dataEntrega, setDataEntrega] = useState<Date | undefined>();
  const [urgencia, setUrgencia] = useState(2);
  const [modulo, setModulo] = useState<"trabalho" | "casa" | "saude">("trabalho");
  const [subtarefas, setSubtarefas] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recorrente, setRecorrente] = useState(false);
  const [frequencia, setFrequencia] = useState<string>("semanal");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [savingClient, setSavingClient] = useState(false);
  const [smartSuggested, setSmartSuggested] = useState(false);
  const queryClient = useQueryClient();

  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  useEffect(() => {
    if (!open) return;
    supabase.from("clientes").select("id, nome").eq("status", "ativo").order("nome").then(({ data }) => {
      if (data) setClientes(data);
    });
  }, [open]);

  // Smart defaults: set urgency based on current energy
  useEffect(() => {
    if (!open) return;
    const energy = state.current_energy;
    if (energy === "basico") setUrgencia(1);
    else if (energy === "modo_leve") setUrgencia(1);
    else setUrgencia(2);
  }, [open, state.current_energy]);

  useEffect(() => {
    if (template === "domestico" as string) setModulo("casa");
    else if (template === "saude" as string) setModulo("saude");
    else if (template) setModulo("trabalho");
  }, [template]);

  const reset = () => {
    setTemplate(null);
    setFields({});
    setDataEntrega(undefined);
    setUrgencia(2);
    setModulo("trabalho");
    setSubtarefas([]);
    setSuccess(false);
    setRecorrente(false);
    setFrequencia("semanal");
    setShowNewClient(false);
    setNewClientName("");
    setSmartSuggested(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const buildTitle = (): string => {
    switch (template) {
      case "acao_cliente": return `${fields.acao || "Ação"} para ${fields.cliente || "cliente"}`;
      case "reuniao": return `${fields.assunto || "Reunião"} com ${fields.participante || "participante"}`;
      case "entrega": return `Entregar ${fields.projeto || "projeto"} — ${fields.cliente || "cliente"}`;
      case "tarefa_geral": return fields.descricao || "Tarefa";
      case "domestico": return `${fields.tarefa_casa || "Tarefa"} — ${fields.comodo || "Geral"}`;
      case "saude": return fields.atividade || "Saúde";
      default: return "";
    }
  };

  const titulo = buildTitle();
  const isValid = template && titulo.length > 3;

  // Smart module detection from keywords in built title
  useEffect(() => {
    if (!titulo || titulo.length < 4) return;
    // Don't override if template already set the module
    if (template === "domestico" || template === "saude") return;
    const detected = detectModuleFromKeywords(titulo);
    if (detected && detected !== modulo && !smartSuggested) {
      setModulo(detected);
      setSmartSuggested(true);
    }
  }, [titulo, template]);

  const SUBTASK_OPTIONS = useMemo(() => {
    switch (template) {
      case "acao_cliente":
      case "entrega":
        return ["Planejamento", "Desenvolvimento", "Teste", "Review", "Deploy", "Documentação", "Notificar cliente"];
      case "reuniao":
        return ["Preparar pauta", "Enviar convite", "Criar apresentação", "Anotar ata", "Enviar follow-up"];
      case "tarefa_geral":
        return ["Pesquisar", "Executar", "Revisar", "Finalizar", "Reportar"];
      case "domestico":
        return ["Separar materiais", "Executar", "Guardar tudo", "Verificar resultado"];
      case "saude":
        return ["Agendar", "Preparar documentos", "Ir ao local", "Registrar resultado"];
      default: return [];
    }
  }, [template]);

  const handleAddClient = async () => {
    if (!newClientName.trim() || savingClient) return;
    setSavingClient(true);
    try {
      const { data, error } = await supabase.from("clientes").insert({
        nome: newClientName.trim(),
        tipo: "pj",
        status: "ativo",
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
    } catch {
      toast.error("Erro ao adicionar cliente");
    } finally {
      setSavingClient(false);
      setShowNewClient(false);
      setNewClientName("");
    }
  };

  const handleSubmit = async () => {
    if (!isValid || saving) return;
    setSaving(true);

    try {
      const { data: mainTask, error } = await supabase.from("tasks").insert({
        titulo,
        modulo: modulo as any,
        urgencia,
        tipo: (template === "domestico" ? "domestico" : template === "reuniao" ? "administrativo" : "operacional") as any,
        dono: "eu" as any,
        tempo_min: 30,
        estado_ideal: "qualquer" as any,
        impacto: urgencia >= 3 ? 3 : 2,
        status: "backlog" as any,
        cliente_id: fields.cliente_id || null,
        data_limite: dataEntrega ? format(dataEntrega, "yyyy-MM-dd") : null,
        recorrente,
        frequencia_recorrencia: recorrente ? frequencia : null,
      } as any).select().single();

      if (error) throw error;

      let optimisticSubtasks: any[] = [];
      if (subtarefas.length > 0 && mainTask) {
        const subs = subtarefas.map((sub) => ({
          titulo: sub,
          modulo: modulo as any,
          urgencia: Math.max(1, urgencia - 1),
          tipo: "operacional" as any,
          dono: "eu" as any,
          tempo_min: 15,
          estado_ideal: "qualquer" as any,
          impacto: 1,
          status: "backlog" as any,
          parent_task_id: (mainTask as any).id,
        }));
        await supabase.from("tasks").insert(subs as any);

        optimisticSubtasks = subs.map((sub, idx) => ({
          id: `tmp_sub_${Date.now()}_${idx}`,
          criado_em: brasiliaTime().toISOString(),
          cliente_id: null,
          data_limite: null,
          depende_de: null,
          dono: sub.dono,
          estado_ideal: sub.estado_ideal,
          feito_em: null,
          frequencia_recorrencia: null,
          impacto: sub.impacto,
          modulo: sub.modulo,
          notas: null,
          parent_task_id: (mainTask as any).id,
          recorrente: false,
          status: sub.status,
          tempo_min: sub.tempo_min,
          tipo: sub.tipo,
          titulo: sub.titulo,
          urgencia: sub.urgencia,
        }));
      }

      if (mainTask) {
        queryClient.setQueryData(["tasks"], (current: any[] = []) => {
          const withoutSame = current.filter((t) => t.id !== mainTask.id);
          return [mainTask, ...optimisticSubtasks, ...withoutSame];
        });
      }

      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      try { await supabase.functions.invoke("classify-task", { body: { titulo } }); } catch {}

      logActivity("tarefa_estruturada_criada", {
        titulo, template, modulo, urgencia, recorrente, frequencia: recorrente ? frequencia : null,
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
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-card rounded-t-2xl border-t border-x shadow-lg max-h-[90vh] overflow-y-auto overscroll-contain">
        {/* Handle bar */}
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
          {success && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 animate-fade-in">
              <CheckCircle2 className="w-8 h-8 text-primary" />
              <p className="font-mono text-sm text-primary">Tarefa criada!</p>
            </div>
          )}

          {!success && (
            <>
              {/* Template selector */}
              <div>
                <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-2">
                  TIPO DE TAREFA
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => {
                    const TIcon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setTemplate(t.id); setFields({}); setSubtarefas([]); }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-3 rounded-lg text-xs font-mono text-left transition-all border min-h-[48px]",
                          template === t.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary text-muted-foreground border-transparent hover:border-primary/30 active:bg-secondary/80"
                        )}
                      >
                        <TIcon className="w-4 h-4 shrink-0" />
                        <span className="leading-tight">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {template && (
                <div className="space-y-4 animate-fade-in">
                  {/* Dynamic fields */}
                  {template === "acao_cliente" && (
                    <>
                      <DropdownField label="AÇÃO" options={ACOES} value={fields.acao} onChange={(v) => setFields({ ...fields, acao: v })} />
                      <ClientFieldEnhanced
                        clients={clientes}
                        value={fields.cliente}
                        onChange={(nome, id) => setFields({ ...fields, cliente: nome, cliente_id: id })}
                        showNewClient={showNewClient}
                        setShowNewClient={setShowNewClient}
                        newClientName={newClientName}
                        setNewClientName={setNewClientName}
                        onAddClient={handleAddClient}
                        savingClient={savingClient}
                      />
                    </>
                  )}

                  {template === "reuniao" && (
                    <>
                      <DropdownField label="ASSUNTO" options={ASSUNTOS} value={fields.assunto} onChange={(v) => setFields({ ...fields, assunto: v })} />
                      <ClientFieldEnhanced
                        clients={clientes}
                        value={fields.participante}
                        onChange={(nome) => setFields({ ...fields, participante: nome })}
                        label="PARTICIPANTE"
                        showNewClient={showNewClient}
                        setShowNewClient={setShowNewClient}
                        newClientName={newClientName}
                        setNewClientName={setNewClientName}
                        onAddClient={handleAddClient}
                        savingClient={savingClient}
                      />
                    </>
                  )}

                  {template === "entrega" && (
                    <>
                      <DropdownField label="PROJETO" options={PROJETOS} value={fields.projeto} onChange={(v) => setFields({ ...fields, projeto: v })} />
                      <ClientFieldEnhanced
                        clients={clientes}
                        value={fields.cliente}
                        onChange={(nome, id) => setFields({ ...fields, cliente: nome, cliente_id: id })}
                        showNewClient={showNewClient}
                        setShowNewClient={setShowNewClient}
                        newClientName={newClientName}
                        setNewClientName={setNewClientName}
                        onAddClient={handleAddClient}
                        savingClient={savingClient}
                      />
                    </>
                  )}

                  {template === "tarefa_geral" && (
                    <DropdownField label="DESCRIÇÃO" options={ACOES} value={fields.descricao} onChange={(v) => setFields({ ...fields, descricao: v })} />
                  )}

                  {template === "domestico" && (
                    <>
                      <DropdownField label="TAREFA" options={TAREFAS_CASA} value={fields.tarefa_casa} onChange={(v) => setFields({ ...fields, tarefa_casa: v })} />
                      <DropdownField label="CÔMODO" options={COMODOS} value={fields.comodo} onChange={(v) => setFields({ ...fields, comodo: v })} />
                    </>
                  )}

                  {template === "saude" && (
                    <DropdownField label="ATIVIDADE" options={ATIVIDADES_SAUDE} value={fields.atividade} onChange={(v) => setFields({ ...fields, atividade: v })} />
                  )}

                  {/* Date picker */}
                  <div>
                    <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">
                      DATA DE ENTREGA
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={cn(
                          "w-full flex items-center gap-2 px-3 py-3 rounded-lg border text-xs font-mono text-left transition-all min-h-[48px]",
                          dataEntrega ? "text-foreground" : "text-muted-foreground"
                        )}>
                          <CalendarIcon className="w-4 h-4 shrink-0" />
                          {dataEntrega
                            ? format(dataEntrega, "dd 'de' MMM, yyyy", { locale: ptBR })
                            : "Selecionar data"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dataEntrega}
                          onSelect={setDataEntrega}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Recurrence toggle */}
                  <div>
                    <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">
                      RECORRÊNCIA
                    </label>
                    <button
                      onClick={() => setRecorrente(!recorrente)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-3 rounded-lg border text-xs font-mono transition-all min-h-[48px]",
                        recorrente ? "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300" : "text-muted-foreground"
                      )}
                    >
                      <Repeat className="w-4 h-4 shrink-0" />
                      {recorrente ? "Tarefa recorrente" : "Tarefa única"}
                    </button>
                    {recorrente && (
                      <div className="flex gap-1.5 mt-2">
                        {RECURRENCE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setFrequencia(opt.value)}
                            className={cn(
                              "flex-1 px-2 py-2 rounded-lg text-[10px] font-mono transition-all border min-h-[40px]",
                              frequencia === opt.value
                                ? "bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300"
                                : "bg-secondary text-muted-foreground border-transparent"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Urgência */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className="font-mono text-[10px] text-muted-foreground tracking-wider">
                        URGÊNCIA
                      </label>
                      {state.current_energy && state.current_energy !== "foco_total" && (
                        <span className="inline-flex items-center gap-1 text-[8px] font-mono text-primary/70">
                          <Sparkles className="w-2.5 h-2.5" />
                          ajustada pela energia
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {URGENCIA_OPTIONS.map((opt) => {
                        const UIcon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setUrgencia(opt.value)}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] font-mono transition-all border min-h-[44px]",
                              urgencia === opt.value
                                ? opt.activeColor
                                : "bg-secondary text-muted-foreground border-transparent"
                            )}
                          >
                            <UIcon className="w-3.5 h-3.5" />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Módulo */}
                  <div>
                    <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">
                      MÓDULO
                    </label>
                    <div className="flex gap-2">
                      {MODULO_OPTIONS.map((opt) => {
                        const MIcon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setModulo(opt.value as any)}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] font-mono transition-all border min-h-[44px]",
                              modulo === opt.value
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-secondary text-muted-foreground border-transparent"
                            )}
                          >
                            <MIcon className="w-3.5 h-3.5" />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subtarefas */}
                  <div>
                    <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">
                      SUBTAREFAS ({subtarefas.length})
                    </label>
                    {subtarefas.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {subtarefas.map((sub, i) => (
                          <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2.5 min-h-[40px]">
                            <span className="text-xs font-mono flex-1">{sub}</span>
                            <button
                              onClick={() => setSubtarefas(subtarefas.filter((_, idx) => idx !== i))}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {SUBTASK_OPTIONS.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {SUBTASK_OPTIONS.filter((s) => !subtarefas.includes(s)).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setSubtarefas([...subtarefas, opt])}
                            className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[10px] font-mono bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all min-h-[36px]"
                          >
                            <Plus className="w-3 h-3" />
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  {titulo.length > 3 && (
                    <div className="bg-secondary/50 rounded-lg p-3 border border-dashed">
                      <p className="font-mono text-[9px] text-muted-foreground tracking-wider mb-1">PREVIEW</p>
                      <p className="text-sm font-medium">{titulo}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {MODULO_OPTIONS.find(m => m.value === modulo)?.label}
                        </span>
                        <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded", URGENCIA_OPTIONS[urgencia - 1]?.color)}>
                          {URGENCIA_OPTIONS[urgencia - 1]?.label}
                        </span>
                        {recorrente && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">
                            <Repeat className="w-2.5 h-2.5" />
                            {RECURRENCE_OPTIONS.find(r => r.value === frequencia)?.label}
                          </span>
                        )}
                        {dataEntrega && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            <CalendarIcon className="w-2.5 h-2.5" />
                            {format(dataEntrega, "dd/MM")}
                          </span>
                        )}
                        {subtarefas.length > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            {subtarefas.length} sub
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit */}
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

// ─── Dropdown Field ─────────────────────────────────────────
function DropdownField({
  label, options, value, onChange,
}: {
  label: string; options: string[]; value?: string; onChange: (v: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">{label}</label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-3 rounded-lg border text-xs font-mono text-left transition-all min-h-[48px]",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {value || `Selecionar ${label.toLowerCase()}`}
          <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0", isOpen && "rotate-180")} />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto animate-fade-in">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-3 text-xs font-mono hover:bg-secondary transition-colors min-h-[44px]",
                  value === opt && "bg-primary/10 text-primary"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Enhanced Client Field with inline add ──────────────────
function ClientFieldEnhanced({
  clients, value, onChange, label = "CLIENTE",
  showNewClient, setShowNewClient, newClientName, setNewClientName,
  onAddClient, savingClient,
}: {
  clients: { id: string; nome: string }[];
  value?: string;
  onChange: (nome: string, id?: string) => void;
  label?: string;
  showNewClient: boolean;
  setShowNewClient: (v: boolean) => void;
  newClientName: string;
  setNewClientName: (v: string) => void;
  onAddClient: () => void;
  savingClient: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">{label}</label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-3 rounded-lg border text-xs font-mono text-left transition-all min-h-[48px]",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {value || `Selecionar ${label.toLowerCase()}`}
          <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0", isOpen && "rotate-180")} />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto animate-fade-in">
            {clients.length === 0 && !showNewClient && (
              <p className="px-3 py-3 text-[10px] text-muted-foreground font-mono">Nenhum cliente cadastrado</p>
            )}
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => { onChange(c.nome, c.id); setIsOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-3 text-xs font-mono hover:bg-secondary transition-colors min-h-[44px]",
                  value === c.nome && "bg-primary/10 text-primary"
                )}
              >
                {c.nome}
              </button>
            ))}

            {/* Inline add client */}
            {!showNewClient ? (
              <button
                onClick={() => setShowNewClient(true)}
                className="w-full flex items-center gap-2 px-3 py-3 text-xs font-mono text-primary hover:bg-primary/5 transition-colors border-t min-h-[44px]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Adicionar novo cliente
              </button>
            ) : (
              <div className="p-2 border-t space-y-2">
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
                  style={{ fontSize: "16px" }}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && onAddClient()}
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={onAddClient}
                    disabled={!newClientName.trim() || savingClient}
                    className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-[10px] font-mono disabled:opacity-40 min-h-[40px]"
                  >
                    {savingClient ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Adicionar"}
                  </button>
                  <button
                    onClick={() => { setShowNewClient(false); setNewClientName(""); }}
                    className="px-3 py-2 rounded-lg bg-secondary text-muted-foreground text-[10px] font-mono min-h-[40px]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
