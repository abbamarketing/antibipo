import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-log";
import { brasiliaTimeString, brasiliaISO } from "@/lib/brasilia";
import { useDayContext } from "@/hooks/use-day-context";
import { X, Send, Loader2, CheckCircle2, AlertCircle, Mic, MicOff, Brain } from "lucide-react";
import { toast } from "sonner";

interface QuickCaptureProps {
  open: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

type FeedbackState = "idle" | "loading" | "success" | "error";

interface ActionResult {
  tipo: string;
  resposta: string;
  dados: Record<string, any>;
}

// Web Speech API types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export function QuickCapture({ open, onClose, onActionComplete }: QuickCaptureProps) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [lastResponse, setLastResponse] = useState("");
  const [adaptationNote, setAdaptationNote] = useState<string | null>(null);
  const [history, setHistory] = useState<{ text: string; response: string; tipo: string; adapted?: boolean }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const dayCtx = useDayContext();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setHistory([]);
      setFeedback("idle");
      setLastResponse("");
      stopListening();
    }
  }, [open]);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  // Initialize Speech Recognition
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Seu navegador nao suporta reconhecimento de voz");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setInput((prev) => (prev ? prev + " " : "") + finalTranscript);
      } else if (interimTranscript) {
        // Show interim results in a subtle way
        setInput((prev) => {
          const base = prev.replace(/\[.*?\]$/, "").trim();
          return base ? `${base} [${interimTranscript}]` : `[${interimTranscript}]`;
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        toast.error("Erro no reconhecimento de voz");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Clean up interim brackets
      setInput((prev) => prev.replace(/\s*\[.*?\]$/, ""));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    // Clean up interim brackets
    setInput((prev) => prev.replace(/\s*\[.*?\]$/, ""));
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!open) return null;

  const executeAction = async (result: ActionResult) => {
    const { tipo, dados } = result;
    const today = brasiliaISO();

    try {
      switch (tipo) {
        case "financeiro": {
          const bDate = new Date(brasiliaISO() + "T12:00:00");
          const dia = bDate.getDate();
          const mes = bDate.getMonth() + 1;
          const ano = bDate.getFullYear();
          await supabase.from("fc_lancamentos").upsert({
            ano, mes, dia,
            entrada: dados.tipo_lancamento === "entrada" ? dados.valor : 0,
            saida: dados.tipo_lancamento === "saida" ? dados.valor : 0,
            diario: dados.descricao || null,
          }, { onConflict: "ano,mes,dia" });
          logActivity("captura_rapida", { tipo: "financeiro", valor: dados.valor, direcao: dados.tipo_lancamento });
          break;
        }

        case "calendario": {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Nao autenticado");
          await supabase.from("reunioes").insert({
            user_id: user.id,
            titulo: dados.titulo || "Reuniao",
            data: dados.data || today,
            hora_inicio: dados.hora_inicio || "09:00",
            hora_fim: dados.hora_fim || null,
            local: dados.local || null,
            participantes: dados.participantes || null,
            tipo: dados.tipo_reuniao || "reuniao",
          });
          logActivity("captura_rapida", { tipo: "calendario", titulo: dados.titulo, data: dados.data });
          break;
        }

        case "casa": {
          await supabase.from("registros_limpeza").insert({
            tarefa: dados.tarefa || "Limpeza",
            comodo: dados.comodo || "geral",
          });
          logActivity("tarefa_casa_concluida", { tarefa: dados.tarefa, comodo: dados.comodo });
          break;
        }

        case "trabalho": {
          // Find or auto-create client by name
          let clienteId = null;
          if (dados.cliente_nome) {
            const { data: clienteMatch } = await supabase
              .from("clientes")
              .select("id")
              .ilike("nome", `%${dados.cliente_nome}%`)
              .limit(1)
              .maybeSingle();
            
            if (clienteMatch) {
              clienteId = clienteMatch.id;
            } else {
              // Auto-create client
              const { data: newCliente } = await supabase
                .from("clientes")
                .insert({ nome: dados.cliente_nome, tipo: "recorrente", status: "ativo" })
                .select("id")
                .single();
              clienteId = newCliente?.id || null;
              if (clienteId) {
                toast.info(`Cliente "${dados.cliente_nome}" criado automaticamente`);
              }
            }
          }

          // Create main task
          const { data: mainTask } = await supabase.from("tasks").insert({
            titulo: dados.titulo || input,
            modulo: (dados.modulo as any) || "trabalho",
            urgencia: dados.urgencia || 2,
            tipo: "operacional" as any,
            dono: "eu" as any,
            tempo_min: 30,
            estado_ideal: "qualquer" as any,
            impacto: 2,
            status: "hoje" as any,
            cliente_id: clienteId,
            recorrente: dados.recorrente || false,
            frequencia_recorrencia: dados.frequencia_recorrencia || null,
            depende_de: dados.depende_de || null,
            data_limite: dados.data_limite || null,
            notas: dados.notas || null,
          } as any).select().single();

          // Create subtasks if detected
          if (dados.subtarefas && dados.subtarefas.length > 0 && mainTask) {
            const subtaskInserts = dados.subtarefas.map((sub: string) => ({
              titulo: sub,
              modulo: "trabalho" as any,
              urgencia: dados.urgencia || 2,
              tipo: "operacional" as any,
              dono: "eu" as any,
              tempo_min: 15,
              estado_ideal: "qualquer" as any,
              impacto: 1,
              status: "backlog" as any,
              parent_task_id: (mainTask as any).id,
              cliente_id: clienteId,
            }));
            await supabase.from("tasks").insert(subtaskInserts as any);
          }

          logActivity("tarefa_capturada", {
            titulo: dados.titulo,
            modulo: dados.modulo || "trabalho",
            cliente: dados.cliente_nome,
            recorrente: dados.recorrente,
            subtarefas: dados.subtarefas?.length || 0,
            depende_de: dados.depende_de,
          });
          break;
        }

        case "saude_exercicio": {
          await supabase.from("bm_exercicios").insert({
            tipo: dados.tipo_exercicio || "geral",
            duracao_min: dados.duracao_min || 30,
            intensidade: dados.intensidade || 2,
            data: today,
          });
          logActivity("captura_rapida", { tipo: "exercicio", exercicio: dados.tipo_exercicio, duracao: dados.duracao_min });
          break;
        }

        case "saude_medicamento": {
          logActivity("captura_rapida", { tipo: "medicamento_info", descricao: dados.descricao });
          break;
        }

        case "saude_peso": {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Nao autenticado");
          await supabase.from("registros_peso").insert({
            user_id: user.id,
            peso_kg: dados.peso_kg,
            data: today,
          });
          await supabase.from("profiles").update({ peso_kg: dados.peso_kg, updated_at: new Date(brasiliaISO() + "T12:00:00").toISOString() } as any).eq("user_id", user.id);
          logActivity("captura_rapida", { tipo: "peso", peso_kg: dados.peso_kg });
          break;
        }

        case "saude_humor": {
          await supabase.from("registros_humor").upsert({
            data: today,
            valor: dados.humor_valor || 3,
            notas: dados.humor_notas || null,
          }, { onConflict: "data" });
          logActivity("humor_registrado", { valor: dados.humor_valor, notas: dados.humor_notas });
          break;
        }

        case "compras": {
          await supabase.from("lista_compras").insert({
            item: dados.item || input,
            quantidade: dados.quantidade || null,
            categoria: dados.categoria || "geral",
          });
          logActivity("item_compra_adicionado", { item: dados.item });
          break;
        }

        case "meta": {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Nao autenticado");
          const prazoMap: Record<string, number> = { "1_mes": 30, "6_meses": 180, "1_ano": 365 };
          const days = prazoMap[dados.meta_prazo || "6_meses"] || 180;
          const alvo = new Date(brasiliaISO() + "T12:00:00");
          alvo.setDate(alvo.getDate() + days);
          const alvoStr = alvo.toISOString().split("T")[0];
          await supabase.from("metas_pessoais").insert({
            user_id: user.id,
            titulo: dados.meta_titulo || input,
            prazo: dados.meta_prazo || "6_meses",
            data_alvo: alvoStr,
          });
          logActivity("captura_rapida", { tipo: "meta", titulo: dados.meta_titulo, prazo: dados.meta_prazo });
          break;
        }

        case "diario": {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Nao autenticado");

          // Save diary entry
          await supabase.from("diario_entradas").insert({
            user_id: user.id,
            texto: dados.diario_texto || result.resposta,
            humor_detectado: dados.diario_humor || null,
            sentimento: dados.diario_sentimento || null,
            tags_extraidas: dados.diario_tags || null,
            fonte: isListening ? "audio" : "texto",
            data: today,
          });

          // Also update mood if detected
          if (dados.diario_humor) {
            await supabase.from("registros_humor").upsert({
              data: today,
              valor: dados.diario_humor,
              notas: dados.diario_texto?.substring(0, 200) || null,
            }, { onConflict: "data" });
          }

          logActivity("diario_registrado", {
            humor: dados.diario_humor,
            sentimento: dados.diario_sentimento,
            tags: dados.diario_tags,
            fonte: isListening ? "audio" : "texto",
          });
          break;
        }

        case "criar_tracker": {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Nao autenticado");

          const trackerTipo = dados.tracker_tipo || "recorrente";
          let config: Record<string, any> = {};

          if (trackerTipo === "recorrente") {
            config = { frequencia_dias: dados.tracker_frequencia_dias || 7 };
          } else if (trackerTipo === "checklist") {
            const itens = (dados.tracker_checklist_itens || []).map((label: string, i: number) => ({
              id: `item_${i}`,
              label,
            }));
            config = { itens, reseta_diario: true };
          } else if (trackerTipo === "meta") {
            config = { alvo: dados.tracker_meta_alvo || 1, unidade: dados.tracker_meta_unidade || "unidades", atual: 0 };
          } else if (trackerTipo === "alerta") {
            config = { data_alvo: dados.tracker_data_alvo || "", lembrete_dias_antes: dados.tracker_lembrete_dias || 3, recorrente: false };
          }

          await supabase.from("custom_trackers" as any).insert({
            user_id: user.id,
            titulo: dados.tracker_titulo || dados.titulo || input,
            tipo: trackerTipo,
            modulo: dados.tracker_modulo || dados.modulo || "saude",
            secao: dados.tracker_secao || "geral",
            config,
            ativo: true,
          } as any);

          logActivity("tracker_criado", {
            titulo: dados.tracker_titulo,
            tipo: trackerTipo,
            modulo: dados.tracker_modulo,
            secao: dados.tracker_secao,
          });
          break;
        }

        case "plano_casa": {
          const tarefasPlano = dados.plano_tarefas || [];
          if (tarefasPlano.length > 0) {
            // Create tasks in the tasks table with module "casa" and deadline
            for (const t of tarefasPlano) {
              await supabase.from("tasks").insert({
                titulo: `${t.tarefa} — ${t.comodo}`,
                modulo: "casa" as any,
                urgencia: t.prioridade || 2,
                tipo: "domestico" as any,
                dono: "eu" as any,
                tempo_min: t.tempo_estimado_min || 15,
                estado_ideal: "qualquer" as any,
                impacto: t.prioridade === 1 ? 3 : 2,
                status: "hoje" as any,
                data_limite: dados.plano_prazo || null,
                notas: dados.plano_resumo || null,
              } as any);
            }
            toast.success(`Plano criado com ${tarefasPlano.length} tarefas!`);
          }
          logActivity("captura_rapida", {
            tipo: "plano_casa",
            tarefas: tarefasPlano.length,
            prazo: dados.plano_prazo,
          });
          break;
        }
      }
    } catch (err) {
      console.error("Action execution error:", err);
      throw err;
    }
  };

  // Build AI context from user data
  const buildContext = async (): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return "";

      const todayStr = brasiliaISO();

      const [
        { data: profile },
        { data: recentLogs },
        { data: summaries },
        { data: clientes },
        { data: pendingTasks },
        { data: lastHumor },
        { data: lastSono },
        { data: tarefasCasa },
      ] = await Promise.all([
        supabase.from("profiles").select("nome, trabalho_tipo, trabalho_equipe, trabalho_clientes_ativos, objetivo_saude, casa_comodos, casa_moradores, casa_pets").eq("user_id", user.id).maybeSingle(),
        supabase.from("activity_log").select("acao, detalhes").eq("user_id", user.id).order("criado_em", { ascending: false }).limit(10),
        supabase.from("configuracoes").select("valor").eq("user_id", user.id).like("chave", "resumo_logs_%").order("updated_at", { ascending: false }).limit(2),
        supabase.from("clientes").select("nome, tipo, status").eq("status", "ativo").limit(20),
        supabase.from("tasks").select("titulo, status, urgencia, dono").in("status", ["hoje", "em_andamento", "aguardando"]).limit(10),
        supabase.from("registros_humor").select("valor, notas").eq("data", todayStr).maybeSingle(),
        supabase.from("registros_sono").select("horario_dormir, horario_acordar, qualidade").eq("data", todayStr).maybeSingle(),
        supabase.from("tarefas_casa" as any).select("comodo, tarefa, frequencia").eq("ativo", true).order("comodo"),
      ]);

      const parts: string[] = [];
      if (profile?.nome) parts.push(`Nome: ${profile.nome}`);
      if (profile?.trabalho_tipo) parts.push(`Trabalho: ${profile.trabalho_tipo}, equipe: ${profile.trabalho_equipe || "solo"}`);
      if (profile?.casa_comodos) parts.push(`Casa: ${profile.casa_comodos} cômodos, ${profile.casa_moradores || 1} moradores${profile.casa_pets ? ", tem pets" : ""}`);
      if (tarefasCasa?.length) {
        const comodos = [...new Set((tarefasCasa as any[]).map((t: any) => t.comodo))];
        parts.push(`Cômodos cadastrados: ${comodos.join(", ")}`);
        parts.push(`Tarefas domésticas cadastradas: ${(tarefasCasa as any[]).map((t: any) => `${t.tarefa} (${t.comodo})`).join(", ")}`);
      }
      if (clientes?.length) parts.push(`Clientes ativos: ${clientes.map((c: any) => `${c.nome} (${c.tipo})`).join(", ")}`);
      if (pendingTasks?.length) parts.push(`Tarefas pendentes: ${pendingTasks.map((t: any) => `${t.titulo} [${t.status}]`).join(", ")}`);
      if (lastHumor) parts.push(`Humor hoje: ${lastHumor.valor}/5`);
      if (lastSono) parts.push(`Sono: ${lastSono.qualidade ? `qualidade ${lastSono.qualidade}/3` : "registrado"}`);
      if (summaries?.length) {
        const latestSummary = (summaries[0] as any)?.valor?.resumo;
        if (latestSummary) parts.push(`Ultimo resumo IA: ${latestSummary}`);
      }
      if (recentLogs?.length) {
        const recent = recentLogs.slice(0, 5).map((l: any) => l.acao).join(", ");
        parts.push(`Acoes recentes: ${recent}`);
      }

      return parts.join("\n");
    } catch (e) {
      console.error("Context build failed:", e);
      return "";
    }
  };

  const handleSubmit = async () => {
    // Clean up interim brackets before submitting
    const text = input.replace(/\s*\[.*?\]$/, "").trim();
    if (!text) return;

    if (isListening) stopListening();
    setInput("");
    setFeedback("loading");
    setLastResponse("");

    try {
      const context = await buildContext();
      const { data, error } = await supabase.functions.invoke("parse-command", {
        body: { message: text, context },
      });

      if (error) throw error;
      if (data?.ai_provider) {
        const { trackAIProvider } = await import("@/lib/ai-stats");
        trackAIProvider(data.ai_provider);
      }
      if (data?.error) {
        setFeedback("error");
        setLastResponse(data.error);
        return;
      }

      const result = data as ActionResult;
      await executeAction(result);

      setFeedback("success");
      setLastResponse(result.resposta);
      setHistory((prev) => [...prev, { text, response: result.resposta, tipo: result.tipo }]);
      onActionComplete?.();

      setTimeout(() => setFeedback("idle"), 2000);
    } catch (err) {
      console.error("QuickCapture error:", err);
      setFeedback("error");
      setLastResponse("Nao consegui processar. Tente reformular.");
      setTimeout(() => setFeedback("idle"), 3000);
    }
  };

  const tipoLabel: Record<string, string> = {
    financeiro: "Financeiro",
    calendario: "Calendario",
    casa: "Casa",
    trabalho: "Trabalho",
    saude_exercicio: "Exercicio",
    saude_medicamento: "Medicamento",
    saude_peso: "Peso",
    saude_humor: "Humor",
    compras: "Compras",
    meta: "Meta",
    diario: "Diario",
  };

  const tipoColor: Record<string, string> = {
    financeiro: "text-green-600",
    calendario: "text-blue-500",
    casa: "text-amber-600",
    trabalho: "text-primary",
    diario: "text-purple-500",
    saude_exercicio: "text-red-500",
    saude_humor: "text-pink-500",
    saude_peso: "text-teal-500",
    compras: "text-orange-500",
    meta: "text-indigo-500",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-card rounded-lg border shadow-lg animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div>
            <h3 className="font-mono text-sm font-semibold tracking-wider">CAPTURA</h3>
            <p className="font-mono text-[9px] text-muted-foreground/60 tracking-wider mt-0.5">
              diario / comandos / audio
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div ref={historyRef} className="max-h-48 overflow-y-auto px-4 space-y-2">
            {history.map((h, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-end">
                  <div className="bg-primary/10 rounded-lg px-3 py-1.5 max-w-[80%]">
                    <p className="text-xs font-body">{h.text}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-secondary rounded-lg px-3 py-1.5 max-w-[80%]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`font-mono text-[9px] tracking-wider ${tipoColor[h.tipo] || "text-primary"}`}>
                        {tipoLabel[h.tipo] || h.tipo}
                      </span>
                    </div>
                    <p className="text-xs font-body text-muted-foreground">{h.response}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feedback */}
        {feedback !== "idle" && (
          <div className={`mx-4 mt-2 flex items-center gap-2 p-2 rounded-md text-xs font-mono ${
            feedback === "loading" ? "bg-secondary text-muted-foreground" :
            feedback === "success" ? "bg-primary/10 text-primary" :
            "bg-destructive/10 text-destructive"
          }`}>
            {feedback === "loading" && <Loader2 className="w-3 h-3 animate-spin" />}
            {feedback === "success" && <CheckCircle2 className="w-3 h-3" />}
            {feedback === "error" && <AlertCircle className="w-3 h-3" />}
            <span>{feedback === "loading" ? "Processando..." : lastResponse}</span>
          </div>
        )}

        {/* Input */}
        <div className="p-4 pt-2">
          {isListening ? (
            /* Recording state — prominent finalize button */
            <div className="space-y-3">
              <div className="bg-background border rounded-lg p-3 min-h-[64px] flex items-center">
                <p className="text-sm font-body text-muted-foreground whitespace-pre-wrap">
                  {input || "Ouvindo..."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-[10px] text-red-500 tracking-wider flex-1">GRAVANDO</span>
                <button
                  onClick={() => {
                    stopListening();
                  }}
                  className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <MicOff className="w-3.5 h-3.5" />
                  FINALIZAR
                </button>
              </div>
            </div>
          ) : (
            /* Normal input state */
            <div className="flex items-end gap-2">
              <button
                onClick={startListening}
                className="p-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
                title="Gravar audio"
              >
                <Mic className="w-4 h-4" />
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="fale sobre seu dia, registre gastos, agende reunioes..."
                className="flex-1 bg-background border rounded-lg p-3 text-sm font-body resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={feedback === "loading"}
              />

              <button
                onClick={handleSubmit}
                disabled={!input.replace(/\s*\[.*?\]$/, "").trim() || feedback === "loading"}
                className="p-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
