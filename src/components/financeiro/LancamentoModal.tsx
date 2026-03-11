import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { mesAbreviado, formatCurrency } from "@/lib/currency";
import type { Lancamento, FcTag } from "@/lib/financial-store";

interface LancamentoModalProps {
  ano: number;
  mes: number;
  dia: number;
  lancamentos: Lancamento[];
  tags: FcTag[];
  onSave: (data: { dia: number; entrada: number; saida: number; diario?: string; tagId?: string; tagValor?: number }) => void;
  onClose: () => void;
}

export function LancamentoModal({ ano, mes, dia, lancamentos, tags, onSave, onClose }: LancamentoModalProps) {
  const existing = lancamentos.find((l) => l.dia === dia);
  const [tipo, setTipo] = useState<"entrada" | "saida">("saida");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");
  const [tagId, setTagId] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      if (existing.entrada > 0) {
        setTipo("entrada");
        setValor(String(existing.entrada));
      } else if (existing.saida > 0) {
        setTipo("saida");
        setValor(String(existing.saida));
      }
      setObs(existing.diario || "");
    }
  }, [existing]);

  const handleSave = () => {
    const v = parseFloat(valor) || 0;
    if (v === 0 && !obs) return;

    onSave({
      dia,
      entrada: tipo === "entrada" ? v : (existing?.entrada || 0),
      saida: tipo === "saida" ? v : (existing?.saida || 0),
      diario: obs || undefined,
      tagId: tagId || undefined,
      tagValor: v,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card rounded-lg border shadow-lg p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-sm font-semibold tracking-wider">
            Dia {dia} de {mesAbreviado(mes)}/{String(ano).slice(2)}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tipo toggle */}
        <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-4">
          <button
            onClick={() => setTipo("entrada")}
            className={`flex-1 py-2 rounded-md font-mono text-xs font-medium tracking-wider transition-all ${
              tipo === "entrada" ? "bg-green-600 text-white shadow-sm" : "text-muted-foreground"
            }`}
          >
            ENTRADA
          </button>
          <button
            onClick={() => setTipo("saida")}
            className={`flex-1 py-2 rounded-md font-mono text-xs font-medium tracking-wider transition-all ${
              tipo === "saida" ? "bg-red-500 text-white shadow-sm" : "text-muted-foreground"
            }`}
          >
            SAÍDA
          </button>
        </div>

        {/* Valor */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">R$</span>
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className="w-full pl-10 pr-3 py-3 bg-background border rounded-md text-lg font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
        </div>

        {/* Observação */}
        <input
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Observação (opcional)"
          className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary mb-3"
        />

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-4">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Tag</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <button
                onClick={() => setTagId(null)}
                className={`font-mono text-[10px] px-2.5 py-1 rounded-md transition-colors ${
                  !tagId ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                NENHUMA
              </button>
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTagId(t.id)}
                  className={`font-mono text-[10px] px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    tagId === t.id ? "ring-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: t.cor + "30", borderColor: t.cor }}
                >
                  {t.emoji && <span>{t.emoji}</span>}
                  {t.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-md bg-primary text-primary-foreground font-mono text-sm font-semibold tracking-wider hover:opacity-90 transition-opacity"
          >
            SALVAR
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-md bg-secondary text-secondary-foreground font-mono text-sm hover:bg-secondary/80 transition-colors"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
}
