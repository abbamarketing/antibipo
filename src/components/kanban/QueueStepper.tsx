import { useState } from "react";
import type { UnifiedTask } from "./kanban-types";

interface QueueStepperProps {
  total: number;
  current: number;
  tasks: UnifiedTask[];
  onPeek: (idx: number) => void;
}

export function QueueStepper({ total, current, tasks, onPeek }: QueueStepperProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (total <= 1) return null;

  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex items-center gap-1.5 relative">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === current
                ? "bg-primary scale-125"
                : i < current
                ? "bg-primary/30"
                : "bg-muted-foreground/20"
            }`}
            onMouseEnter={() => { setHoveredIdx(i); onPeek(i); }}
            onMouseLeave={() => setHoveredIdx(null)}
            aria-label={`Tarefa ${i + 1}: ${tasks[i]?.titulo}`}
          />
        ))}
        {hoveredIdx !== null && hoveredIdx !== current && tasks[hoveredIdx] && (
          <div className="absolute left-0 -top-8 bg-card border border-border/60 rounded-lg px-2.5 py-1 shadow-md z-20 whitespace-nowrap animate-fade-in pointer-events-none">
            <span className="font-mono text-[9px] text-muted-foreground">{tasks[hoveredIdx].titulo}</span>
          </div>
        )}
      </div>
      <span className="font-mono text-[10px] text-muted-foreground/60">
        {current + 1} de {total}
      </span>
    </div>
  );
}
