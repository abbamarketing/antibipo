import { useState } from "react";
import { Modulo, TaskType, TaskOwner, Urgency } from "@/lib/store";
import { X, Plus, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface QuickCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (data: {
    titulo: string;
    modulo: Modulo;
    tipo: TaskType;
    urgencia: Urgency;
    dono: TaskOwner;
    tempo_min: number;
    estado_ideal: "foco_total" | "modo_leve" | "basico" | "qualquer";
    impacto: 1 | 2 | 3;
    cliente_id?: string;
  }) => void;
}

export function QuickCapture({ open, onClose, onCapture }: QuickCaptureProps) {
  const [titulo, setTitulo] = useState("");
  const [modulo, setModulo] = useState<Modulo>("trabalho");
  const [urgencia, setUrgencia] = useState<Urgency>(2);
  const [clienteId, setClienteId] = useState<string | null>(null);

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").eq("status", "ativo").order("nome");
      if (error) throw error;
      return data;
    },
  });

  if (!open) return null;

  const handleSubmit = () => {
    if (!titulo.trim()) return;
    onCapture({
      titulo: titulo.trim(),
      modulo,
      tipo: "operacional",
      urgencia,
      dono: "eu",
      tempo_min: 30,
      estado_ideal: "qualquer",
      impacto: 2,
      ...(modulo === "trabalho" && clienteId ? { cliente_id: clienteId } : {}),
    });
    setTitulo("");
    setClienteId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-card rounded-lg border shadow-lg p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-sm font-semibold tracking-wider">CAPTURA RÁPIDA</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <textarea
          autoFocus
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="O que precisa ser feito?"
          className="w-full bg-background border rounded-md p-3 text-sm font-body resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        {/* Módulo */}
        <div className="flex gap-2 mt-3">
          {(["trabalho", "casa", "saude"] as Modulo[]).map((m) => (
            <button
              key={m}
              onClick={() => { setModulo(m); if (m !== "trabalho") setClienteId(null); }}
              className={`font-mono text-[11px] tracking-wider px-3 py-1.5 rounded-md transition-colors ${modulo === m ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            >
              {m === "saude" ? "SAÚDE" : m.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Cliente — only for trabalho */}
        {modulo === "trabalho" && clientes.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Cliente</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setClienteId(null)}
                className={`font-mono text-[10px] tracking-wider px-2.5 py-1 rounded-md transition-colors ${!clienteId ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
              >
                GERAL
              </button>
              {clientes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClienteId(c.id)}
                  className={`font-mono text-[10px] tracking-wider px-2.5 py-1 rounded-md transition-colors ${clienteId === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                >
                  {c.nome.toUpperCase()}
                  <span className="ml-1 opacity-60">
                    {(c as any).tipo === "fixo" ? "F" : (c as any).tipo === "pontual" ? "P" : "R"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Urgência */}
        <div className="flex gap-2 mt-3">
          {([1, 2, 3] as Urgency[]).map((u) => (
            <button
              key={u}
              onClick={() => setUrgencia(u)}
              className={`font-mono text-[11px] tracking-wider px-3 py-1.5 rounded-md transition-colors ${urgencia === u ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            >
              {u === 1 ? "TALVEZ" : u === 2 ? "SEMANA" : "HOJE"}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!titulo.trim()}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-md bg-primary text-primary-foreground font-mono text-sm font-semibold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <Plus className="w-4 h-4" /> CAPTURAR
        </button>
      </div>
    </div>
  );
}
