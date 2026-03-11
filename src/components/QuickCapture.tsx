import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-log";
import { brasiliaTimeString, brasiliaISO } from "@/lib/brasilia";
import { X, Send, Loader2, CheckCircle2, AlertCircle, Mic, MicOff } from "lucide-react";
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
  const [history, setHistory] = useState<{ text: string; response: string; tipo: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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
          const now = new Date();
          const dia = now.getDate();
          const mes = now.getMonth() + 1;
          const ano = now.getFullYear();
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
          await supabase.from("tasks").insert({
            titulo: dados.titulo || input,
            modulo: dados.modulo || "trabalho",
            urgencia: dados.urgencia || 2,
            tipo: "operacional",
            dono: "eu",
            tempo_min: 30,
            estado_ideal: "qualquer",
            impacto: 2,
            status: "hoje",
          });
          logActivity("tarefa_capturada", { titulo: dados.titulo, modulo: dados.modulo || "trabalho" });
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
          await supabase.from("profiles").update({ peso_kg: dados.peso_kg, updated_at: new Date().toISOString() } as any).eq("user_id", user.id);
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
          const alvo = new Date();
          alvo.setDate(alvo.getDate() + days);
          await supabase.from("metas_pessoais").insert({
            user_id: user.id,
            titulo: dados.meta_titulo || input,
            prazo: dados.meta_prazo || "6_meses",
            data_alvo: alvo.toISOString().split("T")[0],
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
      }
    } catch (err) {
      console.error("Action execution error:", err);
      throw err;
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
      const { data, error } = await supabase.functions.invoke("parse-command", {
        body: { message: text },
      });

      if (error) throw error;
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
