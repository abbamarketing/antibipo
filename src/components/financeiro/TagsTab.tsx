import { useState } from "react";
import { Search, Pencil, Plus, X, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { FcTag, LancamentoTag, Lancamento } from "@/lib/financial-store";

interface TagsTabProps {
  tags: FcTag[];
  lancamentoTags: LancamentoTag[];
  lancamentos: Lancamento[];
  onCreateTag: (t: { nome: string; emoji?: string; cor?: string }) => void;
  onUpdateTag: (t: { id: string; nome?: string; emoji?: string; cor?: string }) => void;
  onDeleteTag: (id: string) => void;
}

const presetColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#e5e7eb"];

export function TagsTab({ tags, lancamentoTags, lancamentos, onCreateTag, onUpdateTag, onDeleteTag }: TagsTabProps) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FcTag | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [cor, setCor] = useState("#e5e7eb");

  const tagTotals = new Map<string, number>();
  lancamentoTags.forEach((lt) => {
    tagTotals.set(lt.tag_id, (tagTotals.get(lt.tag_id) || 0) + (lt.valor || 0));
  });

  const filtered = tags.filter((t) => t.nome.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setName(""); setEmoji(""); setCor("#e5e7eb");
    setCreating(true); setEditing(null);
  };

  const openEdit = (tag: FcTag) => {
    setName(tag.nome); setEmoji(tag.emoji || ""); setCor(tag.cor);
    setEditing(tag); setCreating(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) {
      onUpdateTag({ id: editing.id, nome: name.trim(), emoji: emoji || undefined, cor });
    } else {
      onCreateTag({ nome: name.trim(), emoji: emoji || undefined, cor });
    }
    setCreating(false); setEditing(null);
  };

  const handleDelete = () => {
    if (!editing) return;
    const hasLancs = lancamentoTags.some((lt) => lt.tag_id === editing.id);
    if (hasLancs) return; // Can't delete if has lancamentos
    onDeleteTag(editing.id);
    setEditing(null);
  };

  const showModal = creating || editing;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tag..."
            className="w-full pl-8 pr-3 py-2 bg-background border rounded-md text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button onClick={openCreate} className="p-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Nenhuma tag cadastrada.
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              onClick={() => openEdit(tag)}
              className="w-full flex items-center justify-between bg-card rounded-lg border p-3 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.cor }} />
                <span className="text-sm font-body">
                  {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
                  {tag.nome}
                </span>
              </div>
              <span className="font-mono text-xs font-medium">
                {formatCurrency(tagTotals.get(tag.id) || 0)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => { setCreating(false); setEditing(null); }} />
          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card rounded-lg border shadow-lg p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono text-sm font-semibold tracking-wider">
                {editing ? "EDITAR TAG" : "NOVA TAG"}
              </h3>
              <button onClick={() => { setCreating(false); setEditing(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da tag"
              className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary mb-3"
            />

            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
              placeholder="Ícone (opcional)"
              className="w-full bg-background border rounded-md p-2.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary mb-3"
            />

            <div className="flex gap-2 mb-4">
              {presetColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setCor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${cor === c ? "ring-2 ring-primary scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="flex-1 py-2.5 rounded-md bg-primary text-primary-foreground font-mono text-xs tracking-wider hover:opacity-90 disabled:opacity-40"
              >
                SALVAR
              </button>
              {editing && !lancamentoTags.some((lt) => lt.tag_id === editing.id) && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2.5 rounded-md bg-destructive text-destructive-foreground font-mono text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
