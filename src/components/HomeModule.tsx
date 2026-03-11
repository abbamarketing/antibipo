import { EnergyState } from "@/lib/store";
import { Check, Home } from "lucide-react";
import { useState } from "react";

interface HomeModuleProps {
  energy: EnergyState;
}

const rooms = ["Cozinha", "Banheiro", "Sala", "Quarto"];

const basicTasks = [
  { label: "Lixo no saco", time: "1 min" },
  { label: "1 louça lavada — só 1", time: "2 min" },
];

const roomTasks: Record<string, string[]> = {
  Cozinha: ["Louça", "Limpar superfícies"],
  Banheiro: ["Vaso", "Pia", "Chão"],
  Sala: ["Varrer", "Organizar superfícies"],
  Quarto: ["Roupa no lugar", "Arrumar cama"],
};

export function HomeModule({ energy }: HomeModuleProps) {
  const [completedBasic, setCompletedBasic] = useState<Set<number>>(new Set());
  const [currentRoom, setCurrentRoom] = useState(0);
  const [completedRoomTasks, setCompletedRoomTasks] = useState<Set<string>>(new Set());
  const [roomDone, setRoomDone] = useState(false);
  const [wantMore, setWantMore] = useState<boolean | null>(null);

  if (energy === "basico") {
    return (
      <div className="space-y-4 animate-fade-in">
        <div>
          <h2 className="font-mono text-lg font-bold tracking-tight">Casa</h2>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            2 ações. 2 minutos.
          </p>
        </div>
        <div className="space-y-2">
          {basicTasks.map((task, i) => {
            const done = completedBasic.has(i);
            return (
              <button
                key={i}
                onClick={() => {
                  const next = new Set(completedBasic);
                  done ? next.delete(i) : next.add(i);
                  setCompletedBasic(next);
                }}
                className={`w-full text-left p-4 rounded-lg border transition-all ${done ? "bg-secondary/50 border-primary/20" : "bg-card"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${done ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                    {done && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{task.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{task.time}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {completedBasic.size === basicTasks.length && (
          <p className="text-sm text-primary font-mono text-center mt-4 animate-fade-in">
            Concluído.
          </p>
        )}
      </div>
    );
  }

  const room = rooms[currentRoom];
  const tasks = roomTasks[room] || [];

  if (energy === "modo_leve") {
    if (roomDone && wantMore === null) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="font-mono text-lg font-bold tracking-tight">Casa</h2>
            <p className="text-sm text-muted-foreground font-body mt-0.5">
              {room} concluído!
            </p>
          </div>
          <div className="bg-card rounded-lg border p-6 text-center space-y-4">
            <p className="text-sm font-body">Próximo cômodo?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setWantMore(true);
                  setCurrentRoom((currentRoom + 1) % rooms.length);
                  setCompletedRoomTasks(new Set());
                  setRoomDone(false);
                }}
                className="font-mono text-xs px-4 py-2 rounded-md bg-primary text-primary-foreground"
              >
                CONTINUAR
              </button>
              <button
                onClick={() => setWantMore(false)}
                className="font-mono text-xs px-4 py-2 rounded-md bg-secondary text-secondary-foreground"
              >
                PARAR
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (wantMore === false) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="font-mono text-lg font-bold tracking-tight">Casa</h2>
          </div>
          <p className="text-sm text-muted-foreground font-mono text-center">Casa — concluído por agora.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-fade-in">
        <div>
          <h2 className="font-mono text-lg font-bold tracking-tight">Casa</h2>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            1 cômodo até o fim: <span className="font-medium text-foreground">{room}</span>
          </p>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => {
            const done = completedRoomTasks.has(task);
            return (
              <button
                key={task}
                onClick={() => {
                  const next = new Set(completedRoomTasks);
                  done ? next.delete(task) : next.add(task);
                  setCompletedRoomTasks(next);
                  if (!done && next.size === tasks.length) {
                    setTimeout(() => setRoomDone(true), 500);
                  }
                }}
                className={`w-full text-left p-4 rounded-lg border transition-all ${done ? "bg-secondary/50 border-primary/20" : "bg-card"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${done ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                    {done && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{task}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Foco Total
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="font-mono text-lg font-bold tracking-tight">Casa</h2>
        <p className="text-sm text-muted-foreground font-body mt-0.5">
          Limpeza profunda disponível. Máximo 1h. Só comece se puder terminar.
        </p>
      </div>
      <div className="space-y-2">
        {["Limpeza profunda de 1 cômodo", "Organizar armário ou gaveta", "Lavar roupa completa", "Ir ao mercado"].map((item) => (
          <div key={item} className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Home className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{item}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
