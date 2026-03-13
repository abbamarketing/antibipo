import { useState } from "react";
import { ChevronDown, UserPlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientFieldEnhancedProps {
  clients: { id: string; nome: string }[];
  value?: string;
  onChange: (nome: string, id?: string) => void;
  label?: string;
  showNewClient: boolean;
  setShowNewClient: (v: boolean) => void;
  newClientName: string;
  setNewClientName: (v: string) => void;
  onAddClient: () => void;
  savingClient: boolean;
}

export function ClientFieldEnhanced({
  clients, value, onChange, label = "CLIENTE",
  showNewClient, setShowNewClient, newClientName, setNewClientName,
  onAddClient, savingClient,
}: ClientFieldEnhancedProps) {
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
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto animate-fade-in">
            {clients.length === 0 && !showNewClient && (
              <p className="px-3 py-3 text-[10px] text-muted-foreground font-mono">Nenhum cliente cadastrado</p>
            )}
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => { onChange(c.nome, c.id); setIsOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-3 text-xs font-mono hover:bg-secondary transition-colors min-h-[44px]",
                  value === c.nome && "bg-primary/10 text-primary"
                )}
              >
                {c.nome}
              </button>
            ))}
            {!showNewClient ? (
              <button
                onClick={() => setShowNewClient(true)}
                className="w-full flex items-center gap-2 px-3 py-3 text-xs font-mono text-primary hover:bg-primary/5 transition-colors border-t min-h-[44px]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Adicionar novo cliente
              </button>
            ) : (
              <div className="p-2 border-t space-y-2">
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
                  style={{ fontSize: "16px" }}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && onAddClient()}
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={onAddClient}
                    disabled={!newClientName.trim() || savingClient}
                    className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-[10px] font-mono disabled:opacity-40 min-h-[40px]"
                  >
                    {savingClient ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Adicionar"}
                  </button>
                  <button
                    onClick={() => { setShowNewClient(false); setNewClientName(""); }}
                    className="px-3 py-2 rounded-lg bg-secondary text-muted-foreground text-[10px] font-mono min-h-[40px]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
