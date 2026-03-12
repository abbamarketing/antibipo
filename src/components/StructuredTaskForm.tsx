import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFlowStore } from "@/lib/store";
import { logActivity } from "@/lib/activity-log";
import { brasiliaTimeString } from "@/lib/brasilia";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  X, Plus, CalendarIcon, Trash2, ChevronDown, Loader2, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface StructuredTaskFormProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

// ─── Templates ──────────────────────────────────────────────
const TEMPLATES = [
  { id: "acao_cliente", label: "Fazer ação para cliente", fields: ["acao", "cliente", "data_entrega"] },
  { id: "reuniao", label: "Reunião / call", fields: ["assunto", "participante", "data_entrega"] },
  { id: "entrega", label: "Entregar projeto", fields: ["projeto", "cliente", "data_entrega"] },
  { id: "tarefa_geral", label: "Tarefa operacional", fields: ["descricao", "data_entrega"] },
  { id: "domestico", label: "Tarefa doméstica", fields: ["tarefa_casa", "comodo", "data_entrega"] },
  { id: "saude", label: "Tarefa de saúde", fields: ["atividade", "data_entrega"] },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];

// ─── Field options ──────────────────────────────────────────
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
  { value: 1, label: "Baixa", color: "bg-secondary text-muted-foreground" },
  { value: 2, label: "Média", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  { value: 3, label: "Alta", color: "bg-destructive/15 text-destructive" },
];

const MODULO_OPTIONS = [
  { value: "trabalho", label: "Trabalho" },
  { value: "casa", label: "Casa" },
  { value: "saude", label: "Saúde" },
];

type FieldValues = Record<string, string>;

export function StructuredTaskForm({ open, onClose, onCreated }: StructuredTaskFormProps) {
  const [template, setTemplate] = useState<TemplateId | null>(null);
  const [fields, setFields] = useState<FieldValues>({});
  const [dataEntrega, setDataEntrega] = useState<Date | undefined>();
  const [urgencia, setUrgencia] = useState(2);
  const [modulo, setModulo] = useState<"trabalho" | "casa" | "saude">("trabalho");
  const [subtarefas, setSubtarefas] = useState<string[]>([]);
  const [newSubIdx, setNewSubIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load clients for dropdown
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  useEffect(() => {
    supabase.from("clientes").select("id, nome").eq("status", "ativo").order("nome").then(({ data }) => {
      if (data) setClientes(data);
    });
  }, []);

  // Auto-set modulo based on template
  useEffect(() => {
    if (template === "domestico") setModulo("casa");
    else if (template === "saude") setModulo("saude");
    else if (template && template !== "domestico" && template !== "saude") setModulo("trabalho");
  }, [template]);

  const reset = () => {
    setTemplate(null);
    setFields({});
    setDataEntrega(undefined);
    setUrgencia(2);
    setModulo("trabalho");
    setSubtarefas([]);
    setNewSubIdx(null);
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Build title from template + fields
  const buildTitle = (): string => {
    switch (template) {
      case "acao_cliente":
        return `${fields.acao || "Ação"} para ${fields.cliente || "cliente"}`;
      case "reuniao":
        return `${fields.assunto || "Reunião"} com ${fields.participante || "participante"}`;
      case "entrega":
        return `Entregar ${fields.projeto || "projeto"} — ${fields.cliente || "cliente"}`;
      case "tarefa_geral":
        return fields.descricao || "Tarefa";
      case "domestico":
        return `${fields.tarefa_casa || "Tarefa"} — ${fields.comodo || "Geral"}`;
      case "saude":
        return fields.atividade || "Saúde";
      default:
        return "";
    }
  };

  const titulo = buildTitle();
  const isValid = template && titulo.length > 3;

  // Subtask options from predefined list based on template
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
      default:
        return [];
    }
  }, [template]);

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
        status: "hoje" as any,
        cliente_id: fields.cliente_id || null,
        data_limite: dataEntrega ? format(dataEntrega, "yyyy-MM-dd") : null,
      } as any).select().single();

      if (error) throw error;

      // Create subtasks
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
      }

      // AI classify in background
      try {
        await supabase.functions.invoke("classify-task", {
          body: { titulo },
        });
      } catch {}

      logActivity("tarefa_estruturada_criada", {
        titulo,
        template,
        modulo,
        urgencia,
        subtarefas: subtarefas.length,
        data_entrega: dataEntrega ? format(dataEntrega, "yyyy-MM-dd") : null,
        hora: brasiliaTimeString(),
      });

      setSuccess(true);
      toast.success("Tarefa criada!");
      onCreated?.();

      setTimeout(() => {
        reset();
      }, 1200);
    } catch (err) {
      console.error("Task creation error:", err);
      toast.error("Erro ao criar tarefa");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-card rounded-lg border shadow-lg animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2 sticky top-0 bg-card z-10">
          <div>
            <h3 className="font-mono text-sm font-semibold tracking-wider">NOVA TAREFA</h3>
            <p className="font-mono text-[9px] text-muted-foreground/60 tracking-wider mt-0.5">
              Preencha os campos • sem texto livre
            </p>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 pt-2 space-y-4">
          {/* Success state */}
          {success && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 animate-fade-in">
              <CheckCircle2 className="w-8 h-8 text-primary" />
              <p className="font-mono text-sm text-primary">Tarefa criada!</p>
            </div>
          )}

          {!success && (
            <>
              {/* Step 1: Template */}
              <div>
                <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">
                  TIPO DE TAREFA
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTemplate(t.id); setFields({}); setSubtarefas([]); }}
                      className={cn(
                        "px-3 py-2 rounded-md text-xs font-mono text-left transition-all border",
                        template === t.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-muted-foreground border-transparent hover:border-primary/30"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Fields based on template */}
              {template && (
                <div className="space-y-3 animate-fade-in">
                  {/* Dynamic fields */}
                  {template === "acao_cliente" && (
                    <>
                      <DropdownField label="AÇÃO" options={ACOES} value={fields.acao} onChange={(v) => setFields({ ...fields, acao: v })} />
                      <ClientField clients={clientes} value={fields.cliente} onChange={(nome, id) => setFields({ ...fields, cliente: nome, cliente_id: id })} />
                    </>
                  )}

                  {template === "reuniao" && (
                    <>
                      <DropdownField label="ASSUNTO" options={ASSUNTOS} value={fields.assunto} onChange={(v) => setFields({ ...fields, assunto: v })} />
                      <ClientField clients={clientes} value={fields.participante} onChange={(nome) => setFields({ ...fields, participante: nome })} label="PARTICIPANTE" />
                    </>
                  )}

                  {template === "entrega" && (
                    <>
                      <DropdownField label="PROJETO" options={PROJETOS} value={fields.projeto} onChange={(v) => setFields({ ...fields, projeto: v })} />
                      <ClientField clients={clientes} value={fields.cliente} onChange={(nome, id) => setFields({ ...fields, cliente: nome, cliente_id: id })} />
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
                          "w-full flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-mono text-left transition-all",
                          dataEntrega ? "text-foreground" : "text-muted-foreground"
                        )}>
                          <CalendarIcon className="w-3.5 h-3.5" />
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
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Urgência */}
                  <div>
                    <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">
                      URGÊNCIA
                    </label>
                    <div className="flex gap-1.5">
                      {URGENCIA_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setUrgencia(opt.value)}
                          className={cn(
                            "flex-1 px-3 py-1.5 rounded-md text-[10px] font-mono transition-all border",
                            urgencia === opt.value
                              ? `${opt.color} border-current`
                              : "bg-secondary text-muted-foreground border-transparent"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Módulo */}
                  <div>
                    <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">
                      MÓDULO
                    </label>
                    <div className="flex gap-1.5">
                      {MODULO_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setModulo(opt.value as any)}
                          className={cn(
                            "flex-1 px-3 py-1.5 rounded-md text-[10px] font-mono transition-all border",
                            modulo === opt.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary text-muted-foreground border-transparent"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subtarefas */}
                  <div>
                    <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">
                      SUBTAREFAS ({subtarefas.length})
                    </label>
                    {subtarefas.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {subtarefas.map((sub, i) => (
                          <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-md px-3 py-1.5">
                            <span className="text-xs font-mono flex-1">{sub}</span>
                            <button
                              onClick={() => setSubtarefas(subtarefas.filter((_, idx) => idx !== i))}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {SUBTASK_OPTIONS.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {SUBTASK_OPTIONS.filter((s) => !subtarefas.includes(s)).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setSubtarefas([...subtarefas, opt])}
                            className="px-2 py-1 rounded text-[9px] font-mono bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                          >
                            + {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  {titulo.length > 3 && (
                    <div className="bg-secondary/50 rounded-md p-3 border border-dashed">
                      <p className="font-mono text-[9px] text-muted-foreground tracking-wider mb-1">PREVIEW</p>
                      <p className="text-sm font-medium">{titulo}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">{modulo}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${URGENCIA_OPTIONS[urgencia - 1]?.color}`}>
                          {URGENCIA_OPTIONS[urgencia - 1]?.label}
                        </span>
                        {dataEntrega && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
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
                    className="w-full py-3 rounded-md bg-primary text-primary-foreground font-mono text-xs tracking-wider disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
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
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange: (v: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">
        {label}
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs font-mono text-left transition-all",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {value || `Selecionar ${label.toLowerCase()}`}
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto animate-fade-in">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs font-mono hover:bg-secondary transition-colors",
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

// ─── Client Field ───────────────────────────────────────────
function ClientField({
  clients,
  value,
  onChange,
  label = "CLIENTE",
}: {
  clients: { id: string; nome: string }[];
  value?: string;
  onChange: (nome: string, id?: string) => void;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">
        {label}
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs font-mono text-left transition-all",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {value || `Selecionar ${label.toLowerCase()}`}
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto animate-fade-in">
            {clients.length === 0 ? (
              <p className="px-3 py-2 text-[10px] text-muted-foreground font-mono">
                Nenhum cliente cadastrado
              </p>
            ) : (
              clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onChange(c.nome, c.id); setIsOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs font-mono hover:bg-secondary transition-colors",
                    value === c.nome && "bg-primary/10 text-primary"
                  )}
                >
                  {c.nome}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
