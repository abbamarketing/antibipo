import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Building2, FileText, Plus, Trash2, Eye, EyeOff, X, ChevronDown, ChevronUp } from "lucide-react";

type DocTipo = "cartao_credito" | "cnpj" | "documento" | "outro";

interface CarteiraDoc {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  dados: Record<string, string>;
  notas: string | null;
  created_at: string;
}

const tipoConfig: Record<DocTipo, { icon: typeof CreditCard; label: string; fields: { key: string; label: string; sensitive?: boolean }[] }> = {
  cartao_credito: {
    icon: CreditCard,
    label: "Cartao de Credito",
    fields: [
      { key: "bandeira", label: "Bandeira" },
      { key: "final", label: "Final" },
      { key: "titular", label: "Titular" },
      { key: "validade", label: "Validade" },
      { key: "limite", label: "Limite" },
      { key: "banco", label: "Banco" },
    ],
  },
  cnpj: {
    icon: Building2,
    label: "CNPJ",
    fields: [
      { key: "cnpj", label: "CNPJ" },
      { key: "razao_social", label: "Razao Social" },
      { key: "nome_fantasia", label: "Nome Fantasia" },
      { key: "regime", label: "Regime Tributario" },
      { key: "senha_gov", label: "Senha Gov.br", sensitive: true },
    ],
  },
  documento: {
    icon: FileText,
    label: "Documento",
    fields: [
      { key: "numero", label: "Numero" },
      { key: "orgao", label: "Orgao Emissor" },
      { key: "validade", label: "Validade" },
    ],
  },
  outro: {
    icon: FileText,
    label: "Outro",
    fields: [
      { key: "info1", label: "Campo 1" },
      { key: "info2", label: "Campo 2" },
      { key: "info3", label: "Campo 3" },
    ],
  },
};

export function CarteiraTab() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [tipo, setTipo] = useState<DocTipo>("cartao_credito");
  const [titulo, setTitulo] = useState("");
  const [dados, setDados] = useState<Record<string, string>>({});
  const [notas, setNotas] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});

  const { data: docs = [] } = useQuery<CarteiraDoc[]>({
    queryKey: ["carteira_docs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("carteira_docs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any;
    },
  });

  const addDoc = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("carteira_docs").insert({
        user_id: user.id,
        tipo,
        titulo,
        dados: dados as any,
        notas: notas || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["carteira_docs"] });
      setAdding(false);
      setTitulo("");
      setDados({});
      setNotas("");
    },
  });

  const deleteDoc = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("carteira_docs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carteira_docs"] }),
  });

  const toggleSensitive = (key: string) => {
    setShowSensitive((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (adding) {
    const config = tipoConfig[tipo];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm font-semibold tracking-wider">NOVO ITEM</h3>
          <button onClick={() => setAdding(false)} className="p-1 rounded hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tipo selector */}
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(tipoConfig) as DocTipo[]).map((t) => {
            const cfg = tipoConfig[t];
            const Icon = cfg.icon;
            return (
              <button
                key={t}
                onClick={() => { setTipo(t); setDados({}); }}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                  tipo === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                }`}
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-xs">{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Title */}
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Nome / Titulo"
          className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Dynamic fields */}
        {config.fields.map((f) => (
          <div key={f.key}>
            <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1">
              {f.label}
            </label>
            <input
              type={f.sensitive ? "password" : "text"}
              value={dados[f.key] || ""}
              onChange={(e) => setDados({ ...dados, [f.key]: e.target.value })}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        ))}

        {/* Notes */}
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Notas (opcional)"
          rows={2}
          className="w-full bg-secondary rounded-lg px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />

        <button
          onClick={() => titulo && addDoc.mutate()}
          disabled={!titulo}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-mono text-sm font-medium disabled:opacity-40"
        >
          SALVAR
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm font-semibold tracking-wider">CARTEIRA</h3>
        <button onClick={() => setAdding(true)} className="p-1.5 rounded-md hover:bg-secondary">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {docs.length === 0 && (
        <p className="text-sm text-muted-foreground font-mono text-center py-8">
          Nenhum documento salvo
        </p>
      )}

      {docs.map((doc) => {
        const cfg = tipoConfig[(doc.tipo as DocTipo)] || tipoConfig.outro;
        const Icon = cfg.icon;
        const isExpanded = expanded === doc.id;

        return (
          <div key={doc.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : doc.id)}
              className="w-full flex items-center gap-3 p-3 text-left"
            >
              <div className="p-2 rounded-md bg-secondary">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-medium truncate">{doc.titulo}</p>
                <p className="font-mono text-[10px] text-muted-foreground tracking-wider">{cfg.label}</p>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                {cfg.fields.map((f) => {
                  const val = (doc.dados as any)?.[f.key];
                  if (!val) return null;
                  const sensKey = `${doc.id}-${f.key}`;
                  const isVisible = !f.sensitive || showSensitive[sensKey];
                  return (
                    <div key={f.key} className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground tracking-wider">{f.label}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs">
                          {isVisible ? val : "••••••"}
                        </span>
                        {f.sensitive && (
                          <button onClick={() => toggleSensitive(sensKey)} className="p-0.5">
                            {isVisible ? <EyeOff className="w-3 h-3 text-muted-foreground" /> : <Eye className="w-3 h-3 text-muted-foreground" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {doc.notas && (
                  <p className="text-xs text-muted-foreground font-mono mt-1">{doc.notas}</p>
                )}
                <button
                  onClick={() => deleteDoc.mutate(doc.id)}
                  className="flex items-center gap-1 text-destructive font-mono text-[10px] mt-2 hover:opacity-70"
                >
                  <Trash2 className="w-3 h-3" /> REMOVER
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
