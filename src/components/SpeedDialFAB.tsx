import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Plus, X, ArrowDownLeft, ArrowUpRight,
  ClipboardList, CalendarPlus,
} from "lucide-react";

export type SpeedDialAction = "tarefa" | "entrada" | "saida" | "evento";

interface SpeedDialFABProps {
  onAction: (action: SpeedDialAction) => void;
}

const ACTIONS: { key: SpeedDialAction; label: string; icon: typeof Plus; color: string }[] = [
  { key: "tarefa", label: "Tarefa", icon: ClipboardList, color: "bg-blue-500/90 text-white" },
  { key: "entrada", label: "Entrada", icon: ArrowDownLeft, color: "bg-green-500/90 text-white" },
  { key: "saida", label: "Saída", icon: ArrowUpRight, color: "bg-red-500/90 text-white" },
  { key: "evento", label: "Evento", icon: CalendarPlus, color: "bg-purple-500/90 text-white" },
  { key: "meta", label: "Rep. Meta", icon: Target, color: "bg-amber-500/90 text-white" },
];

export function SpeedDialFAB({ onAction }: SpeedDialFABProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = (action: SpeedDialAction) => {
    setOpen(false);
    onAction(action);
  };

  const bottomPosition = isMobile ? "bottom-[4.5rem]" : "bottom-6";

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      <div ref={menuRef} className={`fixed ${bottomPosition} right-5 z-50`}>
        {/* Action items */}
        {open && (
          <div className="flex flex-col-reverse items-end gap-3 mb-3 animate-fade-in">
            {ACTIONS.map((a, i) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  onClick={() => handleSelect(a.key)}
                  className={`flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-full shadow-lg 
                    ${a.color} min-h-[44px]
                    hover:scale-105 active:scale-95 transition-all duration-200`}
                  style={{
                    animationDelay: `${i * 40}ms`,
                    animation: "slideUp 200ms ease-out both",
                  }}
                >
                  <span className="font-mono text-xs font-medium tracking-wider whitespace-nowrap">
                    {a.label}
                  </span>
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        )}

        {/* FAB button */}
        <button
          onClick={() => setOpen(!open)}
          className={`w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 
            flex items-center justify-center hover:opacity-90 active:scale-90 
            transition-all duration-200 ${open ? "rotate-45" : ""}`}
        >
          <Plus className="w-6 h-6 transition-transform duration-200" />
        </button>
      </div>
    </>
  );
}
