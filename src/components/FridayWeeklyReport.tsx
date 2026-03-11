import { useState } from "react";
import { useMetasStore } from "@/lib/metas-store";
import { BarChart3, X, Star, AlertTriangle, TrendingUp } from "lucide-react";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface FridayWeeklyReportProps {
  onDismiss: () => void;
}

export function FridayWeeklyReport({ onDismiss }: FridayWeeklyReportProps) {
  const store = useMetasStore();
  const [step, setStep] = useState(0);
  const [nota, setNota] = useState(3);
  const [reflexao, setReflexao] = useState("");
  const [destaques, setDestaques] = useState("");
  const [dificuldades, setDificuldades] = useState("");
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      store.saveReport({
        user_id: user.id,
        semana_inicio: format(weekStart, "yyyy-MM-dd"),
        semana_fim: format(weekEnd, "yyyy-MM-dd"),
        reflexao: reflexao.trim() || null,
        nota_semana: nota,
        destaques: destaques.trim() ? destaques.split("\n").filter(Boolean) : null,
        dificuldades: dificuldades.trim() ? dificuldades.split("\n").filter(Boolean) : null,
        metas_update: [],
        metricas: {},
      });
      onDismiss();
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    // Step 0: Rating
    <div key="rating" className="space-y-4">
      <label className="font-mono text-sm font-medium block">Como foi sua semana?</label>
      <div className="flex justify-between gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => { setNota(n); setTimeout(() => setStep(1), 300); }}
            className={`flex-1 py-4 rounded-xl border text-center transition-all ${
              nota === n
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-secondary"
            }`}
          >
            <span className="text-lg">{["😔", "😕", "😐", "🙂", "😄"][n - 1]}</span>
            <span className="block font-mono text-[9px] mt-1 text-muted-foreground">
              {["Difícil", "Ruim", "Normal", "Boa", "Ótima"][n - 1]}
            </span>
          </button>
        ))}
      </div>
    </div>,

    // Step 1: Highlights
    <div key="highlights" className="space-y-4">
      <label className="font-mono text-sm font-medium block flex items-center gap-2">
        <Star className="w-4 h-4 text-yellow-500" /> Destaques da semana
      </label>
      <p className="text-xs text-muted-foreground font-body">O que deu certo? O que te orgulhou? (um por linha)</p>
      <textarea
        value={destaques}
        onChange={(e) => setDestaques(e.target.value)}
        rows={3}
        placeholder="Entreguei o projeto X&#10;Fiz exercício 3x&#10;Mantive a casa organizada"
        className="w-full bg-background border rounded-lg p-3 text-sm font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>,

    // Step 2: Difficulties
    <div key="diff" className="space-y-4">
      <label className="font-mono text-sm font-medium block flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-400" /> Dificuldades
      </label>
      <p className="text-xs text-muted-foreground font-body">O que foi difícil? Sem julgamento. (um por linha)</p>
      <textarea
        value={dificuldades}
        onChange={(e) => setDificuldades(e.target.value)}
        rows={3}
        placeholder="Procrastinei na segunda&#10;Não dormi bem&#10;Esqueci do remédio"
        className="w-full bg-background border rounded-lg p-3 text-sm font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>,

    // Step 3: Reflection
    <div key="reflexao" className="space-y-4">
      <label className="font-mono text-sm font-medium block flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" /> Reflexão
      </label>
      <p className="text-xs text-muted-foreground font-body">Uma frase sobre o que levar pra próxima semana.</p>
      <textarea
        value={reflexao}
        onChange={(e) => setReflexao(e.target.value)}
        rows={2}
        placeholder="Preciso dormir mais cedo e priorizar menos tarefas."
        className="w-full bg-background border rounded-lg p-3 text-sm font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>,
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mx-auto">
          <BarChart3 className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-mono text-lg font-bold">Report da semana</h2>
        <p className="text-xs text-muted-foreground font-mono">
          {format(weekStart, "dd/MM", { locale: ptBR })} — {format(weekEnd, "dd/MM", { locale: ptBR })}
        </p>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all ${
              i <= step ? "bg-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      {steps[step]}

      {/* Navigation */}
      <div className="flex gap-2">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 py-2.5 rounded-lg border font-mono text-xs hover:bg-secondary"
          >
            VOLTAR
          </button>
        )}
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-mono text-xs hover:opacity-90"
          >
            PRÓXIMO
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-mono text-xs hover:opacity-90 disabled:opacity-40"
          >
            {saving ? "SALVANDO..." : "FECHAR SEMANA"}
          </button>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="w-full font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors text-center"
      >
        PULAR POR AGORA
      </button>
    </div>
  );
}
