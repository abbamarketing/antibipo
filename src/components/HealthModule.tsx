import { useState } from "react";
import { EnergyState, Medicamento, RegistroHumor, RegistroSono, today } from "@/lib/store";
import { Pill, Moon, Sun, SmilePlus, Check, Plus } from "lucide-react";

interface HealthModuleProps {
  energy: EnergyState;
  medicamentos: Medicamento[];
  registros_humor: RegistroHumor[];
  registros_sono: RegistroSono[];
  onTakeMed: (medId: string, horario: string) => void;
  isMedTaken: (medId: string, horario: string) => boolean;
  onMood: (valor: number, notas?: string) => void;
  onSleep: (type: "dormir" | "acordar", qualidade?: 1 | 2 | 3) => void;
  onAddMed: (med: { nome: string; dose: string; horarios: string[]; estoque: number; instrucoes?: string }) => void;
  todayHumor?: RegistroHumor;
}

const moodEmojis = [
  { val: -2, label: "Muito baixo", emoji: "😞" },
  { val: -1, label: "Baixo", emoji: "😔" },
  { val: 0, label: "Neutro", emoji: "😐" },
  { val: 1, label: "Bom", emoji: "🙂" },
  { val: 2, label: "Muito bom", emoji: "😊" },
];

export function HealthModule({
  energy,
  medicamentos,
  onTakeMed,
  isMedTaken,
  onMood,
  onSleep,
  onAddMed,
  todayHumor,
  registros_sono,
}: HealthModuleProps) {
  const [addingMed, setAddingMed] = useState(false);
  const [medName, setMedName] = useState("");
  const [medDose, setMedDose] = useState("");
  const [medHorario, setMedHorario] = useState("08:00");

  const todaySono = registros_sono.find((r) => r.data === today());

  const handleAddMed = () => {
    if (!medName.trim()) return;
    onAddMed({
      nome: medName.trim(),
      dose: medDose.trim() || "1 comprimido",
      horarios: [medHorario],
      estoque: 30,
    });
    setMedName("");
    setMedDose("");
    setAddingMed(false);
  };

  // In basico mode, show only medication
  const showMood = energy !== "basico";
  const showSleep = energy !== "basico";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-mono text-lg font-bold tracking-tight">Saúde</h2>
        <p className="text-sm text-muted-foreground font-body mt-0.5">
          {energy === "basico"
            ? "Medicação."
            : energy === "modo_leve"
            ? "Medicação e registro."
            : "Medicação, humor e sono."}
        </p>
      </div>

      {/* Medicação */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <Pill className="w-3.5 h-3.5" /> Medicação
          </h3>
          <button
            onClick={() => setAddingMed(!addingMed)}
            className="text-primary hover:opacity-80 transition-opacity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {addingMed && (
          <div className="bg-card rounded-lg border p-4 space-y-3 animate-fade-in">
            <input
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="Nome do remédio"
              className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2">
              <input
                value={medDose}
                onChange={(e) => setMedDose(e.target.value)}
                placeholder="Dose (ex: 1 comprimido)"
                className="flex-1 bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="time"
                value={medHorario}
                onChange={(e) => setMedHorario(e.target.value)}
                className="bg-background border rounded-md p-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleAddMed}
              className="w-full py-2 rounded-md bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90 transition-opacity"
            >
              ADICIONAR
            </button>
          </div>
        )}

        {medicamentos.length === 0 && !addingMed ? (
          <div className="bg-card rounded-lg border p-6 text-center">
            <Pill className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground font-body">
              Nenhum medicamento configurado. Toque em + para adicionar.
            </p>
          </div>
        ) : (
          medicamentos.map((med) =>
            med.horarios.map((h) => {
              const taken = isMedTaken(med.id, h);
              return (
                <div key={`${med.id}-${h}`} className={`bg-card rounded-lg border p-4 transition-all ${taken ? "border-primary/20 bg-secondary/30" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{med.nome}</span>
                      <span className="text-xs text-muted-foreground ml-2">{med.dose} · {h}</span>
                    </div>
                    <button
                      onClick={() => onTakeMed(med.id, h)}
                      disabled={taken}
                      className={`font-mono text-xs px-4 py-2 rounded-md transition-all ${taken
                        ? "bg-secondary text-muted-foreground cursor-default"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                        }`}
                    >
                      {taken ? (
                        <span className="flex items-center gap-1"><Check className="w-3 h-3" /> TOMADO</span>
                      ) : (
                        "TOMEI"
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* Humor */}
      {showMood && (
        <div className="space-y-2">
          <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <SmilePlus className="w-3.5 h-3.5" /> Humor hoje
          </h3>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex justify-between">
              {moodEmojis.map((m) => (
                <button
                  key={m.val}
                  onClick={() => onMood(m.val)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all ${todayHumor?.valor === m.val ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-secondary"}`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="font-mono text-[9px] text-muted-foreground">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sono */}
      {showSleep && (
        <div className="space-y-2">
          <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <Moon className="w-3.5 h-3.5" /> Sono
          </h3>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex gap-3">
              <button
                onClick={() => onSleep("dormir")}
                disabled={!!todaySono?.horario_dormir}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-mono text-xs transition-all ${todaySono?.horario_dormir
                  ? "bg-secondary text-muted-foreground cursor-default"
                  : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
              >
                <Moon className="w-3.5 h-3.5" />
                {todaySono?.horario_dormir ? "REGISTRADO" : "INDO DORMIR"}
              </button>
              <button
                onClick={() => onSleep("acordar", 2)}
                disabled={!!todaySono?.horario_acordar}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-mono text-xs transition-all ${todaySono?.horario_acordar
                  ? "bg-secondary text-muted-foreground cursor-default"
                  : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
              >
                <Sun className="w-3.5 h-3.5" />
                {todaySono?.horario_acordar ? "REGISTRADO" : "ACORDEI"}
              </button>
            </div>
            {todaySono?.duracao_min && (
              <p className="text-center text-xs text-muted-foreground mt-2 font-mono">
                {Math.floor(todaySono.duracao_min / 60)}h{todaySono.duracao_min % 60}min de sono
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
