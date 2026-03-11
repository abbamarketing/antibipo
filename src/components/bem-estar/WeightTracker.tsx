import { useState } from "react";
import { useProfileStore } from "@/lib/profile-store";
import { Scale, TrendingDown, TrendingUp, Minus, Plus, X } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function WeightTracker() {
  const { pesoAtual, ultimoPeso, pesoHistory, imc, imcCategoria, profile, addPeso } = useProfileStore();
  const [showAdd, setShowAdd] = useState(false);
  const [peso, setPeso] = useState(pesoAtual?.toString() || "");

  const handleAdd = () => {
    const val = parseFloat(peso);
    if (isNaN(val) || val <= 0) return;
    addPeso({ peso_kg: val });
    setShowAdd(false);
  };

  // Trend: compare last 2 entries
  const trend = pesoHistory.length >= 2
    ? pesoHistory[0].peso_kg - pesoHistory[1].peso_kg
    : null;

  const imcColorMap: Record<string, string> = {
    abaixo: "text-blue-400",
    normal: "text-green-500",
    sobrepeso: "text-yellow-500",
    obesidade: "text-red-400",
  };

  const imcLabelMap: Record<string, string> = {
    abaixo: "Abaixo do peso",
    normal: "Peso normal",
    sobrepeso: "Sobrepeso",
    obesidade: "Obesidade",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
          <Scale className="w-3.5 h-3.5" /> Peso
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-primary hover:opacity-80 transition-opacity"
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-lg border p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="Ex: 82.5"
              className="flex-1 bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <span className="font-mono text-sm text-muted-foreground">kg</span>
          </div>
          <button
            onClick={handleAdd}
            disabled={!peso}
            className="w-full py-2 rounded-md bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90 disabled:opacity-40"
          >
            REGISTRAR PESO
          </button>
        </div>
      )}

      {pesoAtual ? (
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-mono font-bold">{pesoAtual}</span>
              <span className="text-sm text-muted-foreground ml-1">kg</span>
              {trend !== null && trend !== 0 && (
                <span className={`ml-2 inline-flex items-center gap-0.5 text-xs font-mono ${
                  trend > 0 ? "text-red-400" : "text-green-500"
                }`}>
                  {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(trend).toFixed(1)}kg
                </span>
              )}
            </div>
            {imc && imcCategoria && (
              <div className="text-right">
                <span className={`font-mono text-sm font-bold ${imcColorMap[imcCategoria]}`}>
                  IMC {imc}
                </span>
                <p className={`text-[10px] font-mono ${imcColorMap[imcCategoria]}`}>
                  {imcLabelMap[imcCategoria]}
                </p>
              </div>
            )}
          </div>
          {ultimoPeso && (
            <p className="text-[10px] text-muted-foreground font-mono mt-2">
              Último registro: {formatDistanceToNow(new Date(ultimoPeso.data), { locale: ptBR, addSuffix: true })}
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full bg-card rounded-lg border border-dashed p-4 text-center hover:border-primary/30 transition-all"
        >
          <Scale className="w-5 h-5 mx-auto text-muted-foreground/40 mb-1" />
          <p className="text-xs text-muted-foreground font-body">
            Registre seu peso para acompanhar.
          </p>
        </button>
      )}
    </div>
  );
}
