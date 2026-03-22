import { useState, useMemo } from "react";
import { EnergyState, Medicamento, RegistroHumor, RegistroSono, today } from "@/lib/store";
import { ENERGY_DESCRIPTIONS } from "@/lib/energy-constants";
import { useBemEstarStore } from "@/lib/bem-estar-store";
import { useProfileStore } from "@/lib/profile-store";
import { Pill, Moon, Sun, SmilePlus, Check, Plus, Frown, Meh, Smile, Laugh, Angry, AlertTriangle, Pencil, Trash2, X, ThumbsUp, Minus, ThumbsDown } from "lucide-react";
import { MealSection } from "@/components/bem-estar/MealSection";
import { ExerciseSection } from "@/components/bem-estar/ExerciseSection";
import { WeeklyDashboard } from "@/components/bem-estar/WeeklyDashboard";
import { WeightTracker } from "@/components/bem-estar/WeightTracker";


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
  onUpdateMed?: (id: string, changes: Partial<{ nome: string; dose: string; horarios: string[]; estoque: number; instrucoes: string | null }>) => void;
  onDeleteMed?: (id: string) => void;
  todayHumor?: RegistroHumor;
}

const moodOptions = [
  { val: -2, label: "Muito baixo", icon: Angry },
  { val: -1, label: "Baixo", icon: Frown },
  { val: 0, label: "Neutro", icon: Meh },
  { val: 1, label: "Bom", icon: Smile },
  { val: 2, label: "Muito bom", icon: Laugh },
];

export function HealthModule({
  energy,
  medicamentos,
  registros_humor,
  onTakeMed,
  isMedTaken,
  onMood,
  onSleep,
  onAddMed,
  onUpdateMed,
  onDeleteMed,
  todayHumor,
  registros_sono,
}: HealthModuleProps) {
  const [addingMed, setAddingMed] = useState(false);
  const [medName, setMedName] = useState("");
  const [medDose, setMedDose] = useState("");
  const [medHorario, setMedHorario] = useState("08:00");
  const [editingMed, setEditingMed] = useState<Medicamento | null>(null);
  const [editName, setEditName] = useState("");
  const [editDose, setEditDose] = useState("");
  const [editHorario, setEditHorario] = useState("");
  const [editEstoque, setEditEstoque] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const bemEstar = useBemEstarStore();
  const { profile, idade, pesoAtual } = useProfileStore();
  const todaySono = registros_sono.find((r) => r.data === today());

  // Parse med effectiveness from last 7 days of mood records
  const medEffectivenessLabel = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysStr = sevenDaysAgo.toISOString().split("T")[0];

    type EffectivenessValue = "bem" | "normal" | "sem_efeito";
    const counts: Record<EffectivenessValue, number> = { bem: 0, normal: 0, sem_efeito: 0 };
    let total = 0;

    for (const r of registros_humor) {
      if (r.data < sevenDaysStr) continue;
      if (!r.notas) continue;
      const match = r.notas.match(/med_effectiveness:\s*(bem|normal|sem_efeito)/);
      if (match) {
        counts[match[1] as EffectivenessValue]++;
        total++;
      }
    }

    if (total === 0) return null;

    // Return the most common response
    const max = Math.max(counts.bem, counts.normal, counts.sem_efeito);
    if (counts.bem === max) return { label: "Boa", color: "text-green-500", Icon: ThumbsUp };
    if (counts.normal === max) return { label: "Normal", color: "text-muted-foreground", Icon: Minus };
    return { label: "Baixa", color: "text-orange-400", Icon: ThumbsDown };
  }, [registros_humor]);

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

  const showMood = energy !== "basico";
  const showSleep = energy !== "basico";
  const showWeight = true; // always show
  const showExercise = true;
  const showMeals = true;
  const showDashboard = energy === "foco_total";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-mono text-lg font-bold tracking-tight">
          {profile?.nome ? `${profile.nome}, sua saúde` : "Saúde & Bem-Estar"}
        </h2>
        <p className="text-sm text-muted-foreground font-body mt-0.5">
          {energy === "basico"
            ? "Medicação e registros rápidos."
            : energy === "modo_leve"
            ? "Medicação, humor, alimentação e exercício."
            : "Visão completa: medicação, humor, sono, peso, alimentação, exercício e dashboard."}
        </p>
        {idade && (
          <p className="text-[10px] font-mono text-muted-foreground mt-1">
            {idade} anos
          </p>
        )}
      </div>

      {/* Peso */}
      {showWeight && <WeightTracker />}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <Pill className="w-3.5 h-3.5" /> Medicação
          </h3>
          <button onClick={() => setAddingMed(!addingMed)} className="text-primary hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {addingMed && (
          <div className="bg-card rounded-lg border p-4 space-y-3 animate-fade-in">
            <input value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="Nome do remédio" className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary" />
            <div className="flex gap-2">
              <input value={medDose} onChange={(e) => setMedDose(e.target.value)} placeholder="Dose (ex: 1 comprimido)" className="flex-1 bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary" />
              <input type="time" value={medHorario} onChange={(e) => setMedHorario(e.target.value)} className="bg-background border rounded-md p-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <button onClick={handleAddMed} className="w-full py-2 rounded-md bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90 transition-opacity">
              ADICIONAR
            </button>
          </div>
        )}

        {medicamentos.length === 0 && !addingMed ? (
          <div className="bg-card rounded-lg border p-6 text-center">
            <Pill className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground font-body">Nenhum medicamento configurado. Toque em + para adicionar.</p>
          </div>
        ) : (
          medicamentos.map((med) =>
            med.horarios.map((h) => {
              const taken = isMedTaken(med.id, h);
              return (
                <div key={`${med.id}-${h}`} className={`bg-card rounded-lg border p-4 transition-all ${taken ? "border-primary/20 bg-secondary/30" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div>
                        <span className="text-sm font-medium">{med.nome}</span>
                        <span className="text-xs text-muted-foreground ml-2">{med.dose} · {h}</span>
                      </div>
                      {h === med.horarios[0] && onUpdateMed && (
                        <button
                          onClick={() => {
                            setEditingMed(med);
                            setEditName(med.nome);
                            setEditDose(med.dose);
                            setEditHorario(med.horarios.join(", "));
                            setEditEstoque(String(med.estoque ?? 0));
                          }}
                          className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                          aria-label={`Editar ${med.nome}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <button onClick={() => onTakeMed(med.id, h)} disabled={taken} aria-label={taken ? `${med.nome} já tomado às ${h}` : `Marcar ${med.nome} como tomado às ${h}`} className={`font-mono text-xs px-4 py-2 rounded-md transition-all ${taken ? "bg-secondary text-foreground/50 cursor-default" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
                      {taken ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> TOMADO</span> : "TOMEI"}
                    </button>
                  </div>
                  {/* Low stock warning — show only on the first horario to avoid repetition */}
                  {med.estoque != null && med.estoque <= 7 && h === med.horarios[0] && (
                    <div className={`flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-md text-[11px] font-mono ${
                      med.estoque <= 3
                        ? "bg-destructive/10 text-destructive"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}>
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {med.estoque <= 3
                        ? `Estoque critico! Reponha urgente (${med.estoque} doses)`
                        : `Estoque baixo: ${med.estoque} doses restantes`}
                    </div>
                  )}
                  {/* Effectiveness indicator — show only on first horario */}
                  {h === med.horarios[0] && medEffectivenessLabel && (
                    <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5">
                      <medEffectivenessLabel.Icon className={`w-3 h-3 shrink-0 ${medEffectivenessLabel.color}`} />
                      <span className={`text-[11px] font-mono ${medEffectivenessLabel.color}`}>
                        Eficacia: {medEffectivenessLabel.label}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground/50 ml-auto">7d</span>
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>

      {/* Edit medication dialog */}
      {editingMed && onUpdateMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setEditingMed(null); setConfirmDelete(null); }}>
          <div className="bg-card rounded-lg border p-5 w-full max-w-sm space-y-3 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-xs font-semibold tracking-wider">EDITAR MEDICAMENTO</h4>
              <button onClick={() => { setEditingMed(null); setConfirmDelete(null); }} className="p-1 hover:bg-secondary rounded transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome" className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary" />
            <input value={editDose} onChange={(e) => setEditDose(e.target.value)} placeholder="Dose" className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary" />
            <input value={editHorario} onChange={(e) => setEditHorario(e.target.value)} placeholder="Horários (ex: 08:00, 20:00)" className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary" />
            <input type="number" value={editEstoque} onChange={(e) => setEditEstoque(e.target.value)} placeholder="Estoque (doses)" className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary" />
            <button
              onClick={() => {
                const horarios = editHorario.split(",").map((h) => h.trim()).filter(Boolean);
                onUpdateMed(editingMed.id, {
                  nome: editName.trim(),
                  dose: editDose.trim(),
                  horarios: horarios.length > 0 ? horarios : editingMed.horarios,
                  estoque: parseInt(editEstoque) || 0,
                });
                setEditingMed(null);
              }}
              className="w-full py-2 rounded-md bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90"
            >
              SALVAR
            </button>
            {onDeleteMed && (
              confirmDelete === editingMed.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { onDeleteMed(editingMed.id); setEditingMed(null); setConfirmDelete(null); }}
                    className="flex-1 py-2 rounded-md bg-destructive text-destructive-foreground font-mono text-xs tracking-wider hover:opacity-90"
                  >
                    CONFIRMAR EXCLUSAO
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 py-2 rounded-md bg-secondary text-foreground font-mono text-xs tracking-wider hover:opacity-90"
                  >
                    CANCELAR
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(editingMed.id)}
                  className="w-full py-2 rounded-md bg-secondary text-destructive font-mono text-xs tracking-wider hover:opacity-90 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" /> EXCLUIR MEDICAMENTO
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Humor */}
      {showMood && (
        <div className="space-y-2">
          <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <SmilePlus className="w-3.5 h-3.5" /> Humor hoje
          </h3>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex justify-between" role="radiogroup" aria-label="Humor hoje">
              {moodOptions.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.val}
                    onClick={() => onMood(m.val)}
                    role="radio"
                    aria-checked={todayHumor?.valor === m.val}
                    aria-label={`Humor: ${m.label}`}
                    className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all ${todayHumor?.valor === m.val ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-secondary"}`}
                  >
                    <Icon className={`w-5 h-5 ${todayHumor?.valor === m.val ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-mono text-[9px] text-muted-foreground">{m.label}</span>
                  </button>
                );
              })}
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
              <button onClick={() => onSleep("dormir")} disabled={!!todaySono?.horario_dormir} aria-label={todaySono?.horario_dormir ? "Horário de dormir já registrado" : "Registrar horário de dormir"} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-mono text-xs transition-all ${todaySono?.horario_dormir ? "bg-secondary text-foreground/50 cursor-default" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
                <Moon className="w-3.5 h-3.5" />
                {todaySono?.horario_dormir ? "REGISTRADO" : "INDO DORMIR"}
              </button>
              <button onClick={() => onSleep("acordar", 2)} disabled={!!todaySono?.horario_acordar} aria-label={todaySono?.horario_acordar ? "Horário de acordar já registrado" : "Registrar horário de acordar"} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-mono text-xs transition-all ${todaySono?.horario_acordar ? "bg-secondary text-foreground/50 cursor-default" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
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

          {/* Sleep trend — last 7 days */}
          {registros_sono.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-[10px] font-mono text-muted-foreground mb-2">Últimos 7 dias</p>
              <div className="flex items-end justify-between gap-1 h-12">
                {(() => {
                  const dayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];
                  const days: { label: string; hours: number | null; quality: number | null }[] = [];
                  for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split("T")[0];
                    const record = registros_sono.find((r) => r.data === dateStr);
                    days.push({
                      label: dayLabels[d.getDay()],
                      hours: record?.duracao_min ? record.duracao_min / 60 : null,
                      quality: record?.qualidade ?? null,
                    });
                  }
                  const maxH = 10;
                  return days.map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-0.5 flex-1">
                      <div className="w-full flex items-end justify-center" style={{ height: 32 }}>
                        {day.hours !== null ? (
                          <div
                            className="w-full max-w-[14px] rounded-sm"
                            style={{
                              height: `${Math.max(4, (day.hours / maxH) * 32)}px`,
                              backgroundColor: day.quality === 1
                                ? "hsl(var(--muted-foreground) / 0.3)"
                                : day.quality === 3
                                ? "hsl(var(--foreground))"
                                : "hsl(var(--foreground) / 0.5)",
                            }}
                          />
                        ) : (
                          <div className="w-full max-w-[14px] h-1 rounded-sm bg-muted-foreground/10" />
                        )}
                      </div>
                      <span className="text-[8px] font-mono text-muted-foreground/60">{day.label}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alimentação */}
      {showMeals && (
        <MealSection
          energy={energy}
          refeicoes={bemEstar.refeicoes}
          onAdd={bemEstar.addRefeicao}
        />
      )}

      {/* Exercício */}
      {showExercise && (
        <ExerciseSection
          exerciciosHoje={bemEstar.exerciciosHoje}
          exerciciosSemana={bemEstar.exerciciosSemana}
          metaDias={bemEstar.metaExercicio}
          metaDuracao={bemEstar.metaDuracao}
          diasAtivos={bemEstar.exerciciosDaSemana()}
          onAdd={bemEstar.addExercicio}
        />
      )}

      {/* Dashboard semanal — só no foco total */}
      {showDashboard && <WeeklyDashboard />}
    </div>
  );
}
