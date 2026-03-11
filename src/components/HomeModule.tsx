import { useState } from "react";
import { useCasaStore } from "@/lib/casa-store";
import { EnergyState } from "@/lib/store";
import { logActivity } from "@/lib/activity-log";
import { brasiliaTimeString } from "@/lib/brasilia";
import { WeeklyTaskView } from "@/components/casa/WeeklyTaskView";
import {
  Home,
  Check,
  Plus,
  ShoppingCart,
  Clock,
  Trash2,
  X,
  History,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HomeModuleProps {
  energy: EnergyState;
}

const frequenciaLabel: Record<string, string> = {
  diario: "Diário",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};

export function HomeModule({ energy }: HomeModuleProps) {
  const casa = useCasaStore();
  const [activeTab, setActiveTab] = useState<"tarefas" | "compras">("tarefas");
  const [selectedComodo, setSelectedComodo] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newTaskComodo, setNewTaskComodo] = useState("");
  const [newTaskNome, setNewTaskNome] = useState("");
  const [newTaskFreq, setNewTaskFreq] = useState("semanal");
  const [newTaskTempo, setNewTaskTempo] = useState(10);
  const [newItemNome, setNewItemNome] = useState("");
  const [newItemQtd, setNewItemQtd] = useState("");
  const [newItemCat, setNewItemCat] = useState("mercado");

  const handleCompletarTarefa = (t: typeof casa.tarefas[0]) => {
    casa.completarTarefa({
      tarefa_casa_id: t.id,
      comodo: t.comodo,
      tarefa: t.tarefa,
    });
    logActivity("tarefa_casa_concluida", {
      comodo: t.comodo,
      tarefa: t.tarefa,
      hora: brasiliaTimeString(),
    });
  };

  const handleAddTask = () => {
    if (!newTaskNome.trim() || !newTaskComodo.trim()) return;
    casa.addTarefa({
      comodo: newTaskComodo.trim(),
      tarefa: newTaskNome.trim(),
      frequencia: newTaskFreq,
      tempo_min: newTaskTempo,
    });
    setNewTaskNome("");
    setNewTaskComodo("");
    setShowAddTask(false);
  };

  const handleAddItem = () => {
    if (!newItemNome.trim()) return;
    casa.addItemCompra({
      item: newItemNome.trim(),
      quantidade: newItemQtd.trim() || undefined,
      categoria: newItemCat,
    });
    logActivity("item_compra_adicionado", {
      item: newItemNome.trim(),
      hora: brasiliaTimeString(),
    });
    setNewItemNome("");
    setNewItemQtd("");
    setShowAddItem(false);
  };

  const pendentes = casa.listaCompras.filter((i) => !i.comprado);
  const comprados = casa.listaCompras.filter((i) => i.comprado);

  // Determine tasks to show based on energy
  const getVisibleComodos = () => {
    if (energy === "basico") return casa.comodos.slice(0, 1);
    if (energy === "modo_leve") return selectedComodo ? [selectedComodo] : casa.comodos.slice(0, 2);
    return casa.comodos;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-mono text-lg font-bold tracking-tight">Casa</h2>
        <p className="text-sm text-muted-foreground font-body mt-0.5">
          {energy === "basico"
            ? "Só o essencial — 1 cômodo."
            : energy === "modo_leve"
            ? "Rotina regular — tarefas do dia."
            : "Visão completa — todos os cômodos e compras."}
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1">
        {(["tarefas", "compras"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md font-mono text-xs font-medium tracking-wider transition-all ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "tarefas" ? <Home className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            {tab === "tarefas" ? "TAREFAS" : `COMPRAS${pendentes.length > 0 ? ` (${pendentes.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* TAREFAS TAB */}
      {activeTab === "tarefas" && (
        <div className="space-y-4">
          {/* Room selector for modo_leve */}
          {energy === "modo_leve" && casa.comodos.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {casa.comodos.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedComodo(selectedComodo === c ? null : c)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                    selectedComodo === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {getVisibleComodos().map((comodo) => {
            const tarefas = casa.tarefasPorComodo(comodo);
            return (
              <div key={comodo} className="space-y-2">
                <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                  {comodo}
                </h3>
                {tarefas.map((t) => {
                  const ultima = casa.getUltimaLimpeza(t.id);
                  const tempoDesdeUltima = ultima
                    ? formatDistanceToNow(new Date(ultima.feito_em), { locale: ptBR, addSuffix: true })
                    : null;

                  return (
                    <div
                      key={t.id}
                      className="bg-card rounded-lg border p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{t.tarefa}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {frequenciaLabel[t.frequencia] || t.frequencia}
                          </span>
                          {t.tempo_min && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Clock className="w-2.5 h-2.5" />
                                {t.tempo_min}min
                              </span>
                            </>
                          )}
                          {tempoDesdeUltima && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <History className="w-2.5 h-2.5" />
                                {tempoDesdeUltima}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCompletarTarefa(t)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-mono text-[10px] hover:opacity-90 transition-opacity"
                      >
                        <Check className="w-3 h-3" /> FEITO
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Add task button */}
          {energy === "foco_total" && (
            <>
              {!showAddTask ? (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="w-full p-2 border border-dashed rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                >
                  + NOVA TAREFA DOMÉSTICA
                </button>
              ) : (
                <div className="bg-card rounded-lg border p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold">Nova tarefa</span>
                    <button onClick={() => setShowAddTask(false)} className="text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    value={newTaskNome}
                    onChange={(e) => setNewTaskNome(e.target.value)}
                    placeholder="Nome da tarefa"
                    className="w-full bg-background border rounded-md p-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <input
                      value={newTaskComodo}
                      onChange={(e) => setNewTaskComodo(e.target.value)}
                      placeholder="Cômodo"
                      list="comodos-list"
                      className="flex-1 bg-background border rounded-md p-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <datalist id="comodos-list">
                      {casa.comodos.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                    <select
                      value={newTaskFreq}
                      onChange={(e) => setNewTaskFreq(e.target.value)}
                      className="bg-background border rounded-md p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="diario">Diário</option>
                      <option value="semanal">Semanal</option>
                      <option value="quinzenal">Quinzenal</option>
                      <option value="mensal">Mensal</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddTask}
                    disabled={!newTaskNome.trim() || !newTaskComodo.trim()}
                    className="w-full py-2 rounded-md bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90 disabled:opacity-40"
                  >
                    ADICIONAR
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* COMPRAS TAB */}
      {activeTab === "compras" && (
        <div className="space-y-3">
          {/* Add item */}
          {!showAddItem ? (
            <button
              onClick={() => setShowAddItem(true)}
              className="w-full p-3 border border-dashed rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> ADICIONAR ITEM
            </button>
          ) : (
            <div className="bg-card rounded-lg border p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold">Novo item</span>
                <button onClick={() => setShowAddItem(false)} className="text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={newItemNome}
                  onChange={(e) => setNewItemNome(e.target.value)}
                  placeholder="Item"
                  className="flex-1 bg-background border rounded-md p-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                />
                <input
                  value={newItemQtd}
                  onChange={(e) => setNewItemQtd(e.target.value)}
                  placeholder="Qtd"
                  className="w-16 bg-background border rounded-md p-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-1.5">
                {["mercado", "farmacia", "casa", "outro"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewItemCat(c)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all ${
                      newItemCat === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddItem}
                disabled={!newItemNome.trim()}
                className="w-full py-2 rounded-md bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90 disabled:opacity-40"
              >
                ADICIONAR
              </button>
            </div>
          )}

          {/* Pending items */}
          {pendentes.length > 0 && (
            <div className="space-y-1.5">
              {pendentes.map((item) => (
                <div key={item.id} className="bg-card rounded-lg border p-3 flex items-center gap-3">
                  <button
                    onClick={() => casa.toggleComprado({ id: item.id, comprado: true })}
                    className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{item.item}</span>
                    {item.quantidade && (
                      <span className="text-xs text-muted-foreground ml-2">{item.quantidade}</span>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground uppercase">
                    {item.categoria}
                  </span>
                  <button
                    onClick={() => casa.removeItemCompra(item.id)}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bought items */}
          {comprados.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                Comprados ({comprados.length})
              </h4>
              {comprados.slice(0, 5).map((item) => (
                <div key={item.id} className="bg-card/50 rounded-lg border border-dashed p-3 flex items-center gap-3">
                  <button
                    onClick={() => casa.toggleComprado({ id: item.id, comprado: false })}
                    className="w-5 h-5 rounded-full bg-primary border-primary flex items-center justify-center shrink-0"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </button>
                  <span className="text-sm text-muted-foreground line-through flex-1">{item.item}</span>
                  <button
                    onClick={() => casa.removeItemCompra(item.id)}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendentes.length === 0 && comprados.length === 0 && (
            <div className="bg-card rounded-lg border p-6 text-center">
              <ShoppingCart className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground font-body">Lista vazia. Adicione itens acima.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
