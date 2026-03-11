import { useState } from "react";
import { Dumbbell, Plus } from "lucide-react";
import type { Exercicio } from "@/lib/bem-estar-store";
import { ExerciseModal } from "./ExerciseModal";

interface ExerciseSectionProps {
  exerciciosHoje: Exercicio[];
  exerciciosSemana: Exercicio[];
  metaDias: number;
  metaDuracao: number;
  diasAtivos: number;
  onAdd: (e: {
    tipo: string;
    duracao_min: number;
    intensidade: number;
    como_ficou?: number;
    notas?: string;
  }) => void;
}

const intensidadeLabel: Record<number, string> = { 1: "Leve", 2: "Moderado", 3: "Intenso" };
const comoFicouLabel: Record<number, string> = { 1: "Exausto", 2: "Bem", 3: "Energizado" };

function getWeekDays(): { label: string; date: string; isPast: boolean; isToday: boolean }[] {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    return {
      label: labels[i],
      date: dateStr,
      isPast: d < new Date(now.toISOString().split("T")[0]),
      isToday: dateStr === now.toISOString().split("T")[0],
    };
  });
}

export function ExerciseSection({
  exerciciosHoje,
  exerciciosSemana,
  metaDias,
  metaDuracao,
  diasAtivos,
  onAdd,
}: ExerciseSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const weekDays = getWeekDays();

  const exerciciosByDate = new Map<string, Exercicio[]>();
  exerciciosSemana.forEach((e) => {
    const arr = exerciciosByDate.get(e.data) || [];
    arr.push(e);
    exerciciosByDate.set(e.data, arr);
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
          <Dumbbell className="w-3.5 h-3.5" /> Exercício
        </h3>
        <button onClick={() => setShowModal(true)} className="text-primary hover:opacity-80 transition-opacity">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Week dots */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex justify-between mb-2">
          {weekDays.map((d) => {
            const dayExercises = exerciciosByDate.get(d.date) || [];
            const totalMin = dayExercises.reduce((s, e) => s + e.duracao_min, 0);
            const metMeta = totalMin >= metaDuracao;
            const hasExercise = dayExercises.length > 0;

            let circleClass = "w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-mono transition-all ";
            if (hasExercise && metMeta) {
              circleClass += "bg-emerald-500 text-white";
            } else if (hasExercise) {
              circleClass += "border-2 border-dashed border-emerald-400 text-emerald-600";
            } else if (d.isToday) {
              circleClass += "border-2 border-primary/40 text-muted-foreground";
            } else if (d.isPast) {
              circleClass += "border border-muted-foreground/20 text-muted-foreground/40";
            } else {
              circleClass += "border border-muted-foreground/10 text-muted-foreground/20";
            }

            return (
              <div key={d.date} className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-muted-foreground">{d.label}</span>
                <div className={circleClass}>
                  {hasExercise ? dayExercises[0].tipo.slice(0, 2).toUpperCase() : ""}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[10px] font-mono text-muted-foreground">
          {diasAtivos} de {metaDias} dias esta semana
        </p>
      </div>

      {/* Today's exercises */}
      {exerciciosHoje.length > 0 && (
        <div className="space-y-1.5">
          {exerciciosHoje.map((e) => (
            <div key={e.id} className="bg-card rounded-lg border p-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium capitalize">{e.tipo}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {e.duracao_min}min · {intensidadeLabel[e.intensidade]}
                </span>
              </div>
              {e.como_ficou && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {comoFicouLabel[e.como_ficou]}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {exerciciosHoje.length === 0 && (
        <button
          onClick={() => setShowModal(true)}
          className="w-full p-3 border border-dashed rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
        >
          + REGISTRAR ATIVIDADE
        </button>
      )}

      {showModal && (
        <ExerciseModal
          onClose={() => setShowModal(false)}
          onSave={(data) => {
            onAdd(data);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
