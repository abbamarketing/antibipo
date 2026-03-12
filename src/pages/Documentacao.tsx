import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Cpu, GitBranch, Layers, Smartphone, Brain, Calendar, Heart, Home, Briefcase, DollarSign, Bell, Shield, BarChart3, Download } from "lucide-react";
import { useState } from "react";
import { downloadDocMarkdown } from "@/lib/doc-markdown";

type Section = "guia" | "funcionalidades" | "logica" | "tecnologias";

export default function Documentacao() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<Section>("guia");

  const toggle = (s: Section) => setOpen(prev => prev === s ? s : s);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <header className="flex items-center gap-2 mb-6">
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
        </header>

        {/* Navigation pills */}
        <nav className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {([
            { id: "guia" as Section, label: "Guia do Usuário", icon: Smartphone },
            { id: "funcionalidades" as Section, label: "Funcionalidades", icon: Layers },
            { id: "logica" as Section, label: "Lógica", icon: GitBranch },
            { id: "tecnologias" as Section, label: "Tecnologias", icon: Cpu },
          ]).map(s => (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] whitespace-nowrap transition-colors ${
                open === s.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <s.icon className="w-3 h-3" />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        {open === "guia" && <GuiaUsuario />}
        {open === "funcionalidades" && <Funcionalidades />}
        {open === "logica" && <LogicaFuncionamento />}
        {open === "tecnologias" && <Tecnologias />}

        <p className="text-center font-mono text-[9px] text-muted-foreground/30 mt-8">AntiBipolaridade v2.0 — Documentação</p>
      </div>
    </div>
  );
}

/* ─── Shared components ─── */
function DocCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-lg border p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="font-mono text-xs font-semibold tracking-wider uppercase">{title}</h2>
      </div>
      <div className="space-y-2 font-body text-xs text-foreground/80 leading-relaxed">{children}</div>
    </section>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3 py-1.5">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-mono text-[10px] flex items-center justify-center font-bold">{n}</span>
      <div>
        <p className="font-mono text-[11px] font-medium text-foreground">{title}</p>
        <p className="text-muted-foreground text-[10px] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Sections ─── */
function GuiaUsuario() {
  return (
    <div>
      <DocCard icon={Smartphone} title="Primeiros Passos">
        <p>O AntiBipolaridade é um sistema pessoal de produtividade, saúde e bem-estar projetado para pessoas que precisam de estrutura adaptativa no dia a dia.</p>
        <Step n={1} title="Crie sua conta" desc="Acesse a tela de login e crie uma conta com email e senha. Confirme seu email para ativar." />
        <Step n={2} title="Complete o Onboarding" desc="Ao entrar pela primeira vez, cada módulo pedirá informações básicas: saúde, trabalho, casa e financeiro." />
        <Step n={3} title="Defina seu Estado de Energia" desc="A cada sessão, selecione seu estado: Foco Total, Modo Leve ou Básico. Isso define quais tarefas serão sugeridas." />
        <Step n={4} title="Instale como PWA" desc="No navegador, clique em 'Adicionar à tela inicial' para usar como app. Funciona offline e com notificações." />
      </DocCard>

      <DocCard icon={Calendar} title="Rotina Diária Recomendada">
        <Step n={1} title="Manhã — Check-in" desc="Abra o app, defina seu estado de energia. Veja as tarefas sugeridas para o dia e os eventos do calendário." />
        <Step n={2} title="A cada 3h — Check-in Emocional" desc="O app sugere um check-in de humor. Isso ajusta automaticamente as tarefas visíveis." />
        <Step n={3} title="Ao longo do dia — Registre progresso" desc="Marque tarefas como concluídas. Novas tarefas aparecem progressivamente conforme seu ritmo." />
        <Step n={4} title="Noite — Análise automática" desc="A IA analisa seu dia: o que foi feito, o que ficou pendente, e ajusta sugestões futuras." />
      </DocCard>

      <DocCard icon={Shield} title="Regras Especiais de Acesso">
        <p><strong>Segunda-feira:</strong> O app só libera o acesso completo após você revisar suas metas semanais no painel de Revisão de Metas.</p>
        <p><strong>Sexta-feira:</strong> O acesso completo só é liberado após preencher o Relatório Semanal com destaques, dificuldades e reflexões.</p>
        <p>Nos demais dias, o acesso é livre e sem restrições.</p>
      </DocCard>
    </div>
  );
}

function Funcionalidades() {
  return (
    <div>
      <DocCard icon={Home} title="Visão Central (Meu Dia)">
        <p><strong>Kanban Unificado:</strong> Todas as tarefas de trabalho, casa e saúde em um único quadro com colunas Hoje, Em Andamento, Aguardando e Backlog.</p>
        <p><strong>Organização Objetiva:</strong> Ao trocar a aba de contexto (Trabalho/Casa/Saúde), o Kanban já abre filtrado no módulo correspondente e ordena por urgência + prazo.</p>
        <p><strong>Revelação Progressiva:</strong> As tarefas aparecem gradualmente conforme seu estado de energia e humor atual.</p>
        <p><strong>Quick Capture:</strong> Campo de captura rápida para adicionar tarefas por texto livre.</p>
        <p><strong>Dashboard Único:</strong> Métricas consolidadas — tarefas feitas, pendentes, taxa de conclusão e trackers — em um só painel.</p>
        <p><strong>Eventos do Dia:</strong> Exibe reuniões e compromissos do calendário para hoje.</p>
      </DocCard>

      <DocCard icon={Heart} title="Módulo Saúde (Bem-Estar)">
        <p><strong>Medicamentos:</strong> Controle de horários e estoque com alertas automáticos.</p>
        <p><strong>Exercícios:</strong> Registro de atividades físicas com tipo, duração e intensidade.</p>
        <p><strong>Refeições:</strong> Acompanhamento de qualidade alimentar e refeições puladas.</p>
        <p><strong>Sono:</strong> Registro de qualidade e duração do sono.</p>
        <p><strong>Peso:</strong> Acompanhamento de peso com histórico e gráficos.</p>
        <p><strong>Check-in Emocional:</strong> Registro de humor a cada 3 horas com escala de 5 níveis.</p>
      </DocCard>

      <DocCard icon={Briefcase} title="Módulo Trabalho">
        <p><strong>Contexto de Clientes:</strong> Clientes ativos com valor mensal e tarefas vinculadas.</p>
        <p><strong>Pomodoro:</strong> Timer de 25 minutos integrado às tarefas do dia.</p>
        <p><strong>Classificação IA:</strong> Novas tarefas são automaticamente classificadas por tipo, impacto, urgência e estado ideal.</p>
        <p><strong>Subtarefas:</strong> Tarefas podem ter sub-tarefas vinculadas.</p>
      </DocCard>

      <DocCard icon={Home} title="Módulo Casa">
        <p><strong>Tarefas por Cômodo:</strong> Organização de tarefas domésticas por área da casa com frequência configurável.</p>
        <p><strong>Lista de Compras:</strong> Lista categorizada (mercado, farmácia, casa) com itens pendentes e comprados.</p>
        <p><strong>Seeding Inteligente:</strong> Plano de organização base gerado automaticamente com base no perfil do usuário.</p>
      </DocCard>

      <DocCard icon={DollarSign} title="Módulo Financeiro">
        <p><strong>Lançamentos:</strong> Registro de entradas e saídas com cálculo automático de saldo.</p>
        <p><strong>Tags:</strong> Categorização por tags com emoji e cor para análise de gastos.</p>
        <p><strong>Consolidação Mensal:</strong> Resumo automático com total de entradas, saídas e performance.</p>
        <p><strong>Carteira Digital:</strong> Armazenamento seguro de documentos e dados importantes.</p>
      </DocCard>

      <DocCard icon={Bell} title="Notificações">
        <p><strong>Medicamentos:</strong> Alertas nos horários programados para cada medicamento.</p>
        <p><strong>Tarefas Pendentes:</strong> Lembretes às 10h e 14h sobre tarefas atrasadas.</p>
        <p><strong>Check-in Emocional:</strong> Convites a cada 3 horas para registrar seu humor.</p>
        <p><strong>Eventos:</strong> Alertas antes de reuniões e compromissos do calendário.</p>
      </DocCard>

      <DocCard icon={Brain} title="Metas Pessoais">
        <p><strong>Definição de Metas:</strong> Crie metas de curto (1 mês), médio (6 meses) e longo prazo (1 ano).</p>
        <p><strong>Acompanhamento:</strong> Barra de progresso com notas de evolução.</p>
        <p><strong>Revisão Semanal:</strong> Obrigatória às segundas-feiras antes de acessar o app.</p>
      </DocCard>
    </div>
  );
}

function LogicaFuncionamento() {
  return (
    <div>
      <DocCard icon={GitBranch} title="Fluxo Principal do App">
        <div className="bg-secondary/50 rounded-md p-3 font-mono text-[9px] text-muted-foreground space-y-1">
          <p>Login → Onboarding (se novo) → DayGate check</p>
          <p>├── Segunda? → Revisar Metas → Libera app</p>
          <p>├── Sexta? → Relatório Semanal → Libera app</p>
          <p>└── Outro dia → Acesso direto</p>
          <p className="mt-2">Dentro do app:</p>
          <p>Selecionar Estado de Energia → Kanban Unificado</p>
          <p>→ Dashboard Único + Trackers</p>
          <p>→ Tabs de contexto (Trabalho/Casa/Saúde/Metas)</p>
          <p>→ Check-in emocional (3h) → Ajuste de tarefas</p>
          <p>→ Completar tarefas → Análise IA fim do dia</p>
        </div>
      </DocCard>

      <DocCard icon={Brain} title="Lógica da IA">
        <p><strong>Revelação Progressiva:</strong> O número de tarefas visíveis é calculado por: <code className="bg-secondary px-1 py-0.5 rounded text-[10px]">base(3-5) + ajusteHumor(-2 a +2)</code>. Humor baixo reduz tarefas, humor alto libera mais.</p>
        <p><strong>Análise Diária:</strong> Ao final do dia, a IA (Gemini) recebe: tarefas do dia + humor registrado + sono + exercícios. Gera um resumo de 3 frases e sugestões para o dia seguinte.</p>
        <p><strong>Memória:</strong> Resumos são salvos em <code className="bg-secondary px-1 py-0.5 rounded text-[10px]">log_consolidado</code>. A cada 100 ações no activity_log, um resumo consolidado é gerado para manter a memória de longo prazo.</p>
        <p><strong>Classificação de Tarefas:</strong> Novas tarefas passam por uma edge function que classifica automaticamente: módulo, tipo, impacto, urgência e estado ideal.</p>
      </DocCard>

      <DocCard icon={Shield} title="Sistema de Estados de Energia">
        <div className="space-y-2">
          <div className="bg-secondary/50 rounded-md p-2">
            <p className="font-mono text-[10px] font-bold text-primary">🔴 Foco Total</p>
            <p className="text-[10px] text-muted-foreground">Tarefas estratégicas e de alto impacto. Exige concentração máxima.</p>
          </div>
          <div className="bg-secondary/50 rounded-md p-2">
            <p className="font-mono text-[10px] font-bold text-primary">🟡 Modo Leve</p>
            <p className="text-[10px] text-muted-foreground">Tarefas operacionais e administrativas. Ritmo moderado.</p>
          </div>
          <div className="bg-secondary/50 rounded-md p-2">
            <p className="font-mono text-[10px] font-bold text-primary">🟢 Básico</p>
            <p className="text-[10px] text-muted-foreground">Apenas tarefas simples e domésticas. Dia de manutenção.</p>
          </div>
        </div>
      </DocCard>

      <DocCard icon={BarChart3} title="Ciclo de Dados">
        <p><strong>1. Entrada:</strong> Cada ação do usuário gera um registro no activity_log com ação, contexto e detalhes.</p>
        <p><strong>2. Processamento:</strong> Edge functions analisam os dados em tempo real (classificação, nudges diários).</p>
        <p><strong>3. Consolidação:</strong> A cada 100 logs ou ao final do dia, resumos são gerados pela IA.</p>
        <p><strong>4. Dashboard:</strong> Os dashboards consultam dados consolidados e brutos para exibir métricas atualizadas.</p>
        <p><strong>5. Feedback:</strong> Os resumos alimentam as próximas sugestões da IA, criando um ciclo adaptativo.</p>
      </DocCard>

      <DocCard icon={Bell} title="Lógica de Notificações">
        <p><strong>Deduplicação:</strong> Cada notificação tem um tag único por tipo + horário. Se já foi enviada na sessão, não repete.</p>
        <p><strong>Prioridade:</strong> Medicamentos {'>'} Eventos {'>'} Check-in Emocional {'>'} Tarefas pendentes.</p>
        <p><strong>Frequência controlada:</strong> Máximo de 5 notificações por dia para evitar fadiga de alertas.</p>
      </DocCard>
    </div>
  );
}

function Tecnologias() {
  return (
    <div>
      <DocCard icon={Cpu} title="Stack Frontend">
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "React 18", desc: "Biblioteca de UI" },
            { name: "TypeScript", desc: "Tipagem estática" },
            { name: "Vite", desc: "Build tool e dev server" },
            { name: "Tailwind CSS", desc: "Framework de estilos" },
            { name: "React Router", desc: "Navegação SPA" },
            { name: "TanStack Query", desc: "Gerenciamento de dados" },
            { name: "Recharts", desc: "Gráficos e visualizações" },
            { name: "Lucide React", desc: "Ícones" },
            { name: "shadcn/ui", desc: "Componentes de UI" },
            { name: "Framer Motion", desc: "Animações" },
          ].map(t => (
            <div key={t.name} className="bg-secondary/50 rounded-md p-2">
              <p className="font-mono text-[10px] font-bold text-foreground">{t.name}</p>
              <p className="text-[9px] text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </DocCard>

      <DocCard icon={Layers} title="Stack Backend (Lovable Cloud)">
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "PostgreSQL", desc: "Banco de dados relacional" },
            { name: "Edge Functions", desc: "Funções serverless (Deno)" },
            { name: "Row Level Security", desc: "Segurança por linha" },
            { name: "Realtime", desc: "Atualizações em tempo real" },
            { name: "Auth", desc: "Autenticação integrada" },
            { name: "Storage", desc: "Armazenamento de arquivos" },
          ].map(t => (
            <div key={t.name} className="bg-secondary/50 rounded-md p-2">
              <p className="font-mono text-[10px] font-bold text-foreground">{t.name}</p>
              <p className="text-[9px] text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </DocCard>

      <DocCard icon={Brain} title="Inteligência Artificial">
        <p><strong>Modelo:</strong> Configurável pelo usuário via chave de API nas Configurações.</p>
        <p><strong>Uso:</strong> Classificação de tarefas, análise diária, nudges personalizados, consolidação de logs e geração de insights semanais.</p>
        <p><strong>Privacidade:</strong> Os dados são processados em funções backend seguras. Nenhum dado é compartilhado com terceiros.</p>
      </DocCard>

      <DocCard icon={Smartphone} title="PWA (Progressive Web App)">
        <p><strong>Instalável:</strong> Pode ser adicionado à tela inicial em iOS e Android.</p>
        <p><strong>Offline:</strong> Funciona sem internet para visualização de dados em cache.</p>
        <p><strong>Notificações:</strong> Push notifications via Web Notification API (iOS 16.4+).</p>
        <p><strong>Service Worker:</strong> Workbox com estratégia NetworkFirst para API e cache para assets.</p>
      </DocCard>

      <DocCard icon={Shield} title="Segurança">
        <p><strong>Autenticação:</strong> Login com email/senha com confirmação de email obrigatória.</p>
        <p><strong>RLS:</strong> Todas as tabelas possuem Row Level Security ativo — cada usuário só acessa seus próprios dados.</p>
        <p><strong>Secrets:</strong> Chaves de API armazenadas como secrets do servidor, nunca expostas ao cliente.</p>
      </DocCard>
    </div>
  );
}
