export function generateDocMarkdown(): string {
  return `# AntiBipolaridade v2.0 — Documentação Completa

> Sistema pessoal de produtividade, saúde e bem-estar projetado para pessoas que precisam de estrutura adaptativa no dia a dia.

---

## Sumário

1. [Guia do Usuário](#guia-do-usuário)
2. [Funcionalidades](#funcionalidades)
3. [Lógica de Funcionamento](#lógica-de-funcionamento)
4. [Tecnologias](#tecnologias)
5. [Requisitos do Sistema](#requisitos-do-sistema)
6. [Exemplos Práticos](#exemplos-práticos)

---

## Guia do Usuário

### Primeiros Passos

O AntiBipolaridade é um sistema pessoal de produtividade, saúde e bem-estar projetado para pessoas que precisam de estrutura adaptativa no dia a dia.

1. **Crie sua conta** — Acesse a tela de login e crie uma conta com email e senha. Confirme seu email para ativar.
2. **Complete o Onboarding** — Ao entrar pela primeira vez, cada módulo pedirá informações básicas: saúde, trabalho, casa e financeiro.
3. **Defina seu Estado de Energia** — A cada sessão, selecione seu estado: Foco Total, Modo Leve ou Básico. Isso define quais tarefas serão sugeridas.
4. **Instale como PWA** — No navegador, clique em "Adicionar à tela inicial" para usar como app. Funciona offline e com notificações.

### Rotina Diária Recomendada

1. **Manhã — Check-in** — Abra o app, defina seu estado de energia. Veja as tarefas sugeridas para o dia e os eventos do calendário.
2. **A cada 3h — Check-in Emocional** — O app sugere um check-in de humor. Isso ajusta automaticamente as tarefas visíveis.
3. **Ao longo do dia — Registre progresso** — Marque tarefas como concluídas. Novas tarefas aparecem progressivamente conforme seu ritmo.
4. **Noite — Análise automática** — A IA analisa seu dia: o que foi feito, o que ficou pendente, e ajusta sugestões futuras.

### Regras Especiais de Acesso

- **Segunda-feira:** O app só libera o acesso completo após você revisar suas metas semanais no painel de Revisão de Metas.
- **Sexta-feira:** O acesso completo só é liberado após preencher o Relatório Semanal com destaques, dificuldades e reflexões.
- **Demais dias:** Acesso livre e sem restrições.

---

## Funcionalidades

### Visão Central (Meu Dia)

- **Kanban Unificado:** Todas as tarefas de trabalho, casa e saúde em um único quadro com colunas Hoje, Em Andamento, Aguardando e Backlog.
- **Organização Objetiva:** Ao trocar a aba de contexto (Trabalho/Casa/Saúde), o Kanban já abre filtrado no módulo correspondente e ordena por urgência + prazo.
- **Revelação Progressiva:** As tarefas aparecem gradualmente conforme seu estado de energia e humor atual.
- **Quick Capture:** Campo de captura rápida para adicionar tarefas por texto livre.
- **Dashboard Único:** Métricas consolidadas — tarefas feitas, pendentes, taxa de conclusão e trackers — em um só painel.
- **Eventos do Dia:** Exibe reuniões e compromissos do calendário para hoje.

### Módulo Saúde (Bem-Estar)

- **Medicamentos:** Controle de horários e estoque com alertas automáticos.
- **Exercícios:** Registro de atividades físicas com tipo, duração e intensidade.
- **Refeições:** Acompanhamento de qualidade alimentar e refeições puladas.
- **Sono:** Registro de qualidade e duração do sono.
- **Peso:** Acompanhamento de peso com histórico e gráficos.
- **Check-in Emocional:** Registro de humor a cada 3 horas com escala de 5 níveis.

### Módulo Trabalho

- **Contexto de Clientes:** Clientes ativos com valor mensal e tarefas vinculadas.
- **Pomodoro:** Timer de 25 minutos integrado às tarefas do dia.
- **Classificação IA:** Novas tarefas são automaticamente classificadas por tipo, impacto, urgência e estado ideal.
- **Subtarefas:** Tarefas podem ter sub-tarefas vinculadas.

### Módulo Casa

- **Tarefas por Cômodo:** Organização de tarefas domésticas por área da casa com frequência configurável.
- **Lista de Compras:** Lista categorizada (mercado, farmácia, casa) com itens pendentes e comprados.
- **Seeding Inteligente:** Plano de organização base gerado automaticamente com base no perfil do usuário.
- **Reset Diário às 8h:** As tarefas são resetadas diariamente às 8h da manhã (horário de Brasília), sem acúmulo de pendências.

### Módulo Financeiro

- **Lançamentos:** Registro de entradas e saídas com cálculo automático de saldo.
- **Tags:** Categorização por tags com emoji e cor para análise de gastos.
- **Consolidação Mensal:** Resumo automático com total de entradas, saídas e performance.
- **Carteira Digital:** Armazenamento seguro de documentos e dados importantes.

### Notificações

- **Medicamentos:** Alertas nos horários programados para cada medicamento.
- **Tarefas Pendentes:** Lembretes às 10h e 14h sobre tarefas atrasadas.
- **Check-in Emocional:** Convites a cada 3 horas para registrar seu humor.
- **Eventos:** Alertas antes de reuniões e compromissos do calendário.

### Metas Pessoais

- **Definição de Metas:** Crie metas de curto (1 mês), médio (6 meses) e longo prazo (1 ano).
- **Acompanhamento:** Barra de progresso com notas de evolução.
- **Revisão Semanal:** Obrigatória às segundas-feiras antes de acessar o app.

---

## Lógica de Funcionamento

### Fluxo Principal do App

\`\`\`
Login → Onboarding (se novo) → DayGate check
├── Segunda? → Revisar Metas → Libera app
├── Sexta? → Relatório Semanal → Libera app
└── Outro dia → Acesso direto

Dentro do app:
Selecionar Estado de Energia → Kanban Unificado
→ Dashboard Único + Trackers
→ Tabs de contexto (Trabalho/Casa/Saúde/Metas)
→ Check-in emocional (3h) → Ajuste de tarefas
→ Completar tarefas → Análise IA fim do dia
\`\`\`

### Lógica da IA

- **Revelação Progressiva:** O número de tarefas visíveis é calculado por: \`base(3-5) + ajusteHumor(-2 a +2)\`. Humor baixo reduz tarefas, humor alto libera mais.
- **Análise Diária:** Ao final do dia, a IA recebe: tarefas do dia + humor registrado + sono + exercícios. Gera um resumo de 3 frases e sugestões para o dia seguinte.
- **Memória:** Resumos são salvos em \`log_consolidado\`. A cada 100 ações no activity_log, um resumo consolidado é gerado para manter a memória de longo prazo.
- **Classificação de Tarefas:** Novas tarefas passam por uma função backend que classifica automaticamente: módulo, tipo, impacto, urgência e estado ideal.

### Sistema de Estados de Energia

| Estado | Descrição |
|--------|-----------|
| 🔴 **Foco Total** | Tarefas estratégicas e de alto impacto. Exige concentração máxima. |
| 🟡 **Modo Leve** | Tarefas operacionais e administrativas. Ritmo moderado. |
| 🟢 **Básico** | Apenas tarefas simples e domésticas. Dia de manutenção. |

### Ciclo de Dados

1. **Entrada:** Cada ação do usuário gera um registro no activity_log com ação, contexto e detalhes.
2. **Processamento:** Funções backend analisam os dados em tempo real (classificação, nudges diários).
3. **Consolidação:** A cada 100 logs ou ao final do dia, resumos são gerados pela IA.
4. **Dashboard:** Os dashboards consultam dados consolidados e brutos para exibir métricas atualizadas.
5. **Feedback:** Os resumos alimentam as próximas sugestões da IA, criando um ciclo adaptativo.

### Lógica de Notificações

- **Deduplicação:** Cada notificação tem um tag único por tipo + horário. Se já foi enviada na sessão, não repete.
- **Prioridade:** Medicamentos > Eventos > Check-in Emocional > Tarefas pendentes.
- **Frequência controlada:** Máximo de 5 notificações por dia para evitar fadiga de alertas.

### Sistema de Logs

- **Armazenamento em lotes:** Os logs são consolidados em lotes de 100 entradas.
- **Download disponível:** Ao atingir 1000 logs totais, é possível fazer o download completo do histórico em formato JSON.
- **Contexto da IA:** Os últimos 100 logs permanecem sempre ativos para que a IA tenha contexto atualizado sobre as atividades.

---

## Tecnologias

### Stack Frontend

| Tecnologia | Descrição |
|------------|-----------|
| React 18 | Biblioteca de UI |
| TypeScript | Tipagem estática |
| Vite | Build tool e dev server |
| Tailwind CSS | Framework de estilos |
| React Router | Navegação SPA |
| TanStack Query | Gerenciamento de dados |
| Recharts | Gráficos e visualizações |
| Lucide React | Ícones |
| shadcn/ui | Componentes de UI |
| Framer Motion | Animações |

### Stack Backend (Lovable Cloud)

| Tecnologia | Descrição |
|------------|-----------|
| PostgreSQL | Banco de dados relacional |
| Edge Functions | Funções serverless (Deno) |
| Row Level Security | Segurança por linha |
| Realtime | Atualizações em tempo real |
| Auth | Autenticação integrada |
| Storage | Armazenamento de arquivos |

### Inteligência Artificial

- **Modelo:** Configurável pelo usuário via chave de API nas Configurações.
- **Uso:** Classificação de tarefas, análise diária, nudges personalizados, consolidação de logs e geração de insights semanais.
- **Privacidade:** Os dados são processados em funções backend seguras. Nenhum dado é compartilhado com terceiros.

### PWA (Progressive Web App)

- **Instalável:** Pode ser adicionado à tela inicial em iOS e Android.
- **Offline:** Funciona sem internet para visualização de dados em cache.
- **Notificações:** Push notifications via Web Notification API (iOS 16.4+).
- **Service Worker:** Workbox com estratégia NetworkFirst para API e cache para assets.

### Segurança

- **Autenticação:** Login com email/senha com confirmação de email obrigatória.
- **RLS:** Todas as tabelas possuem Row Level Security ativo — cada usuário só acessa seus próprios dados.
- **Secrets:** Chaves de API armazenadas como secrets do servidor, nunca expostas ao cliente.

---

## Requisitos do Sistema

### Navegadores Suportados

| Navegador | Versão Mínima |
|-----------|---------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 15+ (iOS 16.4+ para notificações) |
| Edge | 90+ |

### Requisitos de Rede

- Conexão com internet para sincronização de dados
- Funciona offline para visualização de dados em cache após primeiro carregamento

### Dispositivos

- **Desktop:** Qualquer computador com navegador moderno
- **Mobile:** iPhone (iOS 15+), Android (Chrome 90+)
- **Tablet:** iPad, tablets Android com navegadores suportados

### Instalação como PWA

1. Abra o app no navegador do dispositivo
2. No Chrome: Menu (⋮) → "Adicionar à tela inicial"
3. No Safari (iOS): Compartilhar (↑) → "Adicionar à Tela de Início"
4. O app aparecerá como ícone na tela inicial

---

## Exemplos Práticos

### Exemplo 1: Dia Típico de Trabalho

\`\`\`
08:00 — Abro o app, seleciono "Foco Total"
08:05 — Vejo 5 tarefas estratégicas no Kanban
08:10 — Inicio Pomodoro na tarefa principal
08:35 — Concluo primeiro ciclo, marco tarefa como feita
11:00 — Check-in emocional: "Bem" (4/5)
11:05 — App libera mais 2 tarefas operacionais
14:00 — Notificação: 2 tarefas pendentes
14:05 — Mudo para "Modo Leve", tarefas se reorganizam
17:00 — IA gera resumo do dia: "3/5 tarefas concluídas, foco mantido pela manhã"
\`\`\`

### Exemplo 2: Dia de Baixa Energia

\`\`\`
09:00 — Abro o app, seleciono "Básico"
09:05 — Vejo apenas 3 tarefas simples (domésticas)
10:00 — Check-in emocional: "Cansado" (2/5)
10:05 — App reduz para 2 tarefas visíveis
12:00 — Concluo 1 tarefa, marco como feita
15:00 — Check-in: "Melhorando" (3/5)
15:05 — App libera 1 tarefa adicional
18:00 — IA gera resumo: "Dia leve, 1 tarefa concluída. Descanso priorizado."
\`\`\`

### Exemplo 3: Segunda-feira (Revisão de Metas)

\`\`\`
08:00 — Abro o app → Tela de Revisão de Metas aparece
08:05 — Reviso meta "Exercitar 3x/semana": progresso 66%
08:10 — Atualizo nota: "Consegui 2x na semana passada"
08:15 — Reviso meta "Reduzir gastos": progresso 80%
08:20 — Confirmo revisão → App libera acesso completo
08:25 — Sigo rotina normal do dia
\`\`\`

### Exemplo 4: Sexta-feira (Relatório Semanal)

\`\`\`
17:00 — Abro o app → Tela de Relatório Semanal
17:05 — Preencho destaques: "Finalizei projeto X"
17:10 — Preencho dificuldades: "Sono irregular"
17:15 — Reflexão: "Preciso manter rotina de sono"
17:20 — Dou nota 7/10 para a semana
17:25 — Envio relatório → App libera acesso completo
\`\`\`

### Exemplo 5: Controle de Medicamentos

\`\`\`
07:00 — Notificação: "Tomar Medicamento A (manhã)"
07:05 — Abro o app, marco como tomado
12:00 — Notificação: "Tomar Medicamento B (almoço)"
12:10 — Marco como tomado
19:00 — Notificação: "Tomar Medicamento A (noite)"
19:05 — Marco como tomado
       — App mostra: "Estoque: 15 unidades restantes"
       — Alerta: "Repor em 5 dias"
\`\`\`

---

*Documento gerado automaticamente pelo AntiBipolaridade v2.0*
*Data de geração: ${new Date().toLocaleDateString("pt-BR")}*
`;
}

export function downloadDocMarkdown() {
  const content = generateDocMarkdown();
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "AntiBipolaridade-Documentacao-Completa.md";
  a.click();
  URL.revokeObjectURL(url);
}
