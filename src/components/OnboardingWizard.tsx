import { useState } from "react";
import { useProfileStore, Profile } from "@/lib/profile-store";
import { ChevronRight, User, Briefcase, Home, Heart, Wallet, X } from "lucide-react";

type ModuloOnboarding = "saude" | "trabalho" | "casa" | "financeiro";

interface OnboardingWizardProps {
  modulo: ModuloOnboarding;
  onComplete: () => void;
}

type Question = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "boolean";
  placeholder?: string;
  options?: { value: string; label: string }[];
  suffix?: string;
};

const moduloConfig: Record<ModuloOnboarding, { icon: typeof Heart; title: string; subtitle: string; questions: Question[] }> = {
  saude: {
    icon: Heart,
    title: "Vamos conhecer você",
    subtitle: "Informações básicas para acompanhar sua saúde de forma sincera.",
    questions: [
      { key: "nome", label: "Como quer ser chamado?", type: "text", placeholder: "Seu nome" },
      { key: "data_nascimento", label: "Quando você nasceu?", type: "date" },
      { key: "peso_kg", label: "Qual seu peso atual?", type: "number", placeholder: "Ex: 82", suffix: "kg" },
      { key: "altura_cm", label: "Qual sua altura?", type: "number", placeholder: "Ex: 175", suffix: "cm" },
      {
        key: "objetivo_saude", label: "Qual seu objetivo com a saúde?", type: "select",
        options: [
          { value: "monitorar", label: "Só monitorar" },
          { value: "perder_peso", label: "Perder peso" },
          { value: "ganhar_massa", label: "Ganhar massa" },
          { value: "manter", label: "Manter como está" },
          { value: "melhorar_habitos", label: "Melhorar hábitos" },
        ],
      },
    ],
  },
  trabalho: {
    icon: Briefcase,
    title: "Sobre seu trabalho",
    subtitle: "Para organizar suas tarefas do jeito que funciona pra você.",
    questions: [
      {
        key: "trabalho_tipo", label: "Como você trabalha?", type: "select",
        options: [
          { value: "freelancer", label: "Freelancer" },
          { value: "autonomo", label: "Autônomo" },
          { value: "empresario", label: "Empresário" },
          { value: "clt", label: "CLT" },
          { value: "misto", label: "Misto" },
        ],
      },
      { key: "trabalho_horas_dia", label: "Quantas horas trabalha por dia?", type: "number", placeholder: "Ex: 8" },
      {
        key: "trabalho_desafio", label: "Seu maior desafio no trabalho?", type: "select",
        options: [
          { value: "foco", label: "Manter o foco" },
          { value: "organizacao", label: "Organização" },
          { value: "prazos", label: "Cumprir prazos" },
          { value: "delegacao", label: "Delegar tarefas" },
          { value: "energia", label: "Ter energia" },
        ],
      },
      { key: "trabalho_clientes_ativos", label: "Quantos clientes ativos?", type: "number", placeholder: "Ex: 5" },
      {
        key: "trabalho_equipe", label: "Trabalha sozinho ou em equipe?", type: "select",
        options: [
          { value: "sozinho", label: "Sozinho" },
          { value: "equipe_pequena", label: "Equipe pequena (2-5)" },
          { value: "equipe_grande", label: "Equipe maior (5+)" },
        ],
      },
    ],
  },
  casa: {
    icon: Home,
    title: "Sobre sua casa",
    subtitle: "Para montar uma rotina que faça sentido pra você.",
    questions: [
      { key: "casa_moradores", label: "Quantas pessoas moram com você?", type: "number", placeholder: "Ex: 2" },
      { key: "casa_comodos", label: "Quantos cômodos tem sua casa?", type: "number", placeholder: "Ex: 5" },
      { key: "casa_pets", label: "Tem pets?", type: "boolean" },
      {
        key: "casa_frequencia_ideal", label: "Qual frequência ideal de limpeza?", type: "select",
        options: [
          { value: "diaria", label: "Diária" },
          { value: "dia_sim_dia_nao", label: "Dia sim, dia não" },
          { value: "semanal", label: "Semanal" },
          { value: "quando_da", label: "Quando dá" },
        ],
      },
      {
        key: "casa_desafio", label: "Sua maior dificuldade em casa?", type: "select",
        options: [
          { value: "rotina", label: "Manter uma rotina" },
          { value: "tempo", label: "Falta de tempo" },
          { value: "motivacao", label: "Motivação" },
          { value: "dividir", label: "Dividir tarefas" },
        ],
      },
    ],
  },
  financeiro: {
    icon: Wallet,
    title: "Sobre suas finanças",
    subtitle: "Para o financeiro funcionar do seu jeito.",
    questions: [
      {
        key: "financeiro_faixa_renda", label: "Faixa de renda mensal?", type: "select",
        options: [
          { value: "ate_3k", label: "Até R$ 3.000" },
          { value: "3k_7k", label: "R$ 3.000 – R$ 7.000" },
          { value: "7k_15k", label: "R$ 7.000 – R$ 15.000" },
          { value: "15k_mais", label: "Acima de R$ 15.000" },
          { value: "variavel", label: "Variável" },
        ],
      },
      {
        key: "financeiro_objetivo", label: "Qual seu objetivo financeiro?", type: "select",
        options: [
          { value: "organizar", label: "Organizar gastos" },
          { value: "economizar", label: "Economizar mais" },
          { value: "investir", label: "Começar a investir" },
          { value: "divida", label: "Sair de dívidas" },
          { value: "crescer", label: "Crescer receita" },
        ],
      },
      {
        key: "financeiro_controla_gastos", label: "Você controla seus gastos?", type: "select",
        options: [
          { value: "sim", label: "Sim, sempre" },
          { value: "as_vezes", label: "Às vezes" },
          { value: "nao", label: "Não" },
        ],
      },
      {
        key: "financeiro_principal_gasto", label: "Onde vai a maior parte?", type: "select",
        options: [
          { value: "moradia", label: "Moradia" },
          { value: "alimentacao", label: "Alimentação" },
          { value: "transporte", label: "Transporte" },
          { value: "lazer", label: "Lazer" },
          { value: "saude", label: "Saúde" },
        ],
      },
      {
        key: "financeiro_reserva", label: "Tem reserva de emergência?", type: "select",
        options: [
          { value: "sim", label: "Sim" },
          { value: "construindo", label: "Construindo" },
          { value: "nao", label: "Não" },
        ],
      },
    ],
  },
};

export function OnboardingWizard({ modulo, onComplete }: OnboardingWizardProps) {
  const { updateProfile } = useProfileStore();
  const config = moduloConfig[modulo];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [skipped, setSkipped] = useState(false);

  const Icon = config.icon;
  const question = config.questions[step];
  const isLast = step === config.questions.length - 1;
  const progress = ((step + 1) / config.questions.length) * 100;

  const currentAnswer = answers[question.key] ?? "";

  const setAnswer = (val: any) => {
    setAnswers((prev) => ({ ...prev, [question.key]: val }));
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleFinish = () => {
    const profileUpdates: Partial<Profile> = {
      ...answers,
      [`onboarding_${modulo}`]: true,
      [`onboarding_${modulo}_at`]: new Date().toISOString(),
    } as any;
    updateProfile(profileUpdates);
    onComplete();
  };

  const handleSkipAll = () => {
    updateProfile({ [`onboarding_${modulo}`]: true } as any);
    onComplete();
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-mono text-lg font-bold">{config.title}</h2>
        <p className="text-sm text-muted-foreground font-body">{config.subtitle}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {step + 1}/{config.questions.length}
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-card rounded-xl border p-6 space-y-4 animate-fade-in" key={step}>
        <label className="font-mono text-sm font-medium block">{question.label}</label>

        {question.type === "text" && (
          <input
            value={currentAnswer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={question.placeholder}
            className="w-full bg-background border rounded-lg p-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/50"
            onKeyDown={(e) => e.key === "Enter" && currentAnswer && handleNext()}
          />
        )}

        {question.type === "number" && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={currentAnswer}
              onChange={(e) => setAnswer(e.target.value ? Number(e.target.value) : "")}
              placeholder={question.placeholder}
              className="flex-1 bg-background border rounded-lg p-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyDown={(e) => e.key === "Enter" && currentAnswer && handleNext()}
            />
            {question.suffix && (
              <span className="font-mono text-sm text-muted-foreground">{question.suffix}</span>
            )}
          </div>
        )}

        {question.type === "date" && (
          <input
            type="date"
            value={currentAnswer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full bg-background border rounded-lg p-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        )}

        {question.type === "select" && (
          <div className="grid grid-cols-1 gap-2">
            {question.options!.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setAnswer(opt.value);
                  // Auto-advance on select after brief delay
                  setTimeout(() => {
                    if (isLast) {
                      handleFinish();
                    } else {
                      setStep((s) => s + 1);
                    }
                  }, 300);
                }}
                className={`p-3 rounded-lg border text-sm font-body text-left transition-all ${
                  currentAnswer === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-secondary border-border"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {question.type === "boolean" && (
          <div className="flex gap-3">
            {[
              { value: true, label: "Sim" },
              { value: false, label: "Não" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => {
                  setAnswer(opt.value);
                  setTimeout(() => {
                    if (isLast) handleFinish();
                    else setStep((s) => s + 1);
                  }, 300);
                }}
                className={`flex-1 p-3 rounded-lg border text-sm font-mono transition-all ${
                  currentAnswer === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-secondary border-border"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleSkipAll}
          className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          PULAR TUDO
        </button>

        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 rounded-lg font-mono text-xs border hover:bg-secondary transition-all"
            >
              VOLTAR
            </button>
          )}
          {question.type !== "select" && question.type !== "boolean" && (
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-mono text-xs hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              {isLast ? "CONCLUIR" : "PRÓXIMO"}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
