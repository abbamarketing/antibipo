import { DocCard, Step } from "./shared";
import { Home, Heart, Briefcase, DollarSign, Bell, Brain, Layers, BarChart3, Mic, Cloud, Target, Calendar, Shield, Sparkles } from "lucide-react";

export function DocFuncionalidades() {
  return (
    <div>
      <h1 className="font-mono text-base font-bold tracking-wider mb-4">5. Guia do Usuário — Funcionalidades</h1>

      {/* ── Tela Inicial ── */}
      <DocCard icon={Home} title="Tela Inicial (Meu Dia)">
        <p>A tela inicial é seu ponto de partida diário. Ela apresenta:</p>
        <ul className="list-disc pl-4 space-y-1 mt-2">
          <li><strong>Data e clima:</strong> No topo, a data atual com uma faixa de previsão de 7 dias. Dias com chuva ficam destacados em ciano.</li>
          <li><strong>DailyNudge:</strong> Uma mensagem personalizada da IA baseada no que você fez ontem — tarefas concluídas, humor registrado, etc.</li>
          <li><strong>DayScore:</strong> Um medidor circular (0–100) que resume seu dia considerando humor, sono, medicação, exercícios e tarefas.</li>
          <li><strong>QuickOverview:</strong> Visão rápida com o item mais urgente de cada módulo.</li>
          <li><strong>Indicadores:</strong> Humor, remédios, sono e exercício — tudo visível de relance.</li>
        </ul>
      </DocCard>

      {/* ── Captura por Voz ── */}
      <DocCard icon={Mic} title="🎤 Captura por Voz (Quick Capture)">
        <p>O ícone de microfone na tela inicial permite criar tarefas usando apenas sua voz, sem precisar digitar.</p>

        <p className="font-mono text-[10px] font-bold text-foreground mt-3 mb-1">Como funciona</p>
        <Step n={1} title="Localize o ícone" desc="Na área do DailyNudge (abaixo da saudação), há um botão com ícone de microfone 🎤 no canto direito." />
        <Step n={2} title="Toque no microfone" desc="O botão ficará pulsando em vermelho, indicando que está ouvindo. O texto 'Ouvindo...' aparecerá." />
        <Step n={3} title="Fale sua tarefa" desc='Diga algo como "Comprar remédio na farmácia" ou "Ligar para o dentista amanhã".' />
        <Step n={4} title="Tarefa criada" desc="Ao terminar de falar, o sistema transcreve o áudio e salva automaticamente como tarefa no Backlog." />

        <div className="bg-secondary/50 rounded-md p-2.5 mt-3">
          <p className="font-mono text-[9px] text-muted-foreground">
            <strong>Dicas:</strong> A captura funciona em português (pt-BR). Fale de forma clara e natural. 
            A tarefa será classificada automaticamente pela IA (módulo, urgência, tipo). 
            A urgência é ajustada conforme seu estado de energia: em "Básico", a urgência padrão é 1 (baixa).
          </p>
        </div>

        <div className="bg-destructive/10 rounded-md p-2.5 mt-2">
          <p className="font-mono text-[9px] text-destructive">
            <strong>Requisitos:</strong> Seu navegador precisa suportar a Web Speech API (Chrome, Edge, Safari). 
            Ao usar pela primeira vez, o navegador pedirá permissão para acessar o microfone — conceda para que funcione.
          </p>
        </div>
      </DocCard>

      {/* ── Kanban ── */}
      <DocCard icon={Layers} title="Kanban Unificado (Meu Dia)">
        <p>O coração do gerenciamento de tarefas. Todas as tarefas de todos os módulos em um único quadro.</p>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {[
            { col: "Hoje", desc: "Tarefas planejadas para hoje, limitadas pelo seu estado" },
            { col: "Em Andamento", desc: "Tarefas que você está executando agora" },
            { col: "Aguardando", desc: "Tarefas que dependem de outra pessoa" },
            { col: "Backlog", desc: "Tarefas futuras, sem prazo imediato" },
          ].map(c => (
            <div key={c.col} className="bg-secondary/50 rounded-md p-2">
              <p className="font-mono text-[10px] font-bold text-foreground">{c.col}</p>
              <p className="text-[9px] text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-2"><strong>Filtros:</strong> Trabalho, Casa, Saúde — filtre por módulo. Ordenação automática por urgência + prazo.</p>
        <p><strong>Promoção Inteligente:</strong> Tarefas vencidas sobem automaticamente para "Hoje". Tarefas de amanhã aparecem se seu humor for bom.</p>
        <p><strong>Visão Adaptativa:</strong> Em estado de baixa energia, apenas a tarefa mais importante é exibida, com um contador de fila (ex: "Tarefa 1 de 4").</p>
      </DocCard>

      {/* ── Quick Capture texto ── */}
      <DocCard icon={Layers} title="Quick Capture (Texto)">
        <p>Além da voz, você pode criar tarefas pelo botão flutuante (+) no canto inferior direito.</p>
        <Step n={1} title="Toque no botão +" desc="O botão laranja flutuante abre o formulário de criação." />
        <Step n={2} title="Preencha os campos" desc="Título, módulo, urgência, prazo e notas. A IA pode classificar automaticamente." />
        <Step n={3} title="Salve" desc="A tarefa vai para o Backlog e pode ser promovida para 'Hoje'." />
        <div className="bg-secondary/50 rounded-md p-2 mt-2">
          <p className="font-mono text-[9px] text-muted-foreground">
            <strong>Exemplo:</strong> "Ligar para o dentista amanhã" → módulo: saúde, tipo: operacional, urgência: 3
          </p>
        </div>
      </DocCard>

      {/* ── DayScore ── */}
      <DocCard icon={BarChart3} title="DayScore (Medidor do Dia)">
        <p>Um score de 0 a 100 calculado automaticamente com base em:</p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li><strong>Humor:</strong> Seu check-in emocional mais recente</li>
          <li><strong>Sono:</strong> Qualidade e duração registradas</li>
          <li><strong>Medicação:</strong> Porcentagem de doses tomadas no horário</li>
          <li><strong>Exercício:</strong> Se fez atividade física hoje</li>
          <li><strong>Tarefas:</strong> Quantas concluiu em relação ao planejado</li>
        </ul>
        <div className="grid grid-cols-4 gap-1 mt-2">
          {[
            { level: "Crise", range: "0-29", color: "text-destructive" },
            { level: "Atenção", range: "30-49", color: "text-amber-500" },
            { level: "Estável", range: "50-74", color: "text-primary" },
            { level: "Ótimo", range: "75-100", color: "text-green-500" },
          ].map(l => (
            <div key={l.level} className="bg-secondary/50 rounded-md p-1.5 text-center">
              <p className={`font-mono text-[10px] font-bold ${l.color}`}>{l.level}</p>
              <p className="text-[9px] text-muted-foreground">{l.range}</p>
            </div>
          ))}
        </div>
        <p className="mt-2">Toque no medidor para expandir e ver sugestões personalizadas, tarefas pendentes e atrasadas.</p>
      </DocCard>

      {/* ── Clima ── */}
      <DocCard icon={Cloud} title="Previsão do Tempo">
        <p>A faixa de clima abaixo da data mostra a previsão de 7 dias:</p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li>Ícone de condição (sol, nuvem, chuva, etc.)</li>
          <li>Temperatura máxima de cada dia</li>
          <li><strong>Dias com chuva:</strong> Destacados em ciano com probabilidade de precipitação</li>
          <li>"Hoje" aparece em destaque com fundo diferenciado</li>
        </ul>
        <p className="mt-1">No topo, ao lado da data, o ícone compacto mostra a condição e temperatura atuais.</p>
      </DocCard>

      {/* ── Estados de Energia ── */}
      <DocCard icon={Shield} title="Estados de Energia">
        <p>O sistema avalia seu estado de energia automaticamente com base no DayScore e humor registrado.</p>
        <div className="space-y-1.5 mt-2">
          {[
            { icon: "Zap", name: "Foco Total", desc: "Tarefas estratégicas e de alto impacto. Concentração máxima. Todos os módulos visíveis." },
            { icon: "Sun", name: "Modo Leve", desc: "Tarefas operacionais e administrativas. Ritmo moderado." },
            { icon: "Battery", name: "Só o Básico", desc: "Apenas tarefas simples. Metas e widgets extras são ocultados. Modo protegido ativo." },
          ].map(e => (
            <div key={e.name} className="bg-secondary/50 rounded-md p-2">
              <p className="font-mono text-[10px] font-bold text-foreground">{e.icon} {e.name}</p>
              <p className="text-[10px] text-muted-foreground">{e.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-2"><strong>Visão Adaptativa:</strong> Em "Só o Básico" ou humor negativo, o app oculta Metas, reduz opções do botão flutuante e mostra apenas 1 tarefa por vez.</p>
      </DocCard>

      {/* ── Saúde ── */}
      <DocCard icon={Heart} title="Módulo Saúde (Bem-Estar)">
        <p>Acesse pela aba "Saúde" na barra de navegação inferior.</p>
        {[
          { sub: "Medicamentos", desc: "Cadastre nome, dose e horários. O app envia alertas nos horários programados e rastreia se você tomou. Controle de estoque com aviso de reposição." },
          { sub: "Check-in Emocional", desc: "Registre seu humor numa escala de -2 a +2. Afeta diretamente quantas tarefas aparecem e quais módulos ficam visíveis." },
          { sub: "Sono", desc: "Registre quando dormiu e acordou. A duração é calculada automaticamente. Se o sono for < 6h, o DailyNudge sugere reduzir o ritmo." },
          { sub: "Exercícios", desc: "Registre tipo (caminhada, corrida, academia), duração e intensidade (1-5). Avaliação pós-exercício para monitorar impacto no bem-estar." },
          { sub: "Refeições", desc: "Registre cada refeição com qualidade (1-5) e categorias. Refeições puladas são rastreadas." },
          { sub: "Peso", desc: "Registro diário com gráfico histórico e cálculo de IMC automático." },
          { sub: "Dashboard Semanal", desc: "Gráficos de humor, sono, exercícios. Score de bem-estar e classificação semanal." },
        ].map(s => (
          <p key={s.sub} className="mb-1.5"><strong>{s.sub}:</strong> {s.desc}</p>
        ))}
      </DocCard>

      {/* ── Trabalho ── */}
      <DocCard icon={Briefcase} title="Módulo Trabalho">
        <p>Acesse pela aba "Trabalho" na navegação inferior.</p>
        <p className="mt-1"><strong>Clientes:</strong> Cadastre com nome, tipo, valor mensal, contato e status. Cada tarefa pode ser vinculada a um cliente.</p>
        <p><strong>Pomodoro:</strong> Timer de 25 minutos integrado às tarefas. Toque em "Pomodoro" no card da tarefa para iniciar.</p>
        <p><strong>Classificação IA:</strong> Novas tarefas são automaticamente classificadas (estratégica, operacional, delegável, administrativa).</p>
        <p><strong>Subtarefas:</strong> Crie tarefas filhas para detalhar trabalhos complexos.</p>
      </DocCard>

      {/* ── Casa ── */}
      <DocCard icon={Home} title="Módulo Casa">
        <p>Acesse pela aba "Casa" na navegação inferior.</p>
        <p className="mt-1"><strong>Tarefas por Cômodo:</strong> Organização por área (quarto, cozinha, banheiro) com frequência configurável (diário, semanal, mensal).</p>
        <p><strong>Reset às 8h:</strong> Tarefas diárias resetam automaticamente sem acumular atraso.</p>
        <p><strong>Lista de Compras:</strong> Categorizada (mercado, farmácia, casa) com checkbox para itens comprados.</p>
      </DocCard>

      {/* ── Financeiro ── */}
      <DocCard icon={DollarSign} title="Módulo Financeiro">
        <p>Acesse pelo ícone de carteira (💼) no cabeçalho.</p>
        <p className="mt-1"><strong>Lançamentos:</strong> Registre entradas e saídas. O saldo acumulado é calculado automaticamente.</p>
        <p><strong>Tags:</strong> Categorize com emoji + cor para análise visual (ex: 🍕 Alimentação, 🏠 Moradia).</p>
        <p><strong>Consolidação Mensal:</strong> Resumo automático com total de entradas, saídas e performance.</p>
        <p><strong>Carteira Digital:</strong> Armazene documentos e dados importantes.</p>
        <p><strong>Horizonte:</strong> Visão projetada do saldo futuro baseada nos padrões.</p>
      </DocCard>

      {/* ── Metas ── */}
      <DocCard icon={Target} title="Metas Pessoais">
        <p>Acesse pela aba "Metas" na navegação inferior (oculta em modo de baixa energia).</p>
        <div className="grid grid-cols-3 gap-1.5 mt-2 mb-2">
          {[
            { tipo: "Curto", prazo: "1 mês", cor: "text-green-500" },
            { tipo: "Médio", prazo: "6 meses", cor: "text-blue-500" },
            { tipo: "Longo", prazo: "1 ano", cor: "text-purple-500" },
          ].map(m => (
            <div key={m.tipo} className="bg-secondary/50 rounded-md p-2 text-center">
              <p className={`font-mono text-[10px] font-bold ${m.cor}`}>{m.tipo}</p>
              <p className="text-[9px] text-muted-foreground">{m.prazo}</p>
            </div>
          ))}
        </div>
        <p>Barra de progresso visual (0-100%), notas de evolução com histórico.</p>
        <p><strong>Revisão semanal:</strong> Às segundas, planeje ações. Às sextas, avalie o impacto nas metas.</p>
      </DocCard>

      {/* ── Calendário ── */}
      <DocCard icon={Calendar} title="Calendário">
        <p>Acesse pelo ícone de calendário (📅) no cabeçalho.</p>
        <p className="mt-1"><strong>Eventos:</strong> Crie reuniões com título, data, horário, local e participantes.</p>
        <p><strong>Lembretes:</strong> Configure lembretes em minutos antes do evento.</p>
        <p><strong>Eventos do Dia:</strong> Na tela inicial, os próximos eventos do dia aparecem automaticamente.</p>
      </DocCard>

      {/* ── Notificações ── */}
      <DocCard icon={Bell} title="Notificações Push">
        <p>O app envia notificações mesmo quando fechado (requer permissão do navegador).</p>
        <div className="space-y-1.5 mt-2 mb-2">
          {[
            { tipo: "Medicamentos", gatilho: "No horário programado de cada dose" },
            { tipo: "Check-in Emocional", gatilho: "A cada 3 horas durante o dia" },
            { tipo: "Tarefas Pendentes", gatilho: "Às 10h e 14h se houver tarefas para hoje" },
            { tipo: "Eventos", gatilho: "Conforme minutos configurados antes" },
          ].map(n => (
            <div key={n.tipo} className="flex justify-between bg-secondary/50 rounded-md p-2">
              <span className="font-mono text-[10px] font-bold text-foreground">{n.tipo}</span>
              <span className="text-[10px] text-muted-foreground">{n.gatilho}</span>
            </div>
          ))}
        </div>
        <Step n={1} title="Ative" desc="Vá em Configurações → Ativar Notificações" />
        <Step n={2} title="Permita" desc="Aceite a permissão do navegador quando solicitada" />
        <Step n={3} title="Pronto" desc="Você receberá alertas mesmo com o app em background" />
      </DocCard>

      {/* ── DailyNudge ── */}
      <DocCard icon={Sparkles} title="DailyNudge (Mensagem Inteligente)">
        <p>A mensagem logo abaixo da previsão do tempo é gerada por IA e analisa:</p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li>O que você fez ontem (tarefas, humor, diário)</li>
          <li>Se seu sono foi curto (alerta para reduzir ritmo)</li>
          <li>Se seu DayScore está subindo há 3 dias (alerta para manter estabilidade)</li>
        </ul>
        <p className="mt-2">Não é motivação genérica — é um relatório factual e personalizado do seu progresso real.</p>
      </DocCard>
    </div>
  );
}
