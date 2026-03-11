import { AlertTriangle } from "lucide-react";

interface MedAlertProps {
  pendingMeds: { medicamento: { id: string; nome: string; dose: string }; horario: string }[];
  onTake: (medId: string, horario: string) => void;
}

export function MedAlert({ pendingMeds, onTake }: MedAlertProps) {
  if (pendingMeds.length === 0) return null;

  return (
    <div className="bg-primary/10 border border-primary rounded-lg p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-primary" />
        <span className="font-mono text-sm font-semibold text-primary tracking-wide">
          MEDICAÇÃO PENDENTE
        </span>
      </div>
      <div className="space-y-2">
        {pendingMeds.map((pm) => (
          <div key={`${pm.medicamento.id}-${pm.horario}`} className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">{pm.medicamento.nome}</span>
              <span className="text-xs text-muted-foreground ml-2">{pm.medicamento.dose} · {pm.horario}</span>
            </div>
            <button
              onClick={() => onTake(pm.medicamento.id, pm.horario)}
              className="font-mono text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
            >
              TOMEI
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
