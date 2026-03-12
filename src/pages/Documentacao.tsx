import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Download, Eye, Server, Database, GitBranch, Layers, BookMarked, List } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { downloadDocMarkdown, DOC_SECTIONS, type DocSection } from "@/lib/doc-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocVisaoGeral } from "@/components/docs/DocVisaoGeral";
import { DocArquitetura } from "@/components/docs/DocArquitetura";
import { DocBancoDeDados } from "@/components/docs/DocBancoDeDados";
import { DocFluxos } from "@/components/docs/DocFluxos";
import { DocFuncionalidades } from "@/components/docs/DocFuncionalidades";
import { DocPops } from "@/components/docs/DocPops";
import { DocGlossario } from "@/components/docs/DocGlossario";

const SECTION_ICONS: Record<DocSection, typeof Eye> = {
  "visao-geral": Eye,
  "arquitetura": Server,
  "banco-de-dados": Database,
  "fluxos": GitBranch,
  "funcionalidades": Layers,
  "pops": BookMarked,
  "glossario": List,
};

const SECTION_COMPONENTS: Record<DocSection, React.FC> = {
  "visao-geral": DocVisaoGeral,
  "arquitetura": DocArquitetura,
  "banco-de-dados": DocBancoDeDados,
  "fluxos": DocFluxos,
  "funcionalidades": DocFuncionalidades,
  "pops": DocPops,
  "glossario": DocGlossario,
};

export default function Documentacao() {
  const navigate = useNavigate();
  const [active, setActive] = useState<DocSection>("visao-geral");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setSidebarOpen(false);
  }, [active]);

  const ActiveComponent = SECTION_COMPONENTS[active];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate("/config")} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <BookOpen className="w-4 h-4 text-primary" />
        <h1 className="font-mono text-sm font-bold tracking-wider">DOCUMENTAÇÃO</h1>
        <button
          onClick={() => downloadDocMarkdown()}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-mono text-[10px] hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3 h-3" />
          Baixar .md
        </button>
        {/* Mobile toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-1.5 rounded-md hover:bg-secondary transition-colors"
        >
          <List className="w-4 h-4" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - desktop always visible, mobile toggleable */}
        <aside className={`${sidebarOpen ? "block" : "hidden"} md:block w-56 flex-shrink-0 border-r bg-card/50`}>
          <ScrollArea className="h-[calc(100vh-53px)]">
            <nav className="p-3 space-y-0.5">
              {DOC_SECTIONS.map((s) => {
                const Icon = SECTION_ICONS[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md font-mono text-[11px] transition-colors text-left ${
                      active === s.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* Content area */}
        <main ref={contentRef} className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
            <ActiveComponent />
            <p className="text-center font-mono text-[9px] text-muted-foreground/30 mt-12">
              AntiBipolaridade v2.0 — Documentação Completa
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
