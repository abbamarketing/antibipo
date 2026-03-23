import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Repeat, Sparkles } from "lucide-react";
import { URGENCIA_OPTIONS, MODULO_OPTIONS, RECURRENCE_OPTIONS } from "./task-form-constants";

interface DatePickerFieldProps {
  value?: Date;
  onChange: (d: Date | undefined) => void;
}

export function DatePickerField({ value, onChange }: DatePickerFieldProps) {
  return (
    <div>
      <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">DATA DE ENTREGA</label>
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(
            "w-full flex items-center gap-2 px-3 py-3 rounded-lg border text-xs font-mono text-left transition-all min-h-[48px]",
            value ? "text-foreground" : "text-muted-foreground"
          )}>
            <CalendarIcon className="w-4 h-4 shrink-0" />
            {value ? format(value, "dd 'de' MMM, yyyy", { locale: ptBR }) : "Selecionar data"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface RecurrenceToggleProps {
  recorrente: boolean;
  setRecorrente: (v: boolean) => void;
  frequencia: string;
  setFrequencia: (v: string) => void;
}

export function RecurrenceToggle({ recorrente, setRecorrente, frequencia, setFrequencia }: RecurrenceToggleProps) {
  return (
    <div>
      <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">RECORRÊNCIA</label>
      <button
        onClick={() => setRecorrente(!recorrente)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-3 rounded-lg border text-xs font-mono transition-all min-h-[48px]",
          recorrente ? "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300" : "text-muted-foreground"
        )}
      >
        <Repeat className="w-4 h-4 shrink-0" />
        {recorrente ? "Tarefa recorrente" : "Tarefa única"}
      </button>
      {recorrente && (
        <div className="flex gap-1.5 mt-2">
          {RECURRENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFrequencia(opt.value)}
              className={cn(
                "flex-1 px-2 py-2 rounded-lg text-[10px] font-mono transition-all border min-h-[40px]",
                frequencia === opt.value
                  ? "bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300"
                  : "bg-secondary text-muted-foreground border-transparent"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface UrgenciaSelectorProps {
  value: number;
  onChange: (v: number) => void;
  showEnergyHint?: boolean;
}

export function UrgenciaSelector({ value, onChange, showEnergyHint }: UrgenciaSelectorProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="font-mono text-[10px] text-muted-foreground tracking-wider">URGÊNCIA</label>
        {showEnergyHint && (
          <span className="inline-flex items-center gap-1 text-[8px] font-mono text-primary/70">
            <Sparkles className="w-2.5 h-2.5" />
            ajustada pela energia
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {URGENCIA_OPTIONS.map((opt) => {
          const UIcon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] font-mono transition-all border min-h-[44px]",
                value === opt.value ? opt.activeColor : "bg-secondary text-muted-foreground border-transparent"
              )}
            >
              <UIcon className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ModuloSelectorProps {
  value: string;
  onChange: (v: "trabalho" | "casa" | "saude") => void;
}

export function ModuloSelector({ value, onChange }: ModuloSelectorProps) {
  return (
    <div>
      <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">MÓDULO</label>
      <div className="flex gap-2">
        {MODULO_OPTIONS.map((opt) => {
          const MIcon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] font-mono transition-all border min-h-[44px]",
                value === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-transparent"
              )}
            >
              <MIcon className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
