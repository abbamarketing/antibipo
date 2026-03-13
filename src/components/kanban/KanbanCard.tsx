import { useState, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  Clock, ChevronDown, ChevronRight, ArrowRight, Send, Check,
  Repeat, Calendar, UserCheck, Trash2, Eye, Timer, MoreVertical,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UnifiedTask, STATUS_COLUMNS, MODULE_COLORS, MODULE_LABELS, MODULE_ICONS, TYPE_LABELS } from "./kanban-types";

interface KanbanCardProps {
  item: UnifiedTask;
  onComplete: () => void;
  onDelegate: () => void;
  onPush: () => void;
  onMoveStatus: (status: string) => void;
  onStartPomodoro: () => void;
  showPomodoro: boolean;
  onCompleteSubtask: (id: string) => void;
  onOpen: () => void;
  onDelete: () => void;
}

export function KanbanCard({
  item,
  onComplete,
  onDelegate,
  onPush,
  onMoveStatus,
  onStartPomodoro,
  showPomodoro,
  onCompleteSubtask,
  onOpen,
  onDelete,
}: KanbanCardProps) {
  const [showSubs, setShowSubs] = useState(false);
  const [fading, setFading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = MODULE_ICONS[item.modulo];
  const hasSubs = item.subtasks && item.subtasks.length > 0;
  const completedSubs = item.subtasks?.filter((s) => s.status === "feito").length || 0;

  const urgencyBorder =
    item.urgencia === 3 ? "border-l-red-400" : item.urgencia === 2 ? "border-l-amber-400" : "border-l-transparent";

  const handleComplete = useCallback(() => {
    // Fire confetti from button position
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { x, y },
        colors: ["#B06133", "#D4956B", "#8B4513", "#F5DEB3"],
        gravity: 1.2,
        scalar: 0.8,
        ticks: 80,
        disableForReducedMotion: true,
      });
    }
    // Fade out then complete
    setFading(true);
    setTimeout(() => onComplete(), 350);
  }, [onComplete]);

  return (
    <div
      ref={cardRef}
      className={`bg-card rounded-lg border p-3 border-l-[3px] ${urgencyBorder} transition-all hover:border-primary/20 ${
        fading ? "animate-fade-out opacity-0 scale-95 transition-all duration-300" : ""
      }`}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpen}>
          <p className="text-sm font-medium leading-snug">{item.titulo}</p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded ${MODULE_COLORS[item.modulo]}`}>
              <Icon className="w-2.5 h-2.5" />
              {MODULE_LABELS[item.modulo]}
            </span>
            {item.taskType && (
              <span className="text-[9px] font-mono text-muted-foreground">
                {TYPE_LABELS[item.taskType] || item.taskType}
              </span>
            )}
            {item.tempo_min && (
              <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                <Clock className="w-2.5 h-2.5" />{item.tempo_min}min
              </span>
            )}
            {item.dono && item.dono !== "eu" && (
              <span className="text-[9px] font-mono text-primary">
                {item.dono === "socio_medico" ? "Sócio" : "Editor"}
              </span>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {item.recorrente && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-blue-600 bg-blue-500/10 px-1 py-0.5 rounded">
                <Repeat className="w-2.5 h-2.5" />
                {item.frequencia_recorrencia || "Recorrente"}
              </span>
            )}
            {item.depende_de && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-amber-600 bg-amber-500/10 px-1 py-0.5 rounded">
                <UserCheck className="w-2.5 h-2.5" />
                {item.depende_de}
              </span>
            )}
            {item.data_limite && (() => {
              const deadline = new Date(item.data_limite + "T00:00:00");
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
              const isOverdue = diffDays < 0;
              const isToday = diffDays === 0;
              const isTomorrow = diffDays === 1;
              const label = isOverdue ? `Atrasada (${Math.abs(diffDays)}d)` : isToday ? "Hoje" : isTomorrow ? "Amanhã" : deadline.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
              const colorClass = isOverdue
                ? "text-destructive bg-destructive/15"
                : isToday
                ? "text-primary bg-primary/15"
                : isTomorrow
                ? "text-accent-foreground bg-accent"
                : "text-muted-foreground bg-secondary";
              return (
                <span className={`inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.5 rounded ${colorClass}`}>
                  <Calendar className="w-2.5 h-2.5" />
                  {label}
                </span>
              );
            })()}
          </div>

          {item.notas && (
            <p className="text-[11px] text-muted-foreground mt-1 font-body leading-relaxed line-clamp-2">{item.notas}</p>
          )}
        </div>
      </div>

      {/* Subtasks */}
      {hasSubs && (
        <div className="mt-2">
          <button onClick={() => setShowSubs(!showSubs)} className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors">
            {showSubs ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            SUBTAREFAS {completedSubs}/{item.subtasks!.length}
          </button>
          {showSubs && (
            <div className="mt-1.5 pl-3 space-y-1 border-l border-border">
              {item.subtasks!.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2">
                  <button
                    onClick={() => sub.status !== "feito" && onCompleteSubtask(sub.id)}
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      sub.status === "feito" ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary"
                    }`}
                  >
                    {sub.status === "feito" && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                  </button>
                  <span className={`text-xs font-body ${sub.status === "feito" ? "line-through text-muted-foreground/50" : ""}`}>
                    {sub.titulo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        <button onClick={onComplete} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-mono text-[10px] hover:opacity-90 transition-opacity">
          <Check className="w-3 h-3" /> Feito
        </button>
        {item.tipo === "task" && (
          <>
            <button onClick={onPush} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-mono text-[10px] hover:bg-secondary/80 transition-colors">
              <ArrowRight className="w-3 h-3" /> Adiar
            </button>
            {(item.taskType === "delegavel" || (item.dono && item.dono !== "eu")) && (
              <button onClick={onDelegate} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-mono text-[10px] hover:bg-secondary/80 transition-colors">
                <Send className="w-3 h-3" /> Delegar
              </button>
            )}
          </>
        )}
        {showPomodoro && (
          <button onClick={onStartPomodoro} className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">
            <Timer className="w-3 h-3" /> Pomodoro
          </button>
        )}

        {/* Context menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-auto p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            <DropdownMenuItem onClick={onOpen} className="text-xs gap-2">
              <Eye className="w-3.5 h-3.5" /> Abrir detalhes
            </DropdownMenuItem>
            {item.tipo === "task" && (
              <>
                <DropdownMenuSeparator />
                {STATUS_COLUMNS.filter((c) => c.key !== item.status).map((col) => (
                  <DropdownMenuItem key={col.key} onClick={() => onMoveStatus(col.key)} className="text-xs gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`} /> {col.label}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {item.tipo === "task" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-xs gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
