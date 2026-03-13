import { useState } from "react";
import {
  Clock, Check, Repeat, Calendar, UserCheck, Trash2, FileText,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UnifiedTask, STATUS_COLUMNS, MODULE_COLORS, MODULE_LABELS, MODULE_ICONS, TYPE_LABELS } from "./kanban-types";

interface TaskDetailDialogProps {
  item: UnifiedTask;
  onClose: () => void;
  onUpdateNotes: (notes: string) => void;
  onDelete: () => void;
  onComplete: () => void;
  onMoveStatus: (status: string) => void;
}

export function TaskDetailDialog({
  item,
  onClose,
  onUpdateNotes,
  onDelete,
  onComplete,
  onMoveStatus,
}: TaskDetailDialogProps) {
  const [notes, setNotes] = useState(item.notas || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const Icon = MODULE_ICONS[item.modulo];

  const handleSaveNotes = () => {
    onUpdateNotes(notes);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${MODULE_COLORS[item.modulo]}`}>
              <Icon className="w-3 h-3" />
              {MODULE_LABELS[item.modulo]}
            </span>
            {item.taskType && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {TYPE_LABELS[item.taskType] || item.taskType}
              </span>
            )}
          </div>
          <DialogTitle className="text-base">{item.titulo}</DialogTitle>
          <DialogDescription className="sr-only">Detalhes da tarefa</DialogDescription>
        </DialogHeader>

        {/* Meta info */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {item.tempo_min && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {item.tempo_min} min
              </span>
            )}
            {item.dono && item.dono !== "eu" && (
              <span className="flex items-center gap-1 text-primary">
                <UserCheck className="w-3.5 h-3.5" />
                {item.dono === "socio_medico" ? "Sócio Médico" : "Editor"}
              </span>
            )}
            {item.recorrente && (
              <span className="flex items-center gap-1 text-blue-600">
                <Repeat className="w-3.5 h-3.5" />
                {item.frequencia_recorrencia || "Recorrente"}
              </span>
            )}
            {item.data_limite && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(item.data_limite + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            )}
            {item.depende_de && (
              <span className="flex items-center gap-1 text-amber-600">
                <UserCheck className="w-3.5 h-3.5" /> Depende: {item.depende_de}
              </span>
            )}
          </div>

          {/* Status */}
          {item.tipo === "task" && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground">STATUS:</span>
              <div className="flex gap-1">
                {STATUS_COLUMNS.map((col) => (
                  <button
                    key={col.key}
                    onClick={() => onMoveStatus(col.key)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-colors ${
                      item.status === col.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks */}
          {item.subtasks && item.subtasks.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-muted-foreground">
                SUBTAREFAS ({item.subtasks.filter(s => s.status === "feito").length}/{item.subtasks.length})
              </span>
              <div className="mt-1.5 space-y-1.5">
                {item.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      sub.status === "feito" ? "bg-primary border-primary" : "border-muted-foreground/40"
                    }`}>
                      {sub.status === "feito" && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className={`text-sm ${sub.status === "feito" ? "line-through text-muted-foreground/50" : ""}`}>
                      {sub.titulo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description / Notes */}
          <div>
            <label className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 mb-1.5">
              <FileText className="w-3 h-3" /> DESCRIÇÃO / NOTAS
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione uma descrição ou notas..."
              className="min-h-[100px] text-sm resize-none"
              style={{ fontSize: 16 }}
            />
            {notes !== (item.notas || "") && (
              <Button size="sm" onClick={handleSaveNotes} className="mt-2 text-xs h-8">
                Salvar notas
              </Button>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button size="sm" onClick={onComplete} className="text-xs h-8 gap-1">
            <Check className="w-3 h-3" /> Concluir
          </Button>
          <div className="flex-1" />
          {item.tipo === "task" && (
            <>
              {!confirmDelete ? (
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} className="text-xs h-8 gap-1 text-destructive hover:text-destructive">
                  <Trash2 className="w-3 h-3" /> Excluir
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-destructive font-mono">Confirmar?</span>
                  <Button size="sm" variant="destructive" onClick={onDelete} className="text-xs h-7 px-2">
                    Sim
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)} className="text-xs h-7 px-2">
                    Não
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
