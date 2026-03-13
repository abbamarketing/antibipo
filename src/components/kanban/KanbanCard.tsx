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
  item, onComplete, onDelegate, onPush, onMoveStatus,
  onStartPomodoro, showPomodoro, onCompleteSubtask, onOpen, onDelete,
}: KanbanCardProps) {
  const [showSubs, setShowSubs] = useState(false);
  const [fading, setFading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = MODULE_ICONS[item.modulo];
  const hasSubs = item.subtasks && item.subtasks.length > 0;
  const completedSubs = item.subtasks?.filter((s) => s.status === "feito").length || 0;

  const urgencyBorder =
    item.urgencia === 3 ? "border-l-destructive" : item.urgencia === 2 ? "border-l-amber-400" : "border-l-transparent";

  const handleComplete = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 40, spread: 50, origin: { x, y },
        colors: ["#B06133", "#D4956B", "#8B4513", "#F5DEB3"],
        gravity: 1.2, scalar: 0.8, ticks: 80, disableForReducedMotion: true,
      });
    }
    setFading(true);
    setTimeout(() => onComplete(), 350);
  }, [onComplete]);

  return (
    <div
      ref={cardRef}
      className={`bg-card rounded-2xl border-l-[3px] ${urgencyBorder} shadow-sm p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        fading ? "animate-fade-out opacity-0 scale-95 transition-all duration-300" : ""
      }`}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpen}>
          <p className="text-sm font-medium leading-snug">{item.titulo}</p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-lg ${MODULE_COLORS[item.modulo]}`}>
              <Icon className="w-3 h-3" />
              {MODULE_LABELS[item.modulo]}
            </span>
            {item.taskType && (
              <span className="text-[10px] font-mono text-muted-foreground/70 px-1.5 py-0.5">
                {TYPE_LABELS[item.taskType] || item.taskType}
              </span>
            )}
            {item.tempo_min && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
                <Clock className="w-3 h-3" />{item.tempo_min}min
              </span>
            )}
            {item.dono && item.dono !== "eu" && (
              <span className="text-[10px] font-mono text-primary px-1.5 py-0.5">
                {item.dono === "socio_medico" ? "Sócio" : "Editor"}
              </span>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {item.recorrente && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-600 bg-blue-500/10 px-2 py-1 rounded-lg">
                <Repeat className="w-3 h-3" />
                {item.frequencia_recorrencia || "Recorrente"}
              </span>
            )}
            {item.depende_de && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-600 bg-amber-500/10 px-2 py-1 rounded-lg">
                <UserCheck className="w-3 h-3" />
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
                ? "text-destructive bg-destructive/10"
                : isToday
                ? "text-primary bg-primary/10"
                : isTomorrow
                ? "text-accent-foreground bg-accent/10"
                : "text-muted-foreground/70 bg-secondary/30";
              return (
                <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-lg ${colorClass}`}>
                  <Calendar className="w-3 h-3" />
                  {label}
                </span>
              );
            })()}
          </div>

          {item.notas && (
            <p className="text-xs text-muted-foreground/60 mt-2 font-body leading-relaxed line-clamp-2">{item.notas}</p>
          )}
        </div>
      </div>

      {/* Subtasks */}
      {hasSubs && (
        <div className="mt-3">
          <button onClick={() => setShowSubs(!showSubs)} className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground/60 hover:text-foreground transition-colors py-1">
            {showSubs ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            SUBTAREFAS {completedSubs}/{item.subtasks!.length}
          </button>
          {showSubs && (
            <div className="mt-2 pl-3 space-y-2 border-l border-border/30">
              {item.subtasks!.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2.5">
                  <button
                    onClick={() => sub.status !== "feito" && onCompleteSubtask(sub.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 shrink-0 ${
                      sub.status === "feito" ? "bg-primary border-primary scale-110" : "border-muted-foreground/30 hover:border-primary hover:scale-110"
                    }`}
                  >
                    {sub.status === "feito" && <Check className="w-3 h-3 text-primary-foreground" />}
                  </button>
                  <span className={`text-sm font-body ${sub.status === "feito" ? "line-through text-muted-foreground/40" : ""}`}>
                    {sub.titulo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions — larger touch targets */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button
          onClick={handleComplete}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-mono text-[11px] hover:opacity-90 active:scale-95 transition-all duration-150 min-h-[44px]"
        >
          <Check className="w-4 h-4" /> Feito
        </button>
        {item.tipo === "task" && (
          <>
            <button onClick={onPush} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-secondary/60 text-secondary-foreground font-mono text-[11px] hover:bg-secondary/80 active:scale-95 transition-all duration-150 min-h-[44px]">
              <ArrowRight className="w-4 h-4" /> Adiar
            </button>
            {(item.taskType === "delegavel" || (item.dono && item.dono !== "eu")) && (
              <button onClick={onDelegate} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-secondary/60 text-secondary-foreground font-mono text-[11px] hover:bg-secondary/80 active:scale-95 transition-all duration-150 min-h-[44px]">
                <Send className="w-4 h-4" /> Delegar
              </button>
            )}
          </>
        )}
        {showPomodoro && (
          <button onClick={onStartPomodoro} className="flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-mono text-muted-foreground/60 hover:text-primary active:scale-95 transition-all duration-150 min-h-[44px]">
            <Timer className="w-4 h-4" /> Pomodoro
          </button>
        )}

        {/* Context menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-auto p-2.5 rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-secondary/40 transition-all duration-150 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuItem onClick={onOpen} className="text-sm gap-2 py-2.5">
              <Eye className="w-4 h-4" /> Abrir detalhes
            </DropdownMenuItem>
            {item.tipo === "task" && (
              <>
                <DropdownMenuSeparator />
                {STATUS_COLUMNS.filter((c) => c.key !== item.status).map((col) => (
                  <DropdownMenuItem key={col.key} onClick={() => onMoveStatus(col.key)} className="text-sm gap-2 py-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} /> {col.label}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {item.tipo === "task" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-sm gap-2 py-2.5 text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4" /> Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
