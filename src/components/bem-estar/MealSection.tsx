import { useState } from "react";
import { UtensilsCrossed, Check } from "lucide-react";
import type { EnergyState } from "@/lib/store";
import type { Refeicao } from "@/lib/bem-estar-store";

interface MealSectionProps {
  energy: EnergyState;
  refeicoes: Refeicao[];
  onAdd: (r: {
    refeicao: string;
    qualidade: number;
    descricao?: string;
    categorias?: string[];
    pulou?: boolean;
  }) => void;
}

const refeicaoTipos = [
  { key: "cafe_manha", label: "Café da manhã", horario: "7-9h" },
  { key: "almoco", label: "Almoço", horario: "12-14h" },
  { key: "jantar", label: "Jantar", horario: "18-21h" },
  { key: "lanche", label: "Lanche", horario: "" },
];

const qualidadeOptions = [
  { val: 3, label: "Saudável", color: "bg-emerald-500" },
  { val: 2, label: "Ok", color: "bg-amber-400" },
  { val: 1, label: "Ruim", color: "bg-red-400" },
];

const categoriasList = [
  "Proteína", "Vegetal", "Fruta", "Carboidrato", "Processado", "Fast food", "Caseiro",
];

export function MealSection({ energy, refeicoes, onAdd }: MealSectionProps) {
  const [openMeal, setOpenMeal] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [categorias, setCategorias] = useState<string[]>([]);

  const isModoBasico = energy === "basico";
  const isFocoTotal = energy === "foco_total";

  const getRefeicao = (tipo: string) => refeicoes.find((r) => r.refeicao === tipo);

  const handleQualidade = (tipo: string, qualidade: number) => {
    const payload: Parameters<typeof onAdd>[0] = { refeicao: tipo, qualidade };
    if (!isModoBasico && descricao.trim()) payload.descricao = descricao.trim();
    if (isFocoTotal && categorias.length > 0) payload.categorias = categorias;
    onAdd(payload);
    setOpenMeal(null);
    setDescricao("");
    setCategorias([]);
  };

  const handlePulou = (tipo: string) => {
    onAdd({ refeicao: tipo, qualidade: 1, pulou: true });
    setOpenMeal(null);
  };

  const toggleCategoria = (c: string) =>
    setCategorias((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const registradas = refeicoes.filter((r) => !r.pulou).length;
  const saudaveis = refeicoes.filter((r) => r.qualidade >= 2 && !r.pulou).length;

  return (
    <div className="space-y-2">
      <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
        <UtensilsCrossed className="w-3.5 h-3.5" /> Alimentação
      </h3>

      <div className="space-y-2">
        {refeicaoTipos.map((tipo) => {
          const reg = getRefeicao(tipo.key);
          const isOpen = openMeal === tipo.key;

          // Don't show lanche unless user opens it or already registered
          if (tipo.key === "lanche" && !reg && !isOpen) return null;

          return (
            <div key={tipo.key} className="bg-card rounded-lg border overflow-hidden">
              <button
                onClick={() => !reg && setOpenMeal(isOpen ? null : tipo.key)}
                disabled={!!reg}
                className="w-full p-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  {reg ? (
                    <div
                      className={`w-3 h-3 rounded-full ${
                        reg.pulou
                          ? "bg-muted-foreground line-through"
                          : reg.qualidade === 3
                          ? "bg-emerald-500"
                          : reg.qualidade === 2
                          ? "bg-amber-400"
                          : "bg-red-400"
                      }`}
                    />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
                  )}
                  <span className="text-sm font-medium">{tipo.label}</span>
                  {tipo.horario && (
                    <span className="text-[10px] text-muted-foreground font-mono">{tipo.horario}</span>
                  )}
                </div>
                {reg && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {reg.pulou ? "PULOU" : reg.qualidade === 3 ? "SAUDÁVEL" : reg.qualidade === 2 ? "OK" : "RUIM"}
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="border-t p-3 space-y-3 animate-fade-in">
                  {/* Qualidade — always shown */}
                  <div className="flex gap-2">
                    {qualidadeOptions.map((q) => (
                      <button
                        key={q.val}
                        onClick={() => handleQualidade(tipo.key, q.val)}
                        className="flex-1 py-2 rounded-md text-xs font-mono text-white transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor:
                            q.val === 3 ? "hsl(var(--chart-2))" : q.val === 2 ? "hsl(var(--chart-4))" : "hsl(var(--destructive))",
                        }}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>

                  {/* Descrição — modo leve e foco */}
                  {!isModoBasico && (
                    <input
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="O que você comeu?"
                      className="w-full bg-background border rounded-md p-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}

                  {/* Categorias — só foco total */}
                  {isFocoTotal && (
                    <div className="flex flex-wrap gap-1.5">
                      {categoriasList.map((c) => (
                        <button
                          key={c}
                          onClick={() => toggleCategoria(c)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all ${
                            categorias.includes(c)
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handlePulou(tipo.key)}
                    className="w-full py-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    PULEI ESTA REFEIÇÃO
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add lanche button */}
        {!refeicoes.find((r) => r.refeicao === "lanche") && openMeal !== "lanche" && (
          <button
            onClick={() => setOpenMeal("lanche")}
            className="w-full p-2 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors border border-dashed rounded-lg"
          >
            + ADICIONAR LANCHE
          </button>
        )}
      </div>

      {registradas > 0 && (
        <p className="text-[10px] text-muted-foreground font-mono text-center mt-1">
          {saudaveis} de {registradas} refeições saudáveis ou ok
        </p>
      )}
    </div>
  );
}
