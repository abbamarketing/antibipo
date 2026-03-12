import { DocCard } from "./shared";
import { Database } from "lucide-react";

export function DocBancoDeDados() {
  return (
    <div>
      <h1 className="font-mono text-base font-bold tracking-wider mb-4">3. Estrutura do Banco de Dados</h1>

      <DocCard icon={Database} title="Visão Geral">
        <p>O banco PostgreSQL contém <strong>25+ tabelas</strong> organizadas por domínio funcional. Todas possuem <strong>Row Level Security (RLS)</strong> ativo para isolamento de dados por usuário.</p>
      </DocCard>

      <DocCard icon={Database} title="Core / Sistema">
        <Table headers={["Tabela", "Descrição"]} rows={[
          ["profiles", "Perfil do usuário com dados de onboarding"],
          ["configuracoes", "Configurações do usuário (chave-valor JSONB)"],
          ["activity_log", "Log de ações do usuário"],
          ["log_consolidado", "Resumos consolidados pela IA"],
          ["sessoes_energia", "Sessões de estado de energia"],
        ]} />
      </DocCard>

      <DocCard icon={Database} title="Trabalho">
        <Table headers={["Tabela", "Descrição"]} rows={[
          ["tasks", "Tarefas unificadas (trabalho/casa/saúde) com status, tipo, impacto, urgência"],
          ["clientes", "Clientes do módulo trabalho com nome, status, valor mensal"],
        ]} />
      </DocCard>

      <DocCard icon={Database} title="Casa">
        <Table headers={["Tabela", "Descrição"]} rows={[
          ["tarefas_casa", "Tarefas domésticas configuráveis por cômodo e frequência"],
          ["registros_limpeza", "Registros de conclusão de tarefas de casa"],
          ["lista_compras", "Lista de compras categorizada"],
        ]} />
      </DocCard>

      <DocCard icon={Database} title="Saúde / Bem-Estar">
        <Table headers={["Tabela", "Descrição"]} rows={[
          ["medicamentos", "Cadastro de medicamentos com dose, horários e estoque"],
          ["registros_medicamento", "Registros de doses tomadas"],
          ["registros_humor", "Check-ins emocionais (1-5)"],
          ["registros_sono", "Registros de sono com qualidade e duração"],
          ["bm_exercicios", "Registros de exercícios físicos"],
          ["bm_refeicoes", "Registros de refeições com qualidade"],
          ["registros_peso", "Acompanhamento de peso"],
          ["bm_log_estado", "Log diário completo de bem-estar"],
          ["bm_metas", "Metas de bem-estar (exercício, alimentação)"],
          ["bm_analise_semanal", "Análise semanal gerada pela IA"],
        ]} />
      </DocCard>

      <DocCard icon={Database} title="Financeiro">
        <Table headers={["Tabela", "Descrição"]} rows={[
          ["fc_lancamentos", "Lançamentos financeiros com entrada/saída/saldo"],
          ["fc_tags", "Tags de categorização com emoji e cor"],
          ["fc_lancamento_tags", "Relação N:N entre lançamentos e tags"],
          ["fc_consolidacao", "Consolidação mensal automática"],
          ["carteira_docs", "Documentos da carteira digital (JSONB)"],
        ]} />
      </DocCard>

      <DocCard icon={Database} title="Metas, Relatórios & Utilidades">
        <Table headers={["Tabela", "Descrição"]} rows={[
          ["metas_pessoais", "Metas de curto/médio/longo prazo com progresso"],
          ["reports_semanais", "Relatórios semanais obrigatórios"],
          ["reunioes", "Eventos e reuniões do calendário"],
          ["custom_trackers", "Trackers personalizáveis pelo usuário"],
          ["tracker_registros", "Registros dos trackers customizados"],
          ["diario_entradas", "Entradas do diário pessoal"],
          ["push_subscriptions", "Assinaturas de notificação push"],
        ]} />
      </DocCard>

      <DocCard icon={Database} title="Enums do Banco">
        <div className="space-y-2">
          {[
            { name: "energy_state", values: "foco_total, modo_leve, basico" },
            { name: "estado_ideal_type", values: "foco_total, modo_leve, basico, qualquer" },
            { name: "task_modulo", values: "trabalho, casa, saude" },
            { name: "task_owner", values: "eu, socio_medico, editor" },
            { name: "task_status", values: "backlog, hoje, em_andamento, aguardando, feito, descartado" },
            { name: "task_tipo", values: "estrategico, operacional, delegavel, administrativo, domestico" },
          ].map(e => (
            <div key={e.name} className="bg-secondary/50 rounded-md p-2">
              <code className="font-mono text-[10px] text-primary">{e.name}</code>
              <p className="text-[9px] text-muted-foreground mt-0.5">{e.values}</p>
            </div>
          ))}
        </div>
      </DocCard>

      <DocCard icon={Database} title="Políticas RLS">
        <p>Existem dois padrões de RLS aplicados:</p>
        <div className="mt-2 space-y-1.5">
          <div className="bg-secondary/50 rounded-md p-2">
            <p className="font-mono text-[10px] font-bold text-foreground">Isolamento por user_id</p>
            <p className="text-[10px] text-muted-foreground">Tabelas como profiles, metas_pessoais, configuracoes usam <code className="bg-primary/10 px-1 rounded">auth.uid() = user_id</code></p>
          </div>
          <div className="bg-secondary/50 rounded-md p-2">
            <p className="font-mono text-[10px] font-bold text-foreground">Acesso autenticado</p>
            <p className="text-[10px] text-muted-foreground">Tabelas como tasks, medicamentos permitem acesso a qualquer usuário autenticado (single-user)</p>
          </div>
        </div>
      </DocCard>

      <DocCard icon={Database} title="Funções do Banco">
        <div className="space-y-1.5">
          <div className="bg-secondary/50 rounded-md p-2">
            <code className="font-mono text-[10px] text-primary">reset_my_data()</code>
            <p className="text-[10px] text-muted-foreground">Reseta todos os dados do usuário logado</p>
          </div>
          <div className="bg-secondary/50 rounded-md p-2">
            <code className="font-mono text-[10px] text-primary">reset_user_data(p_user_id)</code>
            <p className="text-[10px] text-muted-foreground">Reseta dados de um usuário específico</p>
          </div>
        </div>
      </DocCard>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b">
            {headers.map(h => (
              <th key={h} className="text-left font-mono font-bold py-1.5 pr-2 text-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-1.5 pr-2 font-mono text-primary">{row[0]}</td>
              <td className="py-1.5 text-muted-foreground">{row[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
