import { useState } from "react";
import { useMetasStore, prazoLabel, MetaPessoal } from "@/lib/metas-store";
import { Target, Plus, ChevronRight, X, TrendingUp, Calendar, Check, Pencil } from "lucide-react";
import { format, differenceInDays, addMonths, addYears } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MetasModule() {
  const store = useMetasStore();
  const [showSetup, setShowSetup] = useState(!store.hasAllTimeframes && !store.isLoading);
  const [addingPrazo, setAddingPrazo] = useState<"curto" | "medio" | "longo" | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [progressMeta, setProgressMeta] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("");
  const [progressValue, setProgressValue] = useState(0);

  const handleAddMeta = () => {
    if (!titulo.trim() || !addingPrazo) return;
    const now = new Date();
    const dataAlvo = addingPrazo === "curto"
      ? addMonths(now, 1)
      : addingPrazo === "medio"
      ? addMonths(now, 6)
      : addYears(now, 1);

    store.addMeta({
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      prazo: addingPrazo,
      data_alvo: format(dataAlvo, "yyyy-MM-dd"),
    });
    setTitulo("");
    setDescricao("");
    setAddingPrazo(null);
  };

  const handleSaveProgress = (metaId: string) => {
    if (!progressNote.trim()) return;
    store.addProgressNote({ id: metaId, texto: progressNote.trim(), progresso: progressValue });
    setProgressMeta(null);
    setProgressNote("");
    setProgressValue(0);
  };

  const prazoConfig: Record<string, { color: string; bgColor: string; emoji: string }> = {
    longo: { color: "text-purple-500", bgColor: "bg-purple-500/10", emoji: "🎯" },
    medio: { color: "text-blue-500", bgColor: "bg-blue-500/10", emoji: "📍" },
    curto: { color: "text-green-500", bgColor: "bg-green-500/10", emoji: "⚡" },
  };

  const renderMeta = (meta: MetaPessoal) => {
    const config = prazoConfig[meta.prazo];
    const diasRestantes = differenceInDays(new Date(meta.data_alvo), new Date());
    const diasTotais = differenceInDays(new Date(meta.data_alvo), new Date(meta.data_inicio));
    const tempoDecorrido = diasTotais > 0 ? Math.round(((diasTotais - diasRestantes) / diasTotais) * 100) : 0;
    const lastNote = meta.notas_progresso?.length > 0 ? meta.notas_progresso[meta.notas_progresso.length - 1] : null;

    return (
      <div key={meta.id} className="bg-card rounded-xl border p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span>{config.emoji}</span>
              <span className={`font-mono text-[10px] ${config.color}`}>
                {prazoLabel[meta.prazo].toUpperCase()}
              </span>
            </div>
            <h4 className="text-sm font-medium mt-1">{meta.titulo}</h4>
            {meta.descricao && (
              <p className="text-xs text-muted-foreground mt-0.5">{meta.descricao}</p>
            )}
          </div>
          <button
            onClick={() => {
              setProgressMeta(meta.id);
              setProgressValue(meta.progresso);
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-muted-foreground">Progresso</span>
            <span className={`font-mono text-[10px] font-bold ${config.color}`}>{meta.progresso}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                meta.prazo === "longo" ? "bg-purple-500" : meta.prazo === "medio" ? "bg-blue-500" : "bg-green-500"
              }`}
              style={{ width: `${meta.progresso}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {diasRestantes > 0 ? `${diasRestantes} dias restantes` : "Prazo encerrado"}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {tempoDecorrido}% do tempo
            </span>
          </div>
        </div>

        {/* Last note */}
        {lastNote && (
          <div className="bg-secondary/50 rounded-lg p-2.5">
            <p className="text-[11px] text-muted-foreground font-body">{lastNote.texto}</p>
            <span className="text-[9px] font-mono text-muted-foreground/60 mt-1 block">
              {format(new Date(lastNote.data), "dd/MM", { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Progress update form */}
        {progressMeta === meta.id && (
          <div className="space-y-3 animate-fade-in border-t pt-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground w-8">{progressValue}%</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressValue}
                onChange={(e) => setProgressValue(Number(e.target.value))}
                className="flex-1 accent-primary h-1.5"
              />
            </div>
            <input
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              placeholder="O que avançou? Como está se sentindo?"
              className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => e.key === "Enter" && handleSaveProgress(meta.id)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setProgressMeta(null)}
                className="flex-1 py-2 rounded-md border font-mono text-xs hover:bg-secondary"
              >
                CANCELAR
              </button>
              <button
                onClick={() => handleSaveProgress(meta.id)}
                disabled={!progressNote.trim()}
                className="flex-1 py-2 rounded-md bg-primary text-primary-foreground font-mono text-xs hover:opacity-90 disabled:opacity-40"
              >
                SALVAR
              </button>
            </div>
            {meta.progresso >= 100 && (
              <button
                onClick={() => store.updateMeta({ id: meta.id, status: "concluida" })}
                className="w-full py-2 rounded-md bg-green-500/10 text-green-500 font-mono text-xs border border-green-500/20 hover:bg-green-500/20"
              >
                <Check className="w-3 h-3 inline mr-1" /> MARCAR COMO CONCLUÍDA
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const sections: { prazo: "longo" | "medio" | "curto"; metas: MetaPessoal[] }[] = [
    { prazo: "longo", metas: store.metasLongo },
    { prazo: "medio", metas: store.metasMedio },
    { prazo: "curto", metas: store.metasCurto },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-mono text-lg font-bold tracking-tight flex items-center gap-2">
          <Target className="w-5 h-5" /> Metas
        </h2>
        <p className="text-sm text-muted-foreground font-body mt-0.5">
          Seus objetivos de curto, médio e longo prazo.
        </p>
      </div>

      {/* Goal sections */}
      {sections.map(({ prazo, metas: sectionMetas }) => {
        const config = prazoConfig[prazo];
        return (
          <div key={prazo} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className={`font-mono text-xs tracking-widest uppercase flex items-center gap-2 ${config.color}`}>
                {config.emoji} {prazoLabel[prazo]}
              </h3>
              <button
                onClick={() => setAddingPrazo(prazo)}
                className="text-primary hover:opacity-80 transition-opacity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {sectionMetas.length > 0
              ? sectionMetas.map(renderMeta)
              : addingPrazo !== prazo && (
                  <button
                    onClick={() => setAddingPrazo(prazo)}
                    className={`w-full p-4 rounded-xl border border-dashed text-center hover:border-primary/30 transition-all ${config.bgColor}`}
                  >
                    <p className="text-xs text-muted-foreground font-body">
                      Defina sua meta de {prazoLabel[prazo]}
                    </p>
                  </button>
                )}

            {addingPrazo === prazo && (
              <div className="bg-card rounded-xl border p-4 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold">Nova meta — {prazoLabel[prazo]}</span>
                  <button onClick={() => setAddingPrazo(null)} className="text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Qual é a meta?"
                  className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes opcionais..."
                  className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleAddMeta}
                  disabled={!titulo.trim()}
                  className="w-full py-2 rounded-md bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90 disabled:opacity-40"
                >
                  DEFINIR META
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Completed goals */}
      {store.metas.filter((m) => m.status === "concluida").length > 0 && (
        <div className="space-y-2">
          <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Concluídas ({store.metas.filter((m) => m.status === "concluida").length})
          </h3>
          {store.metas
            .filter((m) => m.status === "concluida")
            .slice(0, 3)
            .map((m) => (
              <div key={m.id} className="bg-card/50 rounded-xl border border-dashed p-3 flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-sm text-muted-foreground line-through flex-1">{m.titulo}</span>
                <span className="font-mono text-[9px] text-muted-foreground">{prazoLabel[m.prazo]}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
