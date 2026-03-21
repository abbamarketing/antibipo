
# Plano: Gerar relatório .MD com a intencionalidade do AntiBipolaridade

## O que será feito
Gerar um arquivo Markdown (`/mnt/documents/intencionalidade-antibipo.md`) extraindo o "porquê" de cada funcionalidade do app a partir do código, documentação interna e contexto das conversas.

## Estrutura do documento
1. **Tese Central** — Por que o app existe
2. **Princípios Fundadores** — Adaptatividade, não-julgamento, revelação progressiva, memória institucional, privacidade
3. **Cada funcionalidade com sua intenção clínica/comportamental:**
   - DayScore + recalibração pela orquestradora
   - Estados de Energia (Foco Total / Modo Leve / Só o Básico)
   - Check-in Emocional a cada 3h
   - Medicação como âncora do tratamento
   - DayGate (rituais de segunda e sexta)
   - Kanban Unificado com revelação progressiva
   - Multi-Agent System (6 agentes + orquestradora)
   - AlertBanner com linguagem não-diagnóstica
   - DailyNudge com tom adaptativo
   - Módulo Financeiro (gastos impulsivos como marcador maníaco)
   - Calendário (overcommitment = mania, isolamento = depressão)
   - Calibração de thresholds por usuário
   - Painel de Agentes (transparência)
4. **Decisões de design conscientes** (cross-device sync, fallbacks, acessibilidade)

## Implementação
Um script direto que escreve o .MD em `/mnt/documents/`. Sem UI.
