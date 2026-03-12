import { DocCard } from "./shared";
import { List } from "lucide-react";

const GLOSSARY = [
  { term: "Activity Log", def: "Registro automático de todas as ações do usuário no sistema" },
  { term: "Backlog", def: "Coluna do Kanban para tarefas futuras ou de baixa prioridade" },
  { term: "Check-in Emocional", def: "Registro periódico (a cada 3h) do humor do usuário, na escala de 1 a 5" },
  { term: "Consolidação", def: "Processo de resumir lotes de 100 logs em resumos gerados pela IA" },
  { term: "DayGate", def: "Sistema de controle de acesso por dia da semana (segunda/sexta)" },
  { term: "Edge Function", def: "Função serverless executada no backend (Deno) para lógica de negócio" },
  { term: "Estado de Energia", def: "Nível de capacidade do usuário: Foco Total, Modo Leve ou Básico" },
  { term: "Gating", def: "Bloqueio de acesso ao app até completar uma ação obrigatória" },
  { term: "Kanban", def: "Quadro visual de tarefas com colunas de status" },
  { term: "Log Consolidado", def: "Resumo gerado pela IA a partir de lotes de logs do activity_log" },
  { term: "Módulo", def: "Área funcional do app (Trabalho, Casa, Saúde, Financeiro)" },
  { term: "Nudge", def: "Sugestão personalizada da IA baseada no contexto atual do usuário" },
  { term: "Onboarding", def: "Processo de configuração inicial de cada módulo no primeiro acesso" },
  { term: "Pomodoro", def: "Técnica de produtividade com ciclos de 25 minutos de foco" },
  { term: "POP", def: "Procedimento Operacional Padrão — guia passo a passo para tarefas" },
  { term: "PWA", def: "Progressive Web App — aplicativo web instalável no dispositivo" },
  { term: "Quick Capture", def: "Campo de entrada rápida de tarefas por texto livre" },
  { term: "Revelação Progressiva", def: "Sistema que mostra tarefas gradualmente conforme energia e humor" },
  { term: "RLS", def: "Row Level Security — segurança de dados por linha no banco de dados" },
  { term: "Score de Bem-Estar", def: "Pontuação calculada pela IA baseada em humor, sono, exercício e alimentação" },
  { term: "Seeding", def: "Geração automática de tarefas base para o módulo Casa" },
  { term: "Tracker", def: "Rastreador customizável para hábitos diários do usuário" },
];

export function DocGlossario() {
  return (
    <div>
      <h1 className="font-mono text-base font-bold tracking-wider mb-4">7. Glossário de Termos</h1>

      <DocCard icon={List} title={`${GLOSSARY.length} Termos`}>
        <div className="space-y-0">
          {GLOSSARY.map((item, i) => (
            <div key={item.term} className={`flex gap-3 py-2 ${i < GLOSSARY.length - 1 ? "border-b border-border/50" : ""}`}>
              <span className="font-mono text-[10px] font-bold text-primary whitespace-nowrap min-w-[140px]">{item.term}</span>
              <span className="text-[10px] text-muted-foreground">{item.def}</span>
            </div>
          ))}
        </div>
      </DocCard>
    </div>
  );
}
