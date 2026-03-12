import { DocCard } from "./shared";
import { Home, Heart, Briefcase, DollarSign, Bell, Brain, Layers, BarChart3 } from "lucide-react";

export function DocFuncionalidades() {
  return (
    <div>
      <h1 className="font-mono text-base font-bold tracking-wider mb-4">5. Funcionalidades Detalhadas</h1>

      <DocCard icon={Home} title="Kanban Unificado">
        <p>O coração do aplicativo. Todas as tarefas de todos os módulos em um único quadro.</p>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {[
            { col: "Hoje", desc: "Tarefas planejadas para hoje" },
            { col: "Em Andamento", desc: "Tarefas sendo executadas" },
            { col: "Aguardando", desc: "Tarefas bloqueadas" },
            { col: "Backlog", desc: "Tarefas futuras" },
          ].map(c => (
            <div key={c.col} className="bg-secondary/50 rounded-md p-2">
              <p className="font-mono text-[10px] font-bold text-foreground">{c.col}</p>
              <p className="text-[9px] text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-2"><strong>Filtros:</strong> Trabalho, Casa, Saúde — alterna e ordena por urgência + prazo.</p>
        <p><strong>Revelação Progressiva:</strong> <code className="bg-secondary px-1 py-0.5 rounded text-[10px]">base(3-5) + ajusteHumor(-2 a +2)</code></p>
      </DocCard>

      <DocCard icon={BarChart3} title="Dashboard Centralizado">
        <ul className="list-disc pl-4 space-y-1">
          <li>Tarefas feitas hoje / total planejado</li>
          <li>Taxa de conclusão (%)</li>
          <li>Trackers customizados com check diário</li>
          <li>Próximos eventos do calendário</li>
          <li>Score de bem-estar (quando disponível)</li>
        </ul>
      </DocCard>

      <DocCard icon={Layers} title="Quick Capture">
        <p>Campo de texto livre que aceita tarefas em linguagem natural. A IA classifica automaticamente.</p>
        <div className="bg-secondary/50 rounded-md p-2 mt-2">
          <p className="font-mono text-[9px] text-muted-foreground">
            <strong>Exemplo:</strong> "Ligar para o dentista amanhã" → módulo: saúde, tipo: operacional, urgência: 3, estado_ideal: qualquer
          </p>
        </div>
      </DocCard>

      <DocCard icon={Layers} title="Estados de Energia">
        <div className="space-y-1.5">
          {[
            { icon: "🔴", name: "Foco Total", desc: "Tarefas estratégicas e de alto impacto. Concentração máxima." },
            { icon: "🟡", name: "Modo Leve", desc: "Tarefas operacionais e administrativas. Ritmo moderado." },
            { icon: "🟢", name: "Básico", desc: "Apenas tarefas simples e domésticas. Dia de manutenção." },
          ].map(e => (
            <div key={e.name} className="bg-secondary/50 rounded-md p-2">
              <p className="font-mono text-[10px] font-bold text-primary">{e.icon} {e.name}</p>
              <p className="text-[10px] text-muted-foreground">{e.desc}</p>
            </div>
          ))}
        </div>
      </DocCard>

      <DocCard icon={Heart} title="Módulo Saúde (Bem-Estar)">
        {[
          { sub: "Medicamentos", desc: "Cadastro com nome, dose, horários e estoque. Alertas automáticos. Controle de estoque com alerta de reposição." },
          { sub: "Exercícios", desc: "Registro por tipo (caminhada, corrida, academia), duração, intensidade (1-5) e avaliação pós-exercício." },
          { sub: "Refeições", desc: "Registro por refeição (café, almoço, jantar), qualidade (1-5), refeições puladas, categorias opcionais." },
          { sub: "Sono", desc: "Horário de dormir/acordar, duração calculada automaticamente, qualidade (1-5)." },
          { sub: "Peso", desc: "Registro diário com gráfico histórico e notas opcionais." },
          { sub: "Check-in Emocional", desc: "A cada 3h, escala 1-5 com notas opcionais. Ajusta tarefas visíveis dinamicamente." },
          { sub: "Dashboard Semanal", desc: "Gráficos de humor, sono, exercícios. Score de bem-estar e classificação (estável/atenção/alerta)." },
        ].map(s => (
          <p key={s.sub} className="mb-1"><strong>{s.sub}:</strong> {s.desc}</p>
        ))}
      </DocCard>

      <DocCard icon={Briefcase} title="Módulo Trabalho">
        <p><strong>Clientes:</strong> Cadastro com nome, tipo, valor mensal, contato, status.</p>
        <p><strong>Tarefas vinculadas:</strong> Cada tarefa pode ser vinculada a um cliente.</p>
        <p><strong>Pomodoro:</strong> Timer de 25 minutos integrado às tarefas do dia.</p>
        <p><strong>Classificação IA:</strong> Novas tarefas classificadas automaticamente.</p>
        <p><strong>Subtarefas:</strong> Via parent_task_id para hierarquia de tarefas.</p>
      </DocCard>

      <DocCard icon={Home} title="Módulo Casa">
        <p><strong>Tarefas por Cômodo:</strong> Organização por área com frequência configurável.</p>
        <p><strong>Reset às 8h:</strong> Tarefas diárias resetam às 8h (Brasília), sem acúmulo.</p>
        <p><strong>Lista de Compras:</strong> Categorizada (mercado, farmácia, casa) com toggle.</p>
        <p><strong>Seeding Inteligente:</strong> Base de tarefas gerada pelo perfil do usuário.</p>
      </DocCard>

      <DocCard icon={DollarSign} title="Módulo Financeiro">
        <p><strong>Lançamentos:</strong> Entradas e saídas com saldo acumulado automático.</p>
        <p><strong>Tags:</strong> Categorização com emoji + cor para análise.</p>
        <p><strong>Consolidação Mensal:</strong> Resumo automático com performance.</p>
        <p><strong>Carteira Digital:</strong> Documentos e dados importantes (JSONB).</p>
        <p><strong>Horizonte:</strong> Visão projetada de saldo futuro.</p>
      </DocCard>

      <DocCard icon={Brain} title="Metas Pessoais">
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {[
            { tipo: "Curto", prazo: "1 mês" },
            { tipo: "Médio", prazo: "6 meses" },
            { tipo: "Longo", prazo: "1 ano" },
          ].map(m => (
            <div key={m.tipo} className="bg-secondary/50 rounded-md p-2 text-center">
              <p className="font-mono text-[10px] font-bold text-foreground">{m.tipo}</p>
              <p className="text-[9px] text-muted-foreground">{m.prazo}</p>
            </div>
          ))}
        </div>
        <p>Barra de progresso visual (0-100%), notas de evolução com histórico, revisão obrigatória às segundas.</p>
      </DocCard>

      <DocCard icon={Bell} title="Notificações">
        <div className="space-y-1.5 mb-2">
          {[
            { tipo: "Medicamentos", gatilho: "Horário programado" },
            { tipo: "Tarefas Pendentes", gatilho: "10h e 14h" },
            { tipo: "Check-in Emocional", gatilho: "A cada 3h" },
            { tipo: "Eventos", gatilho: "Conforme lembrete_min" },
          ].map(n => (
            <div key={n.tipo} className="flex justify-between bg-secondary/50 rounded-md p-2">
              <span className="font-mono text-[10px] font-bold text-foreground">{n.tipo}</span>
              <span className="text-[10px] text-muted-foreground">{n.gatilho}</span>
            </div>
          ))}
        </div>
        <p><strong>Deduplicação:</strong> Tag único por tipo + horário. <strong>Prioridade:</strong> Med &gt; Eventos &gt; Humor &gt; Tarefas. <strong>Limite:</strong> 5/dia.</p>
      </DocCard>
    </div>
  );
}
