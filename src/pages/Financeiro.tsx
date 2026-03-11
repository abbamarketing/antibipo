import { useState } from "react";
import { useFinancialStore } from "@/lib/financial-store";
import { ArrowLeft, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mesAbreviado } from "@/lib/currency";
import { SaldosTab } from "@/components/financeiro/SaldosTab";
import { TotaisTab } from "@/components/financeiro/TotaisTab";
import { TagsTab } from "@/components/financeiro/TagsTab";
import { HorizonteTab } from "@/components/financeiro/HorizonteTab";
import { CarteiraTab } from "@/components/financeiro/CarteiraTab";
import { LancamentoModal } from "@/components/financeiro/LancamentoModal";
import { ModuleOnboardingGuard } from "@/components/ModuleOnboardingGuard";

type FinTab = "saldos" | "totais" | "tags" | "carteira" | "horizonte";

export default function Financeiro() {
  const navigate = useNavigate();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [tab, setTab] = useState<FinTab>("saldos");
  const [editDay, setEditDay] = useState<number | null>(null);
  const [quickEntry, setQuickEntry] = useState(false);

  const store = useFinancialStore(ano, mes);

  const prevMonth = () => {
    if (mes === 1) { setMes(12); setAno(ano - 1); }
    else setMes(mes - 1);
  };

  const nextMonth = () => {
    if (mes === 12) { setMes(1); setAno(ano + 1); }
    else setMes(mes + 1);
  };

  const goToToday = () => {
    setAno(now.getFullYear());
    setMes(now.getMonth() + 1);
  };

  const isCurrentMonth = ano === now.getFullYear() && mes === now.getMonth() + 1;

  const tabs: { key: FinTab; label: string }[] = [
    { key: "saldos", label: "SALDOS" },
    { key: "totais", label: "TOTAIS" },
    { key: "tags", label: "TAGS" },
    { key: "carteira", label: "DOCS" },
  ];

  return (
    <ModuleOnboardingGuard modulo="financeiro" fullPage>
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-md hover:bg-secondary transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-2 rounded-md hover:bg-secondary transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={goToToday}
              className={`font-mono text-sm font-bold tracking-tight min-w-[80px] text-center px-2 py-1 rounded-md transition-colors ${
                !isCurrentMonth ? "hover:bg-secondary" : ""
              }`}
            >
              {mesAbreviado(mes)}/{String(ano).slice(2)}
            </button>
            <button onClick={nextMonth} className="p-2 rounded-md hover:bg-secondary transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setTab(tab === "horizonte" ? "saldos" : "horizonte")}
            className={`p-2 -mr-2 rounded-md transition-colors ${tab === "horizonte" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </header>

        {/* Tab nav */}
        {tab !== "horizonte" && (
          <nav className="flex gap-1 bg-secondary rounded-lg p-1 mb-4">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 rounded-md font-mono text-xs font-medium tracking-wider transition-all ${
                  tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        )}

        {/* Content */}
        {tab === "saldos" && (
          <SaldosTab
            dailyList={store.dailyList()}
            onDayClick={(dia) => setEditDay(dia)}
          />
        )}

        {tab === "totais" && (
          <TotaisTab consolidacao={store.consolidacao} ano={ano} mes={mes} />
        )}

        {tab === "tags" && (
          <TagsTab
            tags={store.tags}
            lancamentoTags={store.lancamentoTags}
            lancamentos={store.lancamentos}
            onCreateTag={(t) => store.createTag.mutate(t)}
            onUpdateTag={(t) => store.updateTag.mutate(t)}
            onDeleteTag={(id) => store.deleteTag.mutate(id)}
          />
        )}

        {tab === "carteira" && <CarteiraTab />}

        {tab === "horizonte" && (
          <HorizonteTab
            currentAno={ano}
            currentMes={mes}
            onBack={() => setTab("saldos")}
            onDayClick={(a, m, d) => { setAno(a); setMes(m); setEditDay(d); setTab("saldos"); }}
          />
        )}
      </div>

      {/* FAB */}
      {tab !== "horizonte" && (
        <button
          onClick={() => setQuickEntry(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-40 font-mono text-xl font-bold"
        >
          +
        </button>
      )}

      {/* Edit modal */}
      {editDay !== null && (
        <LancamentoModal
          ano={ano} mes={mes} dia={editDay}
          lancamentos={store.lancamentos}
          tags={store.tags}
          onSave={(data) => { store.upsertLancamento.mutate(data); setEditDay(null); }}
          onClose={() => setEditDay(null)}
        />
      )}

      {/* Quick entry modal */}
      {quickEntry && (
        <LancamentoModal
          ano={ano} mes={mes} dia={new Date().getDate()}
          lancamentos={store.lancamentos}
          tags={store.tags}
          onSave={(data) => { store.upsertLancamento.mutate(data); setQuickEntry(false); }}
          onClose={() => setQuickEntry(false)}
        />
      )}
    </div>
    </ModuleOnboardingGuard>
  );
}
