export type DocSection =
  | "visao-geral"
  | "arquitetura"
  | "banco-de-dados"
  | "fluxos"
  | "funcionalidades"
  | "pops"
  | "glossario";

export const DOC_SECTIONS: { id: DocSection; label: string }[] = [
  { id: "visao-geral", label: "Visão Geral" },
  { id: "arquitetura", label: "Arquitetura" },
  { id: "banco-de-dados", label: "Banco de Dados" },
  { id: "fluxos", label: "Fluxos de Usuário" },
  { id: "funcionalidades", label: "Funcionalidades" },
  { id: "pops", label: "POPs" },
  { id: "glossario", label: "Glossário" },
];

export function generateDocMarkdown(): string {
  return `# AntiBipolaridade v2.0 — Documentação Completa

> Sistema pessoal de produtividade, saúde e bem-estar projetado para pessoas com transtorno bipolar ou que precisam de estrutura adaptativa no dia a dia.

---

## Sumário

1. [Visão Geral do Aplicativo](#1-visão-geral-do-aplicativo)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Estrutura do Banco de Dados](#3-estrutura-do-banco-de-dados)
4. [Fluxos de Usuário](#4-fluxos-de-usuário)
5. [Funcionalidades Detalhadas](#5-funcionalidades-detalhadas)
6. [Procedimentos Operacionais Padrão (POPs)](#6-procedimentos-operacionais-padrão-pops)
7. [Glossário de Termos](#7-glossário-de-termos)

---

## 1. Visão Geral do Aplicativo

### 1.1 Propósito

O AntiBipolaridade é um sistema pessoal integrado que combina **produtividade**, **saúde**, **bem-estar** e **finanças** em uma única plataforma. Foi projetado especificamente para pessoas que vivem com transtorno bipolar ou que precisam de uma estrutura adaptativa que se ajuste ao seu estado emocional e energético ao longo do dia.

### 1.2 Problema que Resolve

Pessoas com transtorno bipolar enfrentam oscilações significativas de energia, humor e capacidade de concentração. Aplicativos tradicionais de produtividade não consideram essas variações, apresentando listas fixas de tarefas que podem ser esmagadoras em dias difíceis ou subutilizadas em dias de alta energia. O AntiBipolaridade resolve isso com:

- **Revelação progressiva** de tarefas baseada no humor e energia atual
- **Monitoramento contínuo** de indicadores de saúde (humor, sono, medicamentos, exercícios)
- **IA adaptativa** que aprende padrões e ajusta sugestões automaticamente
- **Estrutura sem rigidez** — o sistema se adapta ao usuário, não o contrário

### 1.3 Público-Alvo

- Pessoas diagnosticadas com transtorno bipolar (tipo I ou II)
- Pessoas com TDAH ou outros transtornos que afetam produtividade
- Qualquer pessoa que precise de um sistema adaptativo de organização pessoal

### 1.4 Princípios de Design

| Princípio | Descrição |
|-----------|-----------|
| **Adaptatividade** | O sistema se ajusta ao estado do usuário, não o contrário |
| **Não-julgamento** | Dias de baixa energia são válidos; o app nunca penaliza |
| **Revelação Progressiva** | Informações e tarefas aparecem gradualmente para evitar sobrecarga |
| **Memória Institucional** | A IA mantém contexto de longo prazo sobre padrões do usuário |
| **Privacidade Absoluta** | Dados de saúde mental nunca são compartilhados com terceiros |

### 1.5 Módulos do Sistema

O aplicativo é organizado em **5 módulos principais** que se integram entre si:

1. **Meu Dia (Home)** — Painel central unificado com Kanban, dashboard e eventos
2. **Saúde (Bem-Estar)** — Medicamentos, humor, sono, exercícios, refeições, peso
3. **Trabalho** — Tarefas profissionais, clientes, Pomodoro, classificação IA
4. **Casa** — Tarefas domésticas por cômodo, lista de compras
5. **Financeiro** — Lançamentos, tags, consolidação mensal, carteira digital

Módulos auxiliares:
- **Metas Pessoais** — Objetivos de curto, médio e longo prazo
- **Calendário** — Reuniões e eventos com lembretes
- **Configurações** — Perfil, preferências, dados

### 1.6 Requisitos do Sistema

#### Navegadores Suportados

| Navegador | Versão Mínima | Notificações Push |
|-----------|---------------|-------------------|
| Chrome | 90+ | ✅ Sim |
| Firefox | 88+ | ✅ Sim |
| Safari | 15+ | ✅ iOS 16.4+ |
| Edge | 90+ | ✅ Sim |

#### Dispositivos

- **Desktop:** Qualquer computador com navegador moderno
- **Mobile:** iPhone (iOS 15+), Android (Chrome 90+)
- **Tablet:** iPad, tablets Android com navegadores suportados

#### Rede

- Conexão com internet para sincronização de dados
- Funciona offline para visualização de dados em cache após primeiro carregamento

#### Instalação como PWA

1. Abra o app no navegador do dispositivo
2. **Chrome:** Menu (⋮) → "Adicionar à tela inicial"
3. **Safari (iOS):** Compartilhar (↑) → "Adicionar à Tela de Início"
4. O app aparecerá como ícone na tela inicial do dispositivo

---

## 2. Arquitetura do Sistema

### 2.1 Visão Geral da Arquitetura

O sistema utiliza uma arquitetura de **Índice Unificado** onde o \`UnifiedKanban\` e um dashboard centralizado na página principal consolidam a visualização de tarefas e métricas de todos os módulos. Os módulos satélites (Trabalho, Casa, Saúde) atuam como **provedores de contexto específico**, evitando duplicidade de lógica.

\`\`\`
┌─────────────────────────────────────────────┐
│                 FRONTEND                     │
│  React 18 + TypeScript + Vite + Tailwind    │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Index.tsx │  │ Módulos  │  │  Páginas │  │
│  │ (Hub)    │  │ Satélite │  │ Auxiliar  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │        │
│  ┌────┴──────────────┴──────────────┴────┐  │
│  │        Stores (lib/*.ts)              │  │
│  │   store.ts | casa-store | financial   │  │
│  └───────────────────┬───────────────────┘  │
│                      │                       │
│  ┌───────────────────┴───────────────────┐  │
│  │     Supabase Client (auto-generated)  │  │
│  └───────────────────┬───────────────────┘  │
└──────────────────────┼───────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────┼───────────────────────┐
│                 BACKEND                       │
│            Lovable Cloud                      │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │PostgreSQL│  │  Edge    │  │   Auth   │  │
│  │  + RLS   │  │Functions │  │  System  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└──────────────────────────────────────────────┘
\`\`\`

### 2.2 Stack Frontend

| Tecnologia | Versão | Função |
|------------|--------|--------|
| React | 18.x | Biblioteca de UI com hooks e componentes funcionais |
| TypeScript | 5.x | Tipagem estática para segurança de código |
| Vite | 6.x | Build tool e dev server ultra-rápido |
| Tailwind CSS | 3.x | Framework de estilos utility-first |
| React Router | 6.x | Navegação SPA com rotas protegidas |
| TanStack Query | 5.x | Cache, sincronização e gerenciamento de estado de servidor |
| Recharts | 2.x | Gráficos e visualizações de dados |
| Lucide React | 0.4x | Biblioteca de ícones consistentes |
| shadcn/ui | latest | Componentes de UI acessíveis e customizáveis |
| Framer Motion | latest | Animações fluidas e transições |

### 2.3 Stack Backend (Lovable Cloud)

| Componente | Função |
|------------|--------|
| **PostgreSQL** | Banco de dados relacional com 25+ tabelas |
| **Edge Functions** | 7 funções serverless em Deno para lógica de negócio |
| **Row Level Security (RLS)** | Isolamento de dados por usuário em nível de banco |
| **Realtime** | Atualizações em tempo real via WebSocket |
| **Auth** | Autenticação com email/senha e confirmação de email |
| **Storage** | Armazenamento de arquivos (futuro) |

### 2.4 Edge Functions

| Função | Endpoint | Propósito |
|--------|----------|-----------|
| \`analyze-day\` | POST | Análise diária com IA: gera resumo e sugestões |
| \`classify-task\` | POST | Classificação automática de novas tarefas |
| \`consolidate-logs\` | POST | Consolida lotes de 100 logs em resumos |
| \`daily-nudge\` | POST | Gera nudges personalizados baseados no contexto |
| \`parse-command\` | POST | Interpreta comandos de texto livre para ações |
| \`send-push\` | POST | Envia notificações push via Web Push API |
| \`vapid-public-key\` | GET | Retorna chave pública VAPID para push |

### 2.5 Inteligência Artificial

- **Modelo:** Configurável pelo usuário via chave de API nas Configurações
- **Usos principais:**
  - Classificação automática de tarefas (módulo, tipo, impacto, urgência, estado ideal)
  - Análise diária com resumo de 3 frases e sugestões
  - Nudges personalizados baseados no contexto atual
  - Consolidação de logs em resumos de memória de longo prazo
  - Geração de insights semanais
- **Privacidade:** Todos os dados são processados em funções backend seguras. Nenhum dado é compartilhado com terceiros.

### 2.6 PWA (Progressive Web App)

- **Instalável:** Pode ser adicionado à tela inicial em iOS e Android
- **Offline:** Funciona sem internet para visualização de dados em cache
- **Notificações Push:** Via Web Push API com service worker dedicado (\`sw-push.js\`)
- **Cache:** Workbox com estratégia NetworkFirst para API e cache para assets estáticos

### 2.7 Segurança

| Camada | Mecanismo |
|--------|-----------|
| **Autenticação** | Login com email/senha + confirmação de email obrigatória |
| **Autorização** | Row Level Security (RLS) em todas as tabelas |
| **Isolamento** | Cada usuário só acessa seus próprios dados |
| **Secrets** | Chaves de API armazenadas como secrets do servidor |
| **HTTPS** | Comunicação criptografada ponta a ponta |

---

## 3. Estrutura do Banco de Dados

### 3.1 Visão Geral

O banco de dados PostgreSQL contém **25+ tabelas** organizadas por domínio funcional. Todas as tabelas possuem **Row Level Security (RLS)** ativo.

### 3.2 Tabelas por Domínio

#### 🏠 Core / Sistema

| Tabela | Descrição | Colunas Principais |
|--------|-----------|-------------------|
| \`profiles\` | Perfil do usuário com dados de onboarding | user_id, nome, peso_kg, altura_cm, onboarding_* |
| \`configuracoes\` | Configurações do usuário (chave-valor) | user_id, chave, valor (JSONB) |
| \`activity_log\` | Log de ações do usuário | user_id, acao, contexto, detalhes (JSONB) |
| \`log_consolidado\` | Resumos consolidados pela IA | tipo, periodo_inicio/fim, resumo, metricas |
| \`sessoes_energia\` | Sessões de estado de energia | estado (enum), data, hora_inicio |

#### 💼 Trabalho

| Tabela | Descrição | Colunas Principais |
|--------|-----------|-------------------|
| \`tasks\` | Tarefas unificadas (trabalho/casa/saúde) | titulo, modulo (enum), status (enum), tipo, impacto, urgencia, estado_ideal |
| \`clientes\` | Clientes do módulo trabalho | nome, status, valor_mensal, tipo |

#### 🏡 Casa

| Tabela | Descrição | Colunas Principais |
|--------|-----------|-------------------|
| \`tarefas_casa\` | Tarefas domésticas configuráveis | comodo, tarefa, frequencia, tempo_min |
| \`registros_limpeza\` | Registros de conclusão de tarefas | tarefa_casa_id, comodo, feito_em |
| \`lista_compras\` | Lista de compras categorizada | item, categoria, comprado, quantidade |

#### ❤️ Saúde / Bem-Estar

| Tabela | Descrição | Colunas Principais |
|--------|-----------|-------------------|
| \`medicamentos\` | Cadastro de medicamentos | nome, dose, horarios[], estoque |
| \`registros_medicamento\` | Registros de doses tomadas | medicamento_id, horario_previsto, tomado |
| \`registros_humor\` | Check-ins emocionais | valor (1-5), notas, data |
| \`registros_sono\` | Registros de sono | horario_dormir/acordar, qualidade, duracao_min |
| \`bm_exercicios\` | Registros de exercícios físicos | tipo, duracao_min, intensidade, como_ficou |
| \`bm_refeicoes\` | Registros de refeições | refeicao, qualidade, pulou, categorias[] |
| \`registros_peso\` | Acompanhamento de peso | peso_kg, data, notas |
| \`bm_log_estado\` | Log diário completo de bem-estar | humor, sono_*, exercicio_*, refeicoes_*, ia_score |
| \`bm_metas\` | Metas de bem-estar | dias_exercicio_meta, duracao_meta_min |
| \`bm_analise_semanal\` | Análise semanal de bem-estar pela IA | score_medio, humor_medio, ia_resumo |

#### 💰 Financeiro

| Tabela | Descrição | Colunas Principais |
|--------|-----------|-------------------|
| \`fc_lancamentos\` | Lançamentos financeiros | dia, mes, ano, entrada, saida, saldo, diario |
| \`fc_tags\` | Tags de categorização | nome, emoji, cor |
| \`fc_lancamento_tags\` | Relação N:N lançamentos ↔ tags | lancamento_id, tag_id, valor |
| \`fc_consolidacao\` | Consolidação mensal | mes, ano, total_entradas/saidas, performance |
| \`carteira_docs\` | Documentos da carteira digital | titulo, tipo, dados (JSONB) |

#### 🎯 Metas & Relatórios

| Tabela | Descrição | Colunas Principais |
|--------|-----------|-------------------|
| \`metas_pessoais\` | Metas de curto/médio/longo prazo | titulo, prazo, progresso, status |
| \`reports_semanais\` | Relatórios semanais obrigatórios | destaques[], dificuldades[], reflexao, nota_semana |
| \`reunioes\` | Eventos e reuniões do calendário | titulo, data, hora_inicio/fim, lembrete_min |

#### 🔧 Utilidades

| Tabela | Descrição | Colunas Principais |
|--------|-----------|-------------------|
| \`custom_trackers\` | Trackers personalizáveis | titulo, tipo, modulo, config (JSONB) |
| \`tracker_registros\` | Registros dos trackers customizados | tracker_id, dados (JSONB), data |
| \`diario_entradas\` | Entradas do diário pessoal | texto, sentimento, humor_detectado |
| \`push_subscriptions\` | Assinaturas de notificação push | endpoint, p256dh, auth |

### 3.3 Enums do Banco de Dados

| Enum | Valores | Uso |
|------|---------|-----|
| \`energy_state\` | foco_total, modo_leve, basico | Estado de energia da sessão |
| \`estado_ideal_type\` | foco_total, modo_leve, basico, qualquer | Estado ideal para uma tarefa |
| \`task_modulo\` | trabalho, casa, saude | Módulo da tarefa |
| \`task_owner\` | eu, socio_medico, editor | Responsável pela tarefa |
| \`task_status\` | backlog, hoje, em_andamento, aguardando, feito, descartado | Status da tarefa |
| \`task_tipo\` | estrategico, operacional, delegavel, administrativo, domestico | Tipo da tarefa |

### 3.4 Políticas RLS

Todas as tabelas possuem Row Level Security ativo. Existem dois padrões:

1. **Isolamento por user_id:** Tabelas como \`profiles\`, \`metas_pessoais\`, \`configuracoes\` usam \`auth.uid() = user_id\` para garantir que cada usuário só acessa seus dados.
2. **Acesso autenticado:** Tabelas compartilhadas como \`tasks\`, \`medicamentos\`, \`bm_exercicios\` permitem acesso a qualquer usuário autenticado (projetado para uso single-user).

### 3.5 Funções do Banco

| Função | Tipo | Descrição |
|--------|------|-----------|
| \`reset_my_data\` | RPC | Reseta todos os dados do usuário logado |
| \`reset_user_data\` | RPC | Reseta dados de um usuário específico (admin) |

---

## 4. Fluxos de Usuário

### 4.1 Primeiro Acesso

\`\`\`
Usuário abre o app
  → Tela de Login/Cadastro (/auth)
  → Cria conta com email + senha
  → Recebe email de confirmação
  → Confirma email
  → Redireciona para / (Home)
  → Onboarding aparece automaticamente:
     1. Módulo Saúde: peso, altura, objetivo
     2. Módulo Trabalho: tipo, horas/dia, clientes, desafio
     3. Módulo Casa: moradores, cômodos, pets, frequência
     4. Módulo Financeiro: renda, objetivo, gastos, reserva
  → Perfil salvo → Acesso completo liberado
\`\`\`

### 4.2 Acesso Diário Normal (Terça a Quinta)

\`\`\`
Login → AuthGuard verifica sessão
  → DayGate verifica dia da semana
  → Dia normal → Acesso direto
  → Seleciona Estado de Energia (Foco Total / Modo Leve / Básico)
  → Kanban Unificado carrega tarefas filtradas
  → Dashboard exibe métricas do dia
  → Eventos do calendário exibidos
  → A cada 3h: check-in emocional sugerido
  → Ao concluir tarefas: revelação progressiva ativa
  → Fim do dia: IA analisa e gera resumo
\`\`\`

### 4.3 Segunda-feira (Gating de Metas)

\`\`\`
Login → DayGate detecta segunda-feira
  → Tela de Revisão de Metas (MondayGoalsReview)
  → Usuário revisa cada meta ativa:
     - Atualiza progresso (%)
     - Adiciona nota de evolução
  → Confirma revisão
  → App libera acesso completo
  → Segue fluxo normal
\`\`\`

### 4.4 Sexta-feira (Gating de Relatório)

\`\`\`
Login → DayGate detecta sexta-feira
  → Tela de Relatório Semanal (FridayWeeklyReport)
  → Usuário preenche:
     - Destaques da semana (texto livre, múltiplos)
     - Dificuldades enfrentadas (texto livre, múltiplos)
     - Reflexão pessoal (texto livre)
     - Nota da semana (1-10)
  → Envia relatório → Salvo em reports_semanais
  → App libera acesso completo
\`\`\`

### 4.5 Fluxo de Tarefas

\`\`\`
Quick Capture: usuário digita texto livre
  → Edge Function classify-task analisa com IA
  → Classifica automaticamente:
     - Módulo (trabalho/casa/saúde)
     - Tipo (estratégico/operacional/delegável/administrativo/doméstico)
     - Impacto (1-5)
     - Urgência (1-5)
     - Estado ideal (foco_total/modo_leve/basico/qualquer)
  → Tarefa criada no Kanban (status: backlog ou hoje)
  → Revelação progressiva filtra visibilidade:
     - Base: 3-5 tarefas visíveis
     - Ajuste humor: -2 a +2 tarefas
     - Filtro por estado de energia
  → Usuário move tarefa → Em Andamento → Feito
  → Activity log registra cada ação
\`\`\`

### 4.6 Fluxo de Medicamentos

\`\`\`
Cadastro: nome, dose, horários[], estoque
  → NotificationManager agenda alertas
  → Nos horários programados:
     → Notificação push: "Tomar [Medicamento] ([horário])"
     → Usuário abre app e marca como tomado
     → Estoque decrementado automaticamente
     → Se estoque < 7: alerta de reposição
  → Dashboard saúde exibe adesão diária
\`\`\`

### 4.7 Fluxo de Consolidação de Logs

\`\`\`
Cada ação do usuário → activity_log
  → Ao atingir 200 logs:
     → consolidate-logs Edge Function ativada
     → 100 logs mais antigos → resumidos pela IA
     → Resumo salvo em log_consolidado (tipo: activity_batch)
     → Logs antigos removidos do activity_log
     → 100 logs mais recentes mantidos (contexto da IA)
  → Ao atingir 1000 logs totais (ativos + consolidados):
     → Botão de download disponível (JSON)
\`\`\`

---

## 5. Funcionalidades Detalhadas

### 5.1 Kanban Unificado

O coração do aplicativo. Todas as tarefas de todos os módulos são exibidas em um único quadro Kanban com as colunas:

| Coluna | Descrição |
|--------|-----------|
| **Hoje** | Tarefas planejadas para hoje |
| **Em Andamento** | Tarefas atualmente sendo executadas |
| **Aguardando** | Tarefas bloqueadas ou dependentes de terceiros |
| **Backlog** | Tarefas futuras ou de baixa prioridade |

**Filtros de contexto:** Trabalho, Casa, Saúde — ao alternar, o Kanban filtra pelo módulo e ordena por urgência + prazo.

**Revelação Progressiva:** O número de tarefas visíveis é dinâmico: \`base(3-5) + ajusteHumor(-2 a +2)\`.

### 5.2 Dashboard Centralizado

Painel único com métricas consolidadas:

- Tarefas feitas hoje / total planejado
- Taxa de conclusão (%)
- Trackers customizados com check diário
- Próximos eventos do calendário
- Score de bem-estar (quando disponível)

### 5.3 Quick Capture

Campo de entrada de texto livre que aceita tarefas em linguagem natural. A IA classifica automaticamente a tarefa usando a Edge Function \`classify-task\`.

**Exemplo:** "Ligar para o dentista amanhã" → módulo: saúde, tipo: operacional, urgência: 3, estado_ideal: qualquer

### 5.4 Estados de Energia

| Estado | Ícone | Comportamento |
|--------|-------|---------------|
| **Foco Total** | 🔴 | Mostra tarefas estratégicas e de alto impacto. Exige concentração máxima. |
| **Modo Leve** | 🟡 | Mostra tarefas operacionais e administrativas. Ritmo moderado. |
| **Básico** | 🟢 | Apenas tarefas simples e domésticas. Dia de manutenção, sem pressão. |

### 5.5 Check-in Emocional

- **Frequência:** A cada 3 horas, o app sugere um check-in
- **Escala:** 1 (Muito mal) a 5 (Ótimo)
- **Notas opcionais:** Texto livre para contexto
- **Impacto:** Ajusta dinamicamente o número de tarefas visíveis

### 5.6 Módulo Saúde (Bem-Estar)

#### Medicamentos
- Cadastro com nome, dose, horários e estoque
- Alertas automáticos nos horários programados
- Controle de estoque com alertas de reposição

#### Exercícios
- Registro por tipo (caminhada, corrida, academia, etc.)
- Duração em minutos e intensidade (1-5)
- Avaliação pós-exercício ("como ficou": 1-5)

#### Refeições
- Registro por refeição (café, almoço, jantar, lanche)
- Qualidade da refeição (1-5)
- Indicação de refeições puladas
- Categorias opcionais (proteína, carboidrato, vegetal, etc.)

#### Sono
- Horário de dormir e acordar
- Duração calculada automaticamente
- Qualidade do sono (1-5)

#### Peso
- Registro diário com gráfico histórico
- Notas opcionais

#### Escovação
- Tracker de escovação dental (manhã, tarde, noite)

#### Dashboard Semanal
- Resumo semanal com gráficos de humor, sono, exercícios
- Score de bem-estar calculado pela IA
- Classificação da semana (estável, atenção, alerta)

### 5.7 Módulo Trabalho

- **Clientes:** Cadastro com nome, tipo, valor mensal, contato, status
- **Tarefas vinculadas:** Cada tarefa pode ser vinculada a um cliente
- **Pomodoro:** Timer de 25 minutos integrado às tarefas do dia
- **Classificação IA:** Novas tarefas classificadas automaticamente
- **Subtarefas:** Tarefas podem ter sub-tarefas via \`parent_task_id\`

### 5.8 Módulo Casa

- **Tarefas por Cômodo:** Organização por área (cozinha, banheiro, quarto, etc.)
- **Frequência configurável:** Diária, semanal, quinzenal, mensal
- **Reset às 8h:** Tarefas diárias resetam às 8h (Brasília), sem acúmulo
- **Seeding Inteligente:** Base de tarefas gerada automaticamente pelo perfil
- **Lista de Compras:** Categorizada (mercado, farmácia, casa) com toggle comprado

### 5.9 Módulo Financeiro

- **Lançamentos:** Entradas e saídas com cálculo automático de saldo acumulado
- **Tags:** Categorização com emoji + cor para análise de gastos
- **Consolidação Mensal:** Resumo automático com total de entradas, saídas e performance
- **Carteira Digital:** Armazenamento de documentos e dados importantes (JSON)
- **Horizonte:** Visão projetada de saldo futuro

### 5.10 Metas Pessoais

| Tipo | Prazo |
|------|-------|
| Curto prazo | 1 mês |
| Médio prazo | 6 meses |
| Longo prazo | 1 ano |

- Barra de progresso visual (0-100%)
- Notas de evolução com histórico
- Revisão obrigatória às segundas-feiras

### 5.11 Calendário

- Cadastro de reuniões com data, hora, local, participantes
- Cores personalizáveis por tipo de evento
- Lembretes configuráveis (padrão: 15 minutos antes)
- Visualização integrada na Home (eventos do dia)

### 5.12 Notificações

| Tipo | Gatilho | Frequência |
|------|---------|------------|
| Medicamentos | Horário programado | Conforme cadastro |
| Tarefas Pendentes | 10h e 14h | 2x/dia |
| Check-in Emocional | A cada 3h | ~4x/dia |
| Eventos | Antes do evento | Conforme lembrete_min |

- **Deduplicação:** Tag único por tipo + horário evita repetição
- **Prioridade:** Medicamentos > Eventos > Check-in > Tarefas
- **Limite diário:** Máximo de 5 notificações para evitar fadiga

### 5.13 Trackers Customizáveis

- O usuário pode criar trackers personalizados
- Tipos: recorrente (check diário), quantidade, escala
- Vinculados a módulos (saúde, trabalho, casa)
- Histórico de registros por data

### 5.14 Sistema de Logs

- **Activity Log:** Registra cada ação com contexto e detalhes
- **Consolidação:** A cada 200 logs, os 100 mais antigos são consolidados pela IA
- **Contexto IA:** Últimos 100 logs mantidos ativos para consulta da IA
- **Download:** Disponível ao atingir 1000 logs totais (formato JSON)

---

## 6. Procedimentos Operacionais Padrão (POPs)

### POP 1: Início do Dia

1. Abra o aplicativo
2. Selecione seu Estado de Energia atual (Foco Total / Modo Leve / Básico)
3. Revise as tarefas do dia no Kanban
4. Verifique os eventos do calendário
5. Se segunda-feira: complete a Revisão de Metas primeiro
6. Se sexta-feira: reserve tempo para o Relatório Semanal

### POP 2: Adicionar uma Tarefa

1. Use o campo Quick Capture na parte superior
2. Digite a tarefa em linguagem natural (ex: "Enviar proposta para cliente X até sexta")
3. A IA classifica automaticamente: módulo, tipo, urgência, impacto
4. Revise a classificação e ajuste se necessário
5. A tarefa aparece no Kanban na coluna apropriada

### POP 3: Check-in Emocional

1. Quando o app sugerir (a cada 3h), pare e reflita
2. Selecione seu humor na escala de 1 a 5
3. Opcionalmente, adicione uma nota sobre o que está sentindo
4. O app ajusta automaticamente as tarefas visíveis

### POP 4: Controle de Medicamentos

1. Cadastre seus medicamentos em Configurações > Saúde
2. Informe nome, dose, horários e estoque inicial
3. Quando receber a notificação, abra o app
4. Marque o medicamento como "tomado"
5. Monitore o estoque — o app alerta quando está baixo

### POP 5: Revisão Semanal (Segunda-feira)

1. Abra o app na segunda-feira
2. O painel de Revisão de Metas aparece automaticamente
3. Para cada meta ativa:
   - Atualize o percentual de progresso
   - Adicione uma nota sobre a semana anterior
4. Confirme a revisão para liberar o acesso ao app

### POP 6: Relatório Semanal (Sexta-feira)

1. Abra o app na sexta-feira
2. O formulário de Relatório Semanal aparece automaticamente
3. Liste os destaques da semana (conquistas, entregas)
4. Liste as dificuldades enfrentadas
5. Escreva uma reflexão pessoal
6. Dê uma nota de 1 a 10 para a semana
7. Envie o relatório para liberar o acesso

### POP 7: Tarefas de Casa

1. As tarefas domésticas são configuradas por cômodo
2. Cada tarefa tem uma frequência (diária/semanal/quinzenal/mensal)
3. O app mostra as tarefas devidas para hoje
4. Ao concluir, marque como feita
5. Tarefas diárias resetam automaticamente às 8h da manhã (Brasília)
6. Não há acúmulo — se você perdeu ontem, só aparece a de hoje

### POP 8: Lançamentos Financeiros

1. Acesse o módulo Financeiro
2. Clique em "Novo Lançamento"
3. Informe data, valor de entrada ou saída e descrição
4. Adicione tags para categorização (ex: 🍕 Alimentação, 🏥 Saúde)
5. O saldo é calculado automaticamente
6. Consulte a consolidação mensal para visão macro

---

## 7. Glossário de Termos

| Termo | Definição |
|-------|-----------|
| **Activity Log** | Registro automático de todas as ações do usuário no sistema |
| **Backlog** | Coluna do Kanban para tarefas futuras ou de baixa prioridade |
| **Check-in Emocional** | Registro periódico (a cada 3h) do humor do usuário, na escala de 1 a 5 |
| **Consolidação** | Processo de resumir lotes de 100 logs em resumos pela IA |
| **DayGate** | Sistema de controle de acesso por dia da semana (segunda/sexta) |
| **Edge Function** | Função serverless executada no backend (Deno) para lógica de negócio |
| **Estado de Energia** | Nível de capacidade do usuário: Foco Total, Modo Leve ou Básico |
| **Gating** | Bloqueio de acesso ao app até completar uma ação obrigatória |
| **Kanban** | Quadro visual de tarefas com colunas de status |
| **Log Consolidado** | Resumo gerado pela IA a partir de lotes de logs do activity_log |
| **Módulo** | Área funcional do app (Trabalho, Casa, Saúde, Financeiro) |
| **Nudge** | Sugestão personalizada da IA baseada no contexto atual |
| **Onboarding** | Processo de configuração inicial de cada módulo no primeiro acesso |
| **Pomodoro** | Técnica de produtividade com ciclos de 25 minutos de foco |
| **POP** | Procedimento Operacional Padrão — guia passo a passo para tarefas |
| **PWA** | Progressive Web App — aplicativo web instalável no dispositivo |
| **Quick Capture** | Campo de entrada rápida de tarefas por texto livre |
| **Revelação Progressiva** | Sistema que mostra tarefas gradualmente conforme energia e humor |
| **RLS** | Row Level Security — segurança de dados por linha no banco |
| **Score de Bem-Estar** | Pontuação calculada pela IA baseada em humor, sono, exercício e alimentação |
| **Seeding** | Geração automática de tarefas base para o módulo Casa |
| **Tracker** | Rastreador customizável para hábitos diários |

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
