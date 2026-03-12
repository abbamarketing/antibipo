import { DocCard } from "./shared";
import { GitBranch } from "lucide-react";

export function DocFluxos() {
  return (
    <div>
      <h1 className="font-mono text-base font-bold tracking-wider mb-4">4. Fluxos de Usuário</h1>

      <DocCard icon={GitBranch} title="Primeiro Acesso">
        <Flow lines={[
          "Usuário abre o app",
          "→ Tela de Login/Cadastro (/auth)",
          "→ Cria conta com email + senha",
          "→ Recebe email de confirmação",
          "→ Confirma email → Redireciona para / (Home)",
          "→ Onboarding automático:",
          "   1. Módulo Saúde: peso, altura, objetivo",
          "   2. Módulo Trabalho: tipo, horas/dia, clientes",
          "   3. Módulo Casa: moradores, cômodos, pets",
          "   4. Módulo Financeiro: renda, objetivo, gastos",
          "→ Perfil salvo → Acesso completo liberado",
        ]} />
      </DocCard>

      <DocCard icon={GitBranch} title="Acesso Diário Normal (Terça a Quinta)">
        <Flow lines={[
          "Login → AuthGuard verifica sessão",
          "→ DayGate verifica dia da semana → Acesso direto",
          "→ Seleciona Estado de Energia",
          "→ Kanban carrega tarefas filtradas",
          "→ Dashboard exibe métricas do dia",
          "→ Eventos do calendário exibidos",
          "→ A cada 3h: check-in emocional sugerido",
          "→ Ao concluir tarefas: revelação progressiva",
          "→ Fim do dia: IA analisa e gera resumo",
        ]} />
      </DocCard>

      <DocCard icon={GitBranch} title="Segunda-feira (Gating de Metas)">
        <Flow lines={[
          "Login → DayGate detecta segunda-feira",
          "→ Tela de Revisão de Metas aparece",
          "→ Para cada meta ativa:",
          "   - Atualiza progresso (%)",
          "   - Adiciona nota de evolução",
          "→ Confirma revisão",
          "→ App libera acesso completo",
        ]} />
      </DocCard>

      <DocCard icon={GitBranch} title="Sexta-feira (Gating de Relatório)">
        <Flow lines={[
          "Login → DayGate detecta sexta-feira",
          "→ Formulário de Relatório Semanal",
          "→ Preenche destaques, dificuldades, reflexão",
          "→ Dá nota de 1-10 para a semana",
          "→ Envia relatório (salvo em reports_semanais)",
          "→ App libera acesso completo",
        ]} />
      </DocCard>

      <DocCard icon={GitBranch} title="Fluxo de Tarefas">
        <Flow lines={[
          "Quick Capture: texto livre",
          "→ Edge Function classify-task (IA)",
          "→ Classifica: módulo, tipo, impacto, urgência, estado ideal",
          "→ Tarefa criada no Kanban (backlog ou hoje)",
          "→ Revelação progressiva filtra visibilidade:",
          "   Base: 3-5 tarefas + ajuste humor (-2 a +2)",
          "   Filtro por estado de energia",
          "→ Usuário move: Em Andamento → Feito",
          "→ Activity log registra cada ação",
        ]} />
      </DocCard>

      <DocCard icon={GitBranch} title="Fluxo de Medicamentos">
        <Flow lines={[
          "Cadastro: nome, dose, horários[], estoque",
          "→ NotificationManager agenda alertas",
          "→ Nos horários programados:",
          "   → Push: \"Tomar [Medicamento] ([horário])\"",
          "   → Usuário marca como tomado",
          "   → Estoque decrementado",
          "   → Se estoque < 7: alerta de reposição",
          "→ Dashboard saúde exibe adesão diária",
        ]} />
      </DocCard>

      <DocCard icon={GitBranch} title="Fluxo de Consolidação de Logs">
        <Flow lines={[
          "Cada ação → activity_log",
          "→ Ao atingir 200 logs:",
          "   → consolidate-logs Edge Function",
          "   → 100 logs antigos → resumidos pela IA",
          "   → Resumo salvo em log_consolidado",
          "   → Logs antigos removidos",
          "   → 100 recentes mantidos (contexto IA)",
          "→ Ao atingir 1000 totais:",
          "   → Botão de download disponível (JSON)",
        ]} />
      </DocCard>
    </div>
  );
}

function Flow({ lines }: { lines: string[] }) {
  return (
    <div className="bg-secondary/50 rounded-md p-3 font-mono text-[9px] text-muted-foreground space-y-0.5">
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  );
}
