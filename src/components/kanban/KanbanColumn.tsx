import { ChevronDown, ChevronRight } from "lucide-react";
import { KanbanCard } from "./KanbanCard";
import { QueueStepper } from "./QueueStepper";
import type { UnifiedTask } from "./kanban-types";

interface KanbanColumnProps {
  colKey: string;
  label: string;
  dot: string;
  tasks: UnifiedTask[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  // Focus mode (only for "hoje")
  focusMode?: boolean;
  focusIndex?: number;
  focusedTask?: UnifiedTask | null;
  slideDirection?: "up" | "none";
  onFocusPrev?: () => void;
  onFocusNext?: () => void;
  // Card callbacks
  onComplete: (item: UnifiedTask) => void;
  onDelegate: (item: UnifiedTask) => void;
  onPush: (item: UnifiedTask) => void;
  onMoveStatus: (item: UnifiedTask, status: string) => void;
  onStartPomodoro: (item: UnifiedTask) => void;
  showPomodoro: boolean;
  onCompleteSubtask: (subId: string) => void;
  onOpen: (item: UnifiedTask) => void;
  onDelete: (item: UnifiedTask) => void;
}

export function KanbanColumn({
  colKey, label, dot, tasks, isCollapsed, onToggleCollapse,
  focusMode, focusIndex = 0, focusedTask, slideDirection = "none",
  onFocusPrev, onFocusNext,
  onComplete, onDelegate, onPush, onMoveStatus,
  onStartPomodoro, showPomodoro, onCompleteSubtask, onOpen, onDelete,
}: KanbanColumnProps) {
  const isHoje = colKey === "hoje";

  return (
    <div className="space-y-2">
      <button onClick={onToggleCollapse} className="flex items-center gap-2 w-full">
        {isCollapsed ? <ChevronRight className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
        <div className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">{label}</span>
        <span className="font-mono text-[10px] text-muted-foreground/50">{tasks.length}</span>
      </button>
      {!isCollapsed && (
        <div className="space-y-2 pl-5">
          {tasks.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/40 font-mono py-2">Vazio</p>
          ) : isHoje && focusMode && focusedTask ? (
            <div>
              <QueueStepper total={tasks.length} current={focusIndex} tasks={tasks} onPeek={() => {}} />
              <div
                key={focusedTask.id}
                className={`transition-all duration-300 ease-out ${slideDirection === "up" ? "animate-[slideUp_0.35s_ease-out]" : ""}`}
              >
                <CardWithCallbacks
                  item={focusedTask} onComplete={onComplete} onDelegate={onDelegate} onPush={onPush}
                  onMoveStatus={onMoveStatus} onStartPomodoro={onStartPomodoro} showPomodoro={showPomodoro}
                  onCompleteSubtask={onCompleteSubtask} onOpen={onOpen} onDelete={onDelete}
                />
              </div>
              {tasks.length > 1 && (
                <div className="flex items-center justify-between mt-2">
                  <button onClick={onFocusPrev} className="font-mono text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary/60 transition-all active:scale-95">
                    ← anterior
                  </button>
                  <button onClick={onFocusNext} className="font-mono text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary/60 transition-all active:scale-95">
                    pular →
                  </button>
                </div>
              )}
            </div>
          ) : (
            tasks.map((item) => (
              <CardWithCallbacks
                key={item.id} item={item} onComplete={onComplete} onDelegate={onDelegate} onPush={onPush}
                onMoveStatus={onMoveStatus} onStartPomodoro={onStartPomodoro} showPomodoro={showPomodoro}
                onCompleteSubtask={onCompleteSubtask} onOpen={onOpen} onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CardWithCallbacks({
  item, onComplete, onDelegate, onPush, onMoveStatus,
  onStartPomodoro, showPomodoro, onCompleteSubtask, onOpen, onDelete,
}: {
  item: UnifiedTask;
  onComplete: (item: UnifiedTask) => void;
  onDelegate: (item: UnifiedTask) => void;
  onPush: (item: UnifiedTask) => void;
  onMoveStatus: (item: UnifiedTask, status: string) => void;
  onStartPomodoro: (item: UnifiedTask) => void;
  showPomodoro: boolean;
  onCompleteSubtask: (subId: string) => void;
  onOpen: (item: UnifiedTask) => void;
  onDelete: (item: UnifiedTask) => void;
}) {
  return (
    <KanbanCard
      item={item}
      onComplete={() => onComplete(item)}
      onDelegate={() => item.tipo === "task" && onDelegate(item)}
      onPush={() => item.tipo === "task" && onPush(item)}
      onMoveStatus={(s) => item.tipo === "task" && onMoveStatus(item, s)}
      onStartPomodoro={() => onStartPomodoro(item)}
      showPomodoro={showPomodoro}
      onCompleteSubtask={onCompleteSubtask}
      onOpen={() => onOpen(item)}
      onDelete={() => onDelete(item)}
    />
  );
}
