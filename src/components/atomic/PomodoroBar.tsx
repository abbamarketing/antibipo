import { Timer, Play, Pause, RotateCcw, X } from "lucide-react";

interface PomodoroBarProps {
  taskTitle: string;
  time: number;
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
  onClose: () => void;
}

export function PomodoroBar({ taskTitle, time, running, onToggle, onReset, onClose }: PomodoroBarProps) {
  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="bg-card rounded-lg border p-3 space-y-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium truncate max-w-[200px]">{taskTitle}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-secondary rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${((25 * 60 - time) / (25 * 60)) * 100}%` }}
          />
        </div>
        <span className="font-mono text-lg font-bold tabular-nums w-16 text-right">{formatTime(time)}</span>
        <div className="flex gap-1">
          <button onClick={onToggle} className="p-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90">
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onReset} className="p-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
