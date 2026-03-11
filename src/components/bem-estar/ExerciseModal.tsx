import { useState } from "react";
import { X } from "lucide-react";

interface ExerciseModalProps {
  onClose: () => void;
  onSave: (data: {
    tipo: string;
    duracao_min: number;
    intensidade: number;
    como_ficou?: number;
    notas?: string;
  }) => void;
}

const tipos = [
  { key: "academia", label: "Academia", emoji: "🏋️" },
  { key: "caminhada", label: "Caminhada", emoji: "🚶" },
  { key: "corrida", label: "Corrida", emoji: "🏃" },
  { key: "yoga", label: "Yoga", emoji: "🧘" },
  { key: "natacao", label: "Natação", emoji: "🏊" },
  { key: "bike", label: "Bike", emoji: "🚴" },
  { key: "outro", label: "Outro", emoji: "✏️" },
];

const duracoes = [15, 20, 30, 45, 60, 90];

export function ExerciseModal({ onClose, onSave }: ExerciseModalProps) {
  const [tipo, setTipo] = useState("");
  const [duracao, setDuracao] = useState(30);
  const [customDuracao, setCustomDuracao] = useState(false);
  const [intensidade, setIntensidade] = useState(0);
  const [comoFicou, setComoFicou] = useState<number | undefined>();
  const [notas, setNotas] = useState("");

  const canSave = tipo && duracao > 0 && intensidade > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      tipo,
      duracao_min: duracao,
      intensidade,
      como_ficou: comoFicou,
      notas: notas.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl w-full max-w-lg p-5 pb-8 space-y-4 animate-fade-in max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm font-bold tracking-tight">Registrar Exercício</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tipo */}
        <div>
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Tipo</label>
          <div className="grid grid-cols-4 gap-2 mt-1.5">
            {tipos.map((t) => (
              <button
                key={t.key}
                onClick={() => setTipo(t.key)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg text-xs transition-all ${
                  tipo === t.key
                    ? "bg-primary/10 ring-1 ring-primary"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                <span className="text-lg">{t.emoji}</span>
                <span className="font-mono text-[9px]">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Duração */}
        <div>
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Duração (min)</label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {duracoes.map((d) => (
              <button
                key={d}
                onClick={() => { setDuracao(d); setCustomDuracao(false); }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                  duracao === d && !customDuracao
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => setCustomDuracao(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                customDuracao
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Outro
            </button>
          </div>
          {customDuracao && (
            <input
              type="number"
              value={duracao}
              onChange={(e) => setDuracao(parseInt(e.target.value) || 0)}
              className="mt-2 w-20 bg-background border rounded-md p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              min={1}
              max={300}
            />
          )}
        </div>

        {/* Intensidade */}
        <div>
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Intensidade</label>
          <div className="flex gap-2 mt-1.5">
            {[
              { val: 1, label: "Leve" },
              { val: 2, label: "Moderado" },
              { val: 3, label: "Intenso" },
            ].map((i) => (
              <button
                key={i.val}
                onClick={() => setIntensidade(i.val)}
                className={`flex-1 py-2 rounded-md text-xs font-mono transition-all ${
                  intensidade === i.val
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>

        {/* Como ficou */}
        <div>
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Como ficou? <span className="text-muted-foreground/50">(opcional)</span>
          </label>
          <div className="flex gap-2 mt-1.5">
            {[
              { val: 1, label: "Exausto" },
              { val: 2, label: "Bem" },
              { val: 3, label: "Energizado" },
            ].map((c) => (
              <button
                key={c.val}
                onClick={() => setComoFicou(comoFicou === c.val ? undefined : c.val)}
                className={`flex-1 py-2 rounded-md text-xs font-mono transition-all ${
                  comoFicou === c.val
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Notas <span className="text-muted-foreground/50">(opcional)</span>
          </label>
          <input
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="ex: cansaço nas pernas"
            className="w-full mt-1.5 bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full py-3 rounded-md bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          REGISTRAR
        </button>
      </div>
    </div>
  );
}
