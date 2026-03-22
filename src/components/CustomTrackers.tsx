import { useState } from "react";
import { useTrackerStore, type CustomTracker } from "@/lib/tracker-store";
import {
  isRecorrenteDue,
  diasRestantes,
  diasParaAlerta,
  type RecorrenteConfig,
  type ChecklistConfig,
  type MetaConfig,
  type AlertaConfig,
} from "@/lib/tracker-blueprints";
import { Check, Clock, Target, Bell, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { logActivity } from "@/lib/activity-log";
import { supabase } from "@/integrations/supabase/client";

interface CustomTrackersProps {
  modulo: string;
  secao?: string;
}

export function CustomTrackers({ modulo, secao }: CustomTrackersProps) {
  const { getTrackersByModulo, getTodayRegistros, getLastCompletion, completeTracker } = useTrackerStore();
  const [expanded, setExpanded] = useState(true);

  let trackers = getTrackersByModulo(modulo);
  if (secao) trackers = trackers.filter((t) => t.secao === secao);

  if (trackers.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-6 text-center">
        <Target className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground font-body">Nenhum tracker criado ainda.</p>
        <p className="text-xs text-muted-foreground/60 font-body mt-1">Crie um para acompanhar seus hábitos.</p>
      </div>
    );
  }

  // Group by secao
  const grouped = trackers.reduce<Record<string, CustomTracker[]>>((acc, t) => {
    const key = t.secao || "geral";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([secaoName, items]) => (
        <div key={secaoName} className="space-y-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 w-full"
          >
            <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              {secaoName}
            </h3>
            {expanded ? (
              <ChevronUp className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
          {expanded && items.map((tracker) => (
            <TrackerCard
              key={tracker.id}
              tracker={tracker}
              todayRegistros={getTodayRegistros(tracker.id)}
              lastCompletion={getLastCompletion(tracker.id)}
              onComplete={async (dados) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                completeTracker({ tracker_id: tracker.id, user_id: user.id, dados });
                logActivity("tracker_concluido", { tracker: tracker.titulo, tipo: tracker.tipo });
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface TrackerCardProps {
  tracker: CustomTracker;
  todayRegistros: any[];
  lastCompletion?: string;
  onComplete: (dados?: Record<string, any>) => void;
}

function TrackerCard({ tracker, todayRegistros, lastCompletion, onComplete }: TrackerCardProps) {
  switch (tracker.tipo) {
    case "recorrente":
      return <RecorrenteCard tracker={tracker} lastCompletion={lastCompletion} onComplete={onComplete} />;
    case "checklist":
      return <ChecklistCard tracker={tracker} todayRegistros={todayRegistros} onComplete={onComplete} />;
    case "meta":
      return <MetaCard tracker={tracker} onComplete={onComplete} />;
    case "alerta":
      return <AlertaCard tracker={tracker} lastCompletion={lastCompletion} onComplete={onComplete} />;
    default:
      return null;
  }
}

function RecorrenteCard({ tracker, lastCompletion, onComplete }: { tracker: CustomTracker; lastCompletion?: string; onComplete: (d?: any) => void }) {
  const config = tracker.config as unknown as RecorrenteConfig;
  const isDue = isRecorrenteDue(config, lastCompletion);
  const remaining = diasRestantes(config, lastCompletion);

  return (
    <div className={`bg-card rounded-lg border p-4 transition-all ${isDue ? "border-primary/30" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${isDue ? "text-primary" : "text-muted-foreground"}`} />
          <div>
            <span className="text-sm font-medium">{tracker.titulo}</span>
            <span className="text-[10px] text-muted-foreground ml-2">
              a cada {config.frequencia_dias}d
            </span>
          </div>
        </div>
        {isDue ? (
          <button
            onClick={() => onComplete()}
            className="font-mono text-xs px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all"
          >
            FEITO
          </button>
        ) : (
          <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {remaining}d
          </span>
        )}
      </div>
    </div>
  );
}

function ChecklistCard({ tracker, todayRegistros, onComplete }: { tracker: CustomTracker; todayRegistros: any[]; onComplete: (d?: any) => void }) {
  const config = tracker.config as unknown as ChecklistConfig;
  const completedIds = new Set(todayRegistros.map((r) => r.dados?.item_id).filter(Boolean));

  const handleItem = (itemId: string) => {
    if (completedIds.has(itemId)) return;
    onComplete({ item_id: itemId });
  };

  const allDone = config.itens.every((item) => completedIds.has(item.id));

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Check className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">{tracker.titulo}</span>
      </div>
      <div className="flex gap-2">
        {config.itens.map((item) => {
          const done = completedIds.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleItem(item.id)}
              disabled={done}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-mono text-xs transition-all ${
                done
                  ? "bg-secondary text-foreground/50 cursor-default"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {done && <Check className="w-3 h-3" />}
              {done ? "FEITO" : item.label.toUpperCase()}
            </button>
          );
        })}
      </div>
      {allDone && (
        <p className="text-center text-[10px] text-muted-foreground mt-2 font-mono">
          {tracker.titulo} completo hoje ✓
        </p>
      )}
    </div>
  );
}

function MetaCard({ tracker, onComplete }: { tracker: CustomTracker; onComplete: (d?: any) => void }) {
  const config = tracker.config as unknown as MetaConfig;
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState(1);
  const pct = Math.min(100, Math.round((config.atual / config.alvo) * 100));

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{tracker.titulo}</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {config.atual}/{config.alvo} {config.unidade}
        </span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2 mb-2">
        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      {adding ? (
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            min={1}
            className="flex-1 bg-background border rounded-md p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={() => {
              onComplete({ incremento: value });
              setAdding(false);
            }}
            className="font-mono text-xs px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            +{value}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full font-mono text-xs py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-all"
        >
          REGISTRAR PROGRESSO
        </button>
      )}
    </div>
  );
}

function AlertaCard({ tracker, lastCompletion, onComplete }: { tracker: CustomTracker; lastCompletion?: string; onComplete: (d?: any) => void }) {
  const config = tracker.config as unknown as AlertaConfig;
  const dias = diasParaAlerta(config);
  const isUrgent = dias <= config.lembrete_dias_antes;
  const isPast = dias <= 0;

  return (
    <div className={`bg-card rounded-lg border p-4 transition-all ${isUrgent ? "border-destructive/30" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className={`w-3.5 h-3.5 ${isUrgent ? "text-destructive" : "text-muted-foreground"}`} />
          <div>
            <span className="text-sm font-medium">{tracker.titulo}</span>
            <span className={`text-[10px] ml-2 ${isPast ? "text-destructive" : "text-muted-foreground"}`}>
              {isPast ? "ATRASADO" : `em ${dias}d`}
            </span>
          </div>
        </div>
        <button
          onClick={() => onComplete()}
          className="font-mono text-xs px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all"
        >
          CONCLUÍDO
        </button>
      </div>
    </div>
  );
}
