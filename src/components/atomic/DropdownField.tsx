import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownFieldProps {
  label: string;
  options: string[];
  value?: string;
  onChange: (v: string) => void;
}

export function DropdownField({ label, options, value, onChange }: DropdownFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">{label}</label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-3 rounded-lg border text-xs font-mono text-left transition-all min-h-[48px]",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {value || `Selecionar ${label.toLowerCase()}`}
          <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0", isOpen && "rotate-180")} />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto animate-fade-in">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-3 text-xs font-mono hover:bg-secondary transition-colors min-h-[44px]",
                  value === opt && "bg-primary/10 text-primary"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
