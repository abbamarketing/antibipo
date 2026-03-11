import { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2 } from "lucide-react";
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
  const valorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existing) {
      setObs(existing.diario || "");
    }
    setTimeout(() => valorRef.current?.focus(), 150);
  }, [existing]);

  const handleSave = () => {
    const v = parseFloat(valor) || 0;
    if (v === 0 && !obs) return;

    onSave({
      dia,
      entrada: tipo === "entrada" ? v + (existing?.entrada || 0) : (existing?.entrada || 0),
      saida: tipo === "saida" ? v + (existing?.saida || 0) : (existing?.saida || 0),
      diario: obs || existing?.diario || undefined,
      tagId: tagId || undefined,
      tagValor: v,
    });
  };

  const quickValues = tipo === "saida" ? [5, 10, 20, 50, 100] : [500, 1000, 2000, 5000];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card rounded-lg border shadow-lg animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-border/50">
          <h3 className="font-mono text-sm font-semibold tracking-wider">
            {dia} {mesAbreviado(mes)}/{String(ano).slice(2)}
          </h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Existing data summary */}
          {existing && (existing.entrada > 0 || existing.saida > 0) && (
            <div className="bg-secondary/50 rounded-md p-3 space-y-1">
              <p className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">Registrado</p>
              <div className="flex items-center gap-3">
                {existing.entrada > 0 && (
                  <span className="font-mono text-xs text-green-600">+{formatCurrency(existing.entrada)}</span>
                )}
                {existing.saida > 0 && (
                  <span className="font-mono text-xs text-red-500">-{formatCurrency(existing.saida)}</span>
                )}
              </div>
              {existing.diario && (
                <p className="text-xs text-muted-foreground font-body">{existing.diario}</p>
              )}
            </div>
          )}

          {/* Tipo toggle */}
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setTipo("saida")}
              className={`flex-1 py-2.5 rounded-md font-mono text-xs font-medium tracking-wider transition-all ${
                tipo === "saida" ? "bg-red-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              SAIDA
            </button>
            <button
              onClick={() => setTipo("entrada")}
              className={`flex-1 py-2.5 rounded-md font-mono text-xs font-medium tracking-wider transition-all ${
                tipo === "entrada" ? "bg-green-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ENTRADA
            </button>
          </div>

          {/* Valor */}
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-lg text-muted-foreground">R$</span>
              <input
                ref={valorRef}
                type="number"
                inputMode="decimal"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full pl-12 pr-4 py-4 bg-background border rounded-lg text-2xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary text-center"
              />
            </div>

            {/* Quick value buttons */}
            <div className="flex gap-1.5 mt-2">
              {quickValues.map((qv) => (
                <button
                  key={qv}
                  onClick={() => setValor(String(qv))}
                  className="flex-1 py-1.5 rounded-md bg-secondary text-secondary-foreground font-mono text-[10px] font-medium hover:bg-secondary/80 transition-colors"
                >
                  {qv}
                </button>
              ))}
            </div>
          </div>

          {/* Observação */}
          <input
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Observacao (opcional)"
            className="w-full bg-background border rounded-md p-3 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Tag</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <button
                  onClick={() => setTagId(null)}
                  className={`font-mono text-[10px] px-2.5 py-1.5 rounded-md transition-colors ${
                    !tagId ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  NENHUMA
                </button>
                {tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTagId(t.id)}
                    className={`font-mono text-[10px] px-2.5 py-1.5 rounded-md transition-colors ${
                      tagId === t.id ? "ring-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: t.cor + "30", borderColor: t.cor }}
                  >
                    {t.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!valor && !obs}
            className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-mono text-sm font-semibold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {existing ? "ADICIONAR" : "SALVAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
