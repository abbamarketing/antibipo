import { EnergyState, Task } from "@/lib/store";
import { TaskCard } from "./TaskCard";
import { Inbox } from "lucide-react";

interface WorkModuleProps {
  energy: EnergyState;
  tasks: Task[];
  allTasks: Task[];
  onComplete: (id: string) => void;
  onDelegate: (id: string) => void;
  onPush: (id: string) => void;
}

const energyMessages: Record<EnergyState, string> = {
  foco_total: "Até 3 tarefas estratégicas.",
  modo_leve: "1 tarefa por vez.",
  basico: "1 tarefa — a que trava alguém.",
};

export function WorkModule({ energy, tasks, allTasks, onComplete, onDelegate, onPush }: WorkModuleProps) {
  const backlogCount = allTasks.filter((t) => t.modulo === "trabalho" && t.status !== "feito" && t.status !== "descartado").length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold tracking-tight">Trabalho</h2>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            {energyMessages[energy]}
          </p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {backlogCount} no backlog
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-card rounded-lg border p-8 text-center">
          <Inbox className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground font-body">
            Nenhuma tarefa para este estado. Use + para adicionar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={onComplete}
              onDelegate={onDelegate}
              onPush={onPush}
            />
          ))}
        </div>
      )}
    </div>
  );
}
